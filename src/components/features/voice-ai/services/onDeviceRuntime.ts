/**
 * UC-13 Voice AI — On-device inference runtime adapter (FR-104 / CAP-06, OQ-03 resolved).
 * LLM: wllama (llama.cpp WASM) chạy GGUF thật on-device — weights từ Cache Storage
 * (stream qua proxy BE vì Mega chặn CORS). Fallback rule-based chỉ khi thiếu weights.
 *   - STT: Web Speech API (SpeechRecognition, khóa en-US cứng — BR-08)
 *   - TTS: SpeechSynthesis (en-US), chỉ phát sau khi LLM xong (BR-01).
 * BE KHÔNG tham gia pipeline hội thoại (C-2) — chỉ proxy bytes weights.
 */
import { Wllama } from '@wllama/wllama';
import type { ModelFormat } from '../types';
import { readComponent } from './weightsCache';
import { decideLlmBackend, type BackendDecision } from './gpuPolicy';

/** Bối cảnh tier cho runtime — id để đọc weights, size để tính VRAM cần cho backend GPU/CPU. */
export interface RuntimeTierCtx {
  tierId: string | null;
  llmSizeMB: number;
}

export type RuntimeComponent = 'stt' | 'llm' | 'tts';

export interface LoadedRuntime {
  transcribe: (audio: Blob) => Promise<string>;
  generate: (systemPrompt: string, history: Array<{ role: 'ai' | 'user'; text: string }>, userText: string) => Promise<string>;
  /** Sinh câu chào mở đầu phiên bằng LLM on-device — fallback câu chào mẫu khi thiếu weights. */
  generateGreeting: (systemPrompt: string) => Promise<string>;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  unloadLlm: () => void;
}

// ── STT Phase 1: Web Speech API NHẬN DIỆN LIVE (khóa en-US cứng — BR-08) ──
// API này không chấp nhận Blob nên chạy song song với MediaRecorder:
// startLiveRecognition() khi bấm mic bắt đầu; stopLiveRecognition() khi dừng.
// Runtime thật (whisper GGUF/ONNX) Phase 2 sẽ thay bằng transcribe(blob).
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

let activeRecognition: SpeechRecognitionLike | null = null;
let finalTranscript = '';
let interimTranscript = '';

/** Trình duyệt có hỗ trợ Web Speech API không (Chrome/Edge: có; Firefox: không). */
export const isLiveRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
};

/** Bắt đầu nhận diện live — gọi khi bấm mic bắt đầu ghi âm. Trả false nếu không hỗ trợ. */
export const startLiveRecognition = (): boolean => {
  if (activeRecognition) return true;
  if (!isLiveRecognitionSupported()) return false;
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition: SpeechRecognitionLike = new Ctor();
  recognition.lang = 'en-US'; // BR-08: khóa en-US cứng
  recognition.continuous = true;
  recognition.interimResults = true;
  finalTranscript = '';
  interimTranscript = '';
  recognition.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) finalTranscript += result[0].transcript + ' ';
      else interim += result[0].transcript;
    }
    interimTranscript = interim;
  };
  recognition.onerror = () => {
    /* giữ transcript đã gom — pipeline xử lý AF-06 nếu rỗng */
  };
  recognition.onend = () => {
    // Chrome tự cắt session khi im lặng — restart để gom tiếp nếu vẫn đang ghi
    if (activeRecognition === recognition) {
      try {
        recognition.start();
      } catch {
        activeRecognition = null;
      }
    }
  };
  try {
    recognition.start();
    activeRecognition = recognition;
    return true;
  } catch {
    return false;
  }
};

/** Dừng nhận diện — gọi khi bấm mic dừng. Trả transcript đã gom (final + interim). */
export const stopLiveRecognition = (): Promise<string> => {
  const recognition = activeRecognition;
  activeRecognition = null;
  if (!recognition) {
    return Promise.resolve((finalTranscript + ' ' + interimTranscript).trim());
  }
  return new Promise<string>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve((finalTranscript + ' ' + interimTranscript).trim());
    };
    recognition.onend = finish;
    try {
      recognition.stop();
    } catch {
      finish();
    }
    // onend không đảm bảo bắn ngay — chờ tối đa 800ms rồi lấy kết quả
    setTimeout(finish, 800);
  });
};

const buildConversationReply = (
  systemPrompt: string,
  history: Array<{ role: 'ai' | 'user'; text: string }>,
  userText: string,
): string => {
  void history;
  // Trích chủ đề từ system prompt (chủ đề mồi qua prompt — BR-02)
  const topicMatch = systemPrompt.match(/topic[s]?\s*[:\-]\s*([^.!\n]+)/i);
  const topic = topicMatch?.[1]?.trim() ?? 'your day';
  const openers = [
    `That's interesting! Tell me more about ${topic.toLowerCase()}.`,
    `Great! What else about ${topic.toLowerCase()}?`,
    `I see. How did that make you feel?`,
    `Nice — can you say more about that?`,
    `Good job! Now, let's talk more about ${topic.toLowerCase()}. What do you think?`,
  ];
  const filler = userText.trim().length === 0 ? 'Could you say that again?' : openers[Math.floor(Math.random() * openers.length)];
  return filler;
};

// ── LLM thật: wllama (llama.cpp WASM) chạy GGUF on-device theo FR-104 ──
// Weights GGUF đã stream về Cache Storage qua proxy BE (Mega chặn CORS).
// Fallback rule-based CHỈ khi chưa tải được weights (chưa vào phiên).
let wllamaInstance: Wllama | null = null;
let loadedTierId: string | null = null;

/**
 * Model nhỏ (vd LFM2 1.2B) hay nhả stage-direction kiểu *smiling*, *nods* —
 * cắt hết trước khi TTS + phụ đề, chỉ giữ lời nói. Rỗng sau khi cắt → caller fallback.
 */
const sanitizeSpokenText = (text: string): string =>
  limitSentences(
    stripInstructions(
      stripMeta(
        stripRoleplay(text)
          .replace(/\*[^*\n]+\*/g, ' ')
          .replace(/_[^_\n]+_/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim(),
      ),
    ),
  );

// Model nhỏ hay nhại lại câu chữ trong system prompt ("Start with a question...",
// "As we talk...", "focus words...") — cắt các câu mang mùi instruction để khỏi
// đọc hướng dẫn cho user nghe
const INSTRUCTION_SENTENCE_RE =
  /focus words?|follow-up question|short follow-up|\d+-\d+ exchanges|everyday topics?|start with a (concrete|fun|short|direct) question|as we talk|never ask multiple|never write|never invent|always reply in english|keep answers short/i;

const stripInstructions = (text: string): string => {
  const parts = text.match(/[^.?!]+[.?!]+["']?/g);
  if (!parts) return text;
  const kept = parts.filter((s) => !INSTRUCTION_SENTENCE_RE.test(s));
  // Toàn bộ là instruction nhại lại → trả rỗng để caller dùng câu dự phòng
  if (kept.length === 0) return '';
  return kept.join(' ').trim();
};

// Câu meta rỗng ("I'm here chatting with you", "How can I help you") — model nhỏ
// hay mở bài bằng câu này, cắt để khỏi làm user ngơ ngác không biết nói gì
const META_SENTENCE_RE =
  /\b(i['’]m here (chatting with you|to chat)|i am here (chatting with you|to chat)|how can i (help|assist) you|as an ai language model)\b[^.?!]*[.?!]?/gi;

const stripMeta = (text: string): string =>
  text.replace(META_SENTENCE_RE, ' ').replace(/\s{2,}/g, ' ').trim();

// Rút danh sách focus words từ session prompt để dựng câu chào dự phòng có chủ đề.
// Chú ý cắt dấu câu cuối ("everyday topics." ≠ từ cần học) — từng lọt "everyday topics" vào câu chào.
const focusFromPrompt = (prompt: string): string[] => {
  const m = prompt.match(/Today's focus words:\s*([^\n]+)/i);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/[.?!]+$/, ''))
    .filter((s) => s.length > 0 && s.toLowerCase() !== 'everyday topics');
};

// Câu chào dự phòng khi model chỉ nhả meta rỗng — luôn là câu hỏi cụ thể, không bao giờ cụt
const fallbackOpener = (prompt: string): string => {
  const fw = focusFromPrompt(prompt);
  if (fw.length > 0) return `Hi! Let's talk about ${fw[0]}. What did you do with it recently?`;
  return "Hi! What's something fun you did recently?";
};

// Model nhỏ hay tự biên cả 2 vai ("You: I'm fine...") — cắt từ dòng đó trở đi
const stripRoleplay = (text: string): string => {
  const lines = text.split('\n');
  const cut = lines.findIndex((l) => /^\s*(user|learner|you|student)\s*:/i.test(l));
  return (cut === -1 ? lines : lines.slice(0, cut)).join(' ').trim();
};

// Ép tối đa 2 câu — model có hỏi 1 nùi cũng chỉ giữ 2 câu đầu
const limitSentences = (text: string, max = 2): string => {
  const parts = text.match(/[^.?!]+[.?!]+["']?/g);
  if (!parts || parts.length <= max) return text;
  return parts.slice(0, max).join(' ').trim();
};

// Đảm bảo mỗi lượt AI đều có câu hỏi để user trả lời — model nhỏ hay quên.
// Không thấy '?' thì gắn 1 câu hỏi dự phòng (xoay vòng cho đỡ lặp).
const FALLBACK_QUESTIONS = [
  'What about you?',
  'Can you tell me more?',
  'What do you think?',
  'Really? Tell me more!',
];

const ensureQuestion = (text: string): string => {
  if (!text || text.includes('?')) return text;
  const q = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
  const base = /[.!.]$/.test(text) ? text : `${text}.`;
  return `${base} ${q}`;
};
let lastSource: 'llm' | 'fallback' | null = null;
let lastDecision: BackendDecision | null = null;
/** Sau 1 lần crash WebGPU lúc suy luận → các lần nạp sau ép CPU, khỏi crash lại. */
let forceCpuBackend = false;

/** Dọn instance wllama (kể cả đã crash) để nạp lại sạch. */
const resetWllamaInstance = (): void => {
  try {
    void wllamaInstance?.exit();
  } catch {
    // bỏ qua lỗi dọn dẹp
  }
  wllamaInstance = null;
  loadedTierId = null;
};

/** Nhận diện crash GPU (WebGPU queue timeout / abort / OOM) để retry bằng CPU. */
const isGpuCrash = (err: unknown): boolean => {
  const s = `${err instanceof Error ? `${err.name} ${err.message}` : String(err)}`;
  return /crash|abort|webgpu|queue|unreachable|out of memory|OOM/i.test(s);
};

/**
 * Chạy 1 lượt suy luận, tự cứu khi WebGPU sập giữa chừng: nạp lại model bằng CPU
 * rồi thử lại đúng 1 lần. Hết cứu / lỗi khác → null để caller fallback rule-based.
 */
const runWithRecovery = async (
  id: string,
  llmSizeMB: number,
  infer: (w: Wllama) => Promise<string | null>,
): Promise<string | null> => {
  const attempt = async (): Promise<string | null> => {
    const w = await ensureWllama(id, llmSizeMB);
    if (!w) return null;
    try {
      return await infer(w);
    } catch (err) {
      if (!forceCpuBackend && lastDecision?.backend === 'gpu' && isGpuCrash(err)) {
        forceCpuBackend = true;
        resetWllamaInstance();
        console.warn('[UC-13] WebGPU sập khi suy luận (queue timeout/crash) — nạp lại model bằng CPU rồi thử lại 1 lần...');
        const w2 = await ensureWllama(id, llmSizeMB);
        if (!w2) return null;
        return await infer(w2);
      }
      throw err;
    }
  };
  try {
    return await attempt();
  } catch (err) {
    console.error('[UC-13] LLM suy luận lỗi — fallback. Mở getLlmDiagnostics(tierId) để xem cache:', err);
    return null;
  }
};

/** Nguồn của câu trả lời gần nhất — UI dùng để hiện cảnh báo thay vì fallback im lặng. */
export const getLastLlmSource = (): 'llm' | 'fallback' | null => lastSource;

/** Quyết định backend GPU/CPU gần nhất — UI dùng để gợi ý bật card rời khi rớt CPU. */
export const getLastBackendDecision = (): BackendDecision | null => lastDecision;

const WLLAMA_CONFIG_PATHS = {
  'default': '/wllama.wasm',
};

/** Map history hội thoại UC-13 (role ai/user) sang OpenAI-style cho wllama. */
const toWllamaMessages = (
  systemPrompt: string,
  history: Array<{ role: 'ai' | 'user'; text: string }>,
  userText: string,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> => [
  { role: 'system', content: systemPrompt },
  ...history.slice(-8).map((m) => ({
    role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
    content: m.text,
  })),
  { role: 'user', content: userText },
];

/**
 * Load wllama instance với weights GGUF từ Cache Storage.
 * Trả null nếu chưa có weights (chưa tải tier) → caller dùng rule-based fallback.
 * FIX: trước đây lookup cứng 'model.gguf' + fallback im lặng nên LLM hỏng mà UI
 * vẫn chạy bình thường. Giờ quét cả tên file khác, validate magic GGUF và log rõ.
 */
async function findLlmBlob(tierId: string): Promise<{ blob: Blob; fileName: string } | null> {
  // 1. Tên chuẩn theo seed (light/high/ultra/extreme đều là 'model.gguf')
  const direct = await readComponent(tierId, 'llm', 'model.gguf');
  if (direct && direct.size > 1024) return { blob: direct, fileName: 'model.gguf' };
  // 2. BE có thể đặt tên file khác — quét cache tìm file .gguf trong /llm/
  try {
    const cache = await caches.open(`voice-ai-weights-${tierId}`);
    for (const req of await cache.keys()) {
      if (req.url.includes('/llm/') && req.url.endsWith('.gguf')) {
        const res = await cache.match(req);
        const blob = await res?.blob();
        if (blob && blob.size > 1024) {
          return { blob, fileName: req.url.substring(req.url.lastIndexOf('/') + 1) };
        }
      }
    }
  } catch {
    // Cache Storage không khả dụng — trả null để caller fallback
  }
  return null;
}

async function isGgufFile(blob: Blob): Promise<boolean> {
  try {
    return (await blob.slice(0, 4).text()) === 'GGUF';
  } catch {
    return false;
  }
}

async function ensureWllama(tierId: string, llmSizeMB: number): Promise<Wllama | null> {
  // Singleton theo tier — đổi tier phải unload model cũ (trước đây return instance
  // cũ dù tier đã đổi vì chỉ check null).
  if (wllamaInstance && loadedTierId === tierId) return wllamaInstance;
  if (wllamaInstance) {
    try {
      void wllamaInstance.exit();
    } catch {
      // bỏ qua lỗi dọn dẹp
    }
    wllamaInstance = null;
    loadedTierId = null;
  }
  // Đọc GGUF Blob từ Cache Storage (FE đã stream qua proxy BE vì Mega chặn CORS)
  const found = await findLlmBlob(tierId);
  if (!found) {
    console.warn(
      `[UC-13] LLM: không thấy weights llm trong Cache (tier ${tierId}) — fallback rule-based. ` +
        `Hãy kiểm tra Application → Cache Storage → voice-ai-weights-${tierId} rồi tải lại weights.`,
    );
    return null;
  }
  console.log(
    `[UC-13] LLM: thấy ${found.fileName} ${(found.blob.size / 1048576).toFixed(1)}MB, kiểm tra magic GGUF...`,
  );
  if (!(await isGgufFile(found.blob))) {
    console.error(
      `[UC-13] LLM: file ${found.fileName} KHÔNG phải GGUF (4 byte đầu sai magic) — ` +
        `khả năng link Mega chết hoặc download lỗi. Xóa cache + tải lại. Fallback rule-based.`,
    );
    return null;
  }
  try {
    // Chọn backend theo VRAM thật: GPU đủ chỗ mới offload, không thì CPU (n_gpu_layers: 0).
    // Sau 1 lần crash WebGPU thì ép CPU luôn (forceCpuBackend) thay vì thử GPU lại.
    const sizeMB = llmSizeMB > 0 ? llmSizeMB : found.blob.size / 1048576;
    let decision = await decideLlmBackend(sizeMB);
    if (forceCpuBackend && decision.backend === 'gpu') {
      decision = { ...decision, backend: 'cpu', reason: 'webgpu-crash-retry' };
    }
    lastDecision = decision;
    const vramTxt = decision.vramGB == null ? 'không rõ' : `~${decision.vramGB}GB`;
    console.log(
      `[UC-13] LLM backend → ${decision.backend.toUpperCase()} (${decision.reason} | GPU: ${decision.gpuLabel} | VRAM ${vramTxt} vs cần ~${decision.needMB}MB)`,
    );
    const wllama = new Wllama(WLLAMA_CONFIG_PATHS);
    await wllama.loadModel(
      [found.blob],
      decision.backend === 'cpu'
        // CPU: n_ctx nhỏ cho prefill nhanh + đa luồng (cần COOP/COEP headers, xem vite.config)
        ? { n_threads: 4, n_ctx: 1024, n_gpu_layers: 0 }
        : { n_threads: 4, n_ctx: 2048 },
    );
    wllamaInstance = wllama;
    loadedTierId = tierId;
    console.log('[UC-13] LLM: load thành công — từ giờ dùng LLM thật.');
    return wllamaInstance;
  } catch (err) {
    console.error(
      '[UC-13] LLM: wllama.loadModel thất bại (OOM tab / GGUF không tương thích / lỗi WASM) — fallback rule-based. Chi tiết:',
      err,
    );
    wllamaInstance = null;
    loadedTierId = null;
    return null;
  }
}

// Câu chào fallback cũ đã thay bằng fallbackOpener() (câu hỏi cụ thể theo focus words)

// Câu mồi chào đầu phiên — xoay vòng để mỗi phiên mở đầu khác nhau
// (system prompt điều khiển vai trò/chủ đề, câu này chỉ điều khiển CÁCH chào).
// Tất cả đều ÉP mở bằng câu hỏi cụ thể + CẤM meta-talk ("I'm here chatting...").
const GREETING_INSTRUCTIONS = [
  'Start our English practice with ONE concrete question using a focus word (e.g. about yesterday). Never open with meta talk like "I\'m here chatting with you" or "How can I help you". Two sentences max.',
  'Open with a fun, specific question about everyday life (not "How are you"). End with a question mark. Two sentences max.',
  'Jump straight into an interesting topic (food, hobbies, weekend plans) with a direct question. No self-introduction, no meta talk. Two sentences max.',
];

/**
 * Sinh câu chào mở đầu phiên bằng LLM on-device (wllama).
 * Model chỉ nhả meta rỗng / lỗi / thiếu weights → dựng câu hỏi cụ thể từ focus words.
 */
const createLlmGreeting = (getCtx: () => RuntimeTierCtx): LoadedRuntime['generateGreeting'] => {
  return async (systemPrompt: string) => {
    const { tierId: id, llmSizeMB } = getCtx();
    if (id) {
      const opener = GREETING_INSTRUCTIONS[Math.floor(Math.random() * GREETING_INSTRUCTIONS.length)];
      const text = await runWithRecovery(id, llmSizeMB, (w) =>
        w
          .createChatCompletion({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: opener },
            ],
            max_tokens: 60,
            temperature: 0.9, // cao hơn để mỗi phiên chào khác nhau
            top_k: 50,
            top_p: 0.9,
            penalty_repeat: 1.05, // phạt lặp từ — model đỡ nhai lại
          })
          .then((r) => r.choices[0]?.message?.content?.trim() ?? null),
      );
      const cleanGreeting = sanitizeSpokenText(text ?? '');
      if (cleanGreeting) {
        lastSource = 'llm';
        return ensureQuestion(cleanGreeting);
      }
    }
    lastSource = 'fallback';
    return fallbackOpener(systemPrompt);
  };
};

/**
 * Sinh câu trả lời bằng LLM GGUF on-device (FR-104). Fallback rule-based
 * nếu weights chưa có / wllama fail — phiên vẫn chạy không chết.
 */
const createLlmGenerate = (getCtx: () => RuntimeTierCtx): LoadedRuntime['generate'] => {
  return async (systemPrompt, history, userText) => {
    const { tierId: id, llmSizeMB } = getCtx();
    if (id) {
      const text = await runWithRecovery(id, llmSizeMB, (w) =>
        w
          .createChatCompletion({
            messages: toWllamaMessages(systemPrompt, history, userText),
            max_tokens: 80,
            temperature: 0.7,
            top_k: 50,
            top_p: 0.9,
            penalty_repeat: 1.05, // phạt lặp từ — model đỡ nhai lại
          })
          .then((r) => r.choices[0]?.message?.content?.trim() ?? null),
      );
      const cleanReply = sanitizeSpokenText(text ?? '');
      if (cleanReply) {
        lastSource = 'llm';
        return ensureQuestion(cleanReply);
      }
    }
    lastSource = 'fallback';
    return buildConversationReply(systemPrompt, history, userText);
  };
};

const createSpeechSynthesis = (): LoadedRuntime['speak'] => {
  return async (text: string) => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };
};

// Load runtime theo format per component (OQ-03 dual adapter).
// tierId: để load weights GGUF LLM từ Cache Storage (FR-104 on-device thật).
// opts.llmSizeMB: dung lượng LLM của tier — để gpuPolicy tính VRAM cần cho backend GPU/CPU.
// Trả về runtime + unloadLlm để caller dọn khi đổi tier (BR-03).
export const loadRuntime = async (
  _components: { stt: ModelFormat; llm: ModelFormat; tts: ModelFormat },
  tierId: string | null = null,
  opts?: { llmSizeMB?: number },
): Promise<LoadedRuntime> => {
  void _components;
  let currentTierId = tierId;
  const currentLlmSizeMB = opts?.llmSizeMB ?? 0;
  const getCtx = (): RuntimeTierCtx => ({ tierId: currentTierId, llmSizeMB: currentLlmSizeMB });
  return {
    // STT live qua Web Speech API (startLive/stopLiveRecognition) — transcribe(blob)
    // vẫn là placeholder chờ runtime weights thật; pipeline ưu tiên transcript live.
    transcribe: async (audio: Blob) => {
      void audio;
      return '';
    },
    generate: createLlmGenerate(getCtx),
    generateGreeting: createLlmGreeting(getCtx),
    speak: createSpeechSynthesis(),
    stopSpeaking: () => {
      window.speechSynthesis?.cancel();
    },
    unloadLlm: () => {
      currentTierId = null;
      forceCpuBackend = false;
      resetWllamaInstance();
      lastSource = null;
    },
  };
};

/**
 * Chẩn đoán nhanh trong DevTools Console khi nghi LLM fallback:
 *   import { getLlmDiagnostics } from './services/onDeviceRuntime';
 *   await getLlmDiagnostics('<tierId>');
 * Liệt kê mọi file trong Cache của tier + size + magic 4 byte đầu.
 */
export const getLlmDiagnostics = async (tierId: string): Promise<Record<string, unknown>> => {
  const info: Record<string, unknown> = {
    tierId,
    modelLoaded: wllamaInstance != null,
    loadedTierId,
    lastSource,
    lastBackend: lastDecision,
    forceCpuBackend,
  };
  try {
    const cache = await caches.open(`voice-ai-weights-${tierId}`);
    const keys = await cache.keys();
    info.cacheKeys = keys.map((k) => k.url);
    for (const k of keys) {
      const res = await cache.match(k);
      const blob = await res?.blob();
      if (blob) {
        let magic = '?';
        try {
          magic = await blob.slice(0, 4).text();
        } catch {
          magic = 'unreadable';
        }
        info[k.url] = { sizeMB: +(blob.size / 1048576).toFixed(1), magic };
      }
    }
  } catch (e) {
    info.cacheError = String(e);
  }
  console.log('[UC-13] diagnostics', info);
  return info;
};
