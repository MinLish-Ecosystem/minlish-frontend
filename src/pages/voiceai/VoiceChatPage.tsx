/**
 * UC-13 Voice AI — Voice Chat page (FR-100..105, route /voice-chat, ProtectedRoute + MainLayout).
 * Compose toàn bộ feature: catalog + device detect → tier select → weights download →
 * mic toggle → STT→LLM→TTS on-device → rule-based scoring → session completion.
 * Phiên ephemeral: chat + điểm chỉ trong React state — reload là mất (CAP-09, SRS 2.0).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Languages, Mic, Play, RotateCcw, WifiOff } from 'lucide-react';
import {
  AiAvatar,
  ChatBubbleAi,
  ChatBubbleUser,
  DeviceHintBanner,
  DownloadProgressPanel,
  MicButton,
  MicPermissionGuide,
  SessionCompleteScreen,
  SwitchTierConfirmModal,
  TierSelector,
} from '../../components/features/voice-ai';
import {
  useDeviceSpec,
  useMicRecorder,
  useSpeechScoring,
  useTierCatalog,
  useTierManager,
  useVocabBonus,
  useVoicePipeline,
  useWeightsDownload,
} from '../../components/features/voice-ai/hooks';
import type { VocabBonusLists } from '../../components/features/voice-ai/hooks/useSpeechScoring';
import type { AvatarState, ChatMessage, MicState } from '../../components/features/voice-ai/types';
import {
  getCachedTierId,
  isTierCached,
  purgeAllWeights,
  verifyLlmBlob,
} from '../../components/features/voice-ai/services/weightsCache';
import { getLastBackendDecision, getLastLlmSource } from '../../components/features/voice-ai/services/onDeviceRuntime';
import { buildTopicSeed, fetchLearnerVars, pickFocusWords } from '../../components/features/voice-ai/services/topicSeed';
import { renderPromptTemplate } from '../../components/features/voice-ai/services/promptTemplate';
import { translateEnToVi } from '../../components/features/voice-ai/services/translate';
import api from '../../lib/api';

const generateId = () => Math.random().toString(36).substring(2, 10);

export default function VoiceChatPage() {
  // ── Catalog + device ─────────────────────────────────────
  const { deviceSpec, storageQuota, detected } = useDeviceSpec();
  const { tiers, systemPrompt, loading: catalogLoading, error: catalogError, refetch } = useTierCatalog();
  const {
    activeTierId,
    recommendedTierId,
    eligibilityOf,
    selectTier,
    confirmSwitch,
    cancelSwitch,
    switchConfirmVisible,
    pendingTierId,
  } = useTierManager(deviceSpec, storageQuota, tiers);

  const { downloadState, progress, errorMessage, startDownload, retry, markReady } = useWeightsDownload();
  const { refreshVocab } = useVocabBonus();
  // Từ vựng bonus của phiên (due + mới) — lấy 1 lần lúc vào phiên, best-effort
  const vocabRef = useRef<VocabBonusLists>({ due: [], fresh: [] });
  // Prompt thật của phiên = system prompt + seed từ vựng (80/20) — log ra Console để thử nghiệm
  const sessionPromptRef = useRef('');
  const { micState, permissionDenied, recordingSeconds, startMic, stopMic } = useMicRecorder();
  const { phase, prepareRuntime, unloadRuntime, run, generateOnly, generateGreeting, speakAi, stopSpeaking } = useVoicePipeline();

  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cachedTierIds, setCachedTierIds] = useState<string[]>([]);
  // ── Sân khấu "nghe-nói mù chữ": mặc định KHÔNG chữ. Replay 1 lượt AI mới hiện
  // phụ đề EN của lượt đó; nút dịch (tắt mặc định) thêm bản VI.
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [translateOn, setTranslateOn] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Array<{ role: 'ai' | 'user'; text: string }>>([]);
  const lastAiQuestionRef = useRef<string>('');
  // Số liệu phiên để ghi streak BE khi đạt targetScore (fire-and-forget, lỗi không đứt phiên)
  const utteranceCountRef = useRef(0);
  const scoreTotalRef = useRef(0);
  const sessionStartRef = useRef(0);

  // Ghi 1 phiên voice hoàn thành vào BE để cộng streak (chỉ gọi khi đạt targetScore)
  const postVoiceSession = useCallback(() => {
    const utterances = utteranceCountRef.current;
    if (utterances <= 0) return;
    const timeSpent =
      sessionStartRef.current > 0 ? Math.max(0, Math.round((Date.now() - sessionStartRef.current) / 1000)) : 0;
    void api
      .post('/api/v1/voice-ai/sessions', {
        utterances,
        score: scoreTotalRef.current,
        timeSpent,
        ...(activeTierId ? { tierId: activeTierId } : {}),
      })
      .catch((e) => console.warn('[UC-13] Ghi session voice thất bại (phiên vẫn tính hoàn thành):', e));
  }, [activeTierId]);

  const onTargetReached = useCallback(() => {
    setSessionComplete(true);
    postVoiceSession();
  }, [postVoiceSession]);
  const { accumulatedScore, targetScore, scoreUtterance, resetSession } = useSpeechScoring({ onTargetReached });

  const activeTier = useMemo(() => tiers.find((t) => t._id === activeTierId) ?? null, [tiers, activeTierId]);
  const recommendedTierName = tiers.find((t) => t._id === recommendedTierId)?.name ?? null;
  const isDownloaded = activeTierId != null && isTierCached(activeTierId);
  const downloading =
    downloadState === 'fetching-links' || downloadState === 'downloading' || downloadState === 'loading-runtime';

  // Refresh cached tier list mỗi khi catalog refetch hoặc downloadState đổi
  useEffect(() => {
    const cachedId = getCachedTierId();
    setCachedTierIds(cachedId ? [cachedId] : []);
  }, [downloadState, catalogLoading]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Câu chào đầu tiên từ LLM sau khi runtime sẵn sàng (user-initiated session đã bắt đầu qua mic)
  const greetingRequestedRef = useRef(false);
  const fallbackWarnedRef = useRef(false);

  // Flow mới (2026-09-01, cập nhật BA sau): Play → vào phiên → AI chào (lượt AI) → mở mic lượt user.
  // Mic KHÓA khi: chưa vào phiên / weights đang tải / AI đang nói (TTS) / LLM đang suy nghĩ.
  const aiSpeaking = phase === 'tts' || phase === 'llm' || phase === 'stt';
  const effectiveMicState: MicState = !sessionStarted
    ? 'disabled'
    : downloading && !isDownloaded
      ? 'blocked-download'
      : aiSpeaking
        ? 'processing'
        : micState;

  const avatarState: AvatarState = sessionComplete
    ? 'hidden'
    : effectiveMicState === 'recording'
      ? 'listening'
      : phase === 'stt' || phase === 'llm'
        ? 'thinking'
        : phase === 'tts'
          ? 'speaking'
          : 'idle';

  // ── Sân khấu "mù chữ": lượt AI mới nhất + lượt được replay mới hiện phụ đề ──
  const lastAiMsg = useMemo(() => [...messages].reverse().find((m) => m.role === 'ai') ?? null, [messages]);
  const revealedAiMsg = lastAiMsg && revealedIds.has(lastAiMsg.id) ? lastAiMsg : null;

  // Dịch EN→VI khi bật toggle và đang có phụ đề EN (cache theo câu trong translate.ts)
  useEffect(() => {
    if (!translateOn || !revealedAiMsg || translations[revealedAiMsg.id] || translating) return;
    let cancelled = false;
    setTranslating(true);
    translateEnToVi(revealedAiMsg.text).then(
      (vi) => {
        if (cancelled) return;
        setTranslations((p) => ({ ...p, [revealedAiMsg.id]: vi }));
        setTranslating(false);
      },
      () => {
        if (cancelled) return;
        setTranslations((p) => ({ ...p, [revealedAiMsg.id]: '⚠️ Không dịch được, kiểm tra mạng.' }));
        setTranslating(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [translateOn, revealedAiMsg, translations, translating]);

  // Nút "Nghe lại": TTS nói lại lượt AI mới nhất + hiện phụ đề EN của lượt đó
  const handleReplayLast = useCallback(() => {
    if (!lastAiMsg || aiSpeaking) return;
    setRevealedIds((prev) => new Set(prev).add(lastAiMsg.id));
    void speakAi(lastAiMsg.text);
  }, [lastAiMsg, aiSpeaking, speakAi]);

  const resetStageState = useCallback(() => {
    setRevealedIds(new Set());
    setTranslations({});
    setTranslating(false);
    setTranslateOn(false);
    fallbackWarnedRef.current = false;
  }, []);

  const loadRuntimeFor = useCallback(async () => {
    if (!activeTier) return;
    // Dual adapter theo format (OQ-03) + truyền tierId để load GGUF LLM từ Cache Storage (FR-104)
    // + llmSizeMB để gpuPolicy chọn backend GPU (đủ VRAM) hay CPU
    await prepareRuntime(
      {
        stt: activeTier.components.stt.name.includes('onnx') ? 'onnx' : 'gguf',
        llm: 'gguf',
        tts: activeTier.components.tts.name.includes('onnx') ? 'onnx' : 'gguf',
      },
      activeTier._id,
      { llmSizeMB: activeTier.components.llm.sizeMB },
    );
  }, [activeTier, prepareRuntime]);

  // Phase 1: runtime fallback (Web Speech + SpeechSynthesis + rule-based LLM) KHÔNG cần weights.
  // Weights (Phase 2 — GGUF/ONNX thật) tải best-effort nền, lỗi Mega CORS KHÔNG chặn mic nữa.
  const ensureRuntimeReady = useCallback(async (): Promise<boolean> => {
    if (!activeTier) return false;
    await loadRuntimeFor();
    return true;
  }, [activeTier, loadRuntimeFor]);

  // Flow mới: bấm Play → vào phiên → AI chào trước (lượt AI, mic khóa) → hết lượt AI mở mic
  // Câu chào sinh bởi LLM on-device (FR-104) — mỗi phiên khác nhau; fallback câu mẫu khi thiếu weights
  const handleStartSession = useCallback(async () => {
    if (sessionStarted || sessionComplete || !activeTier) return;
    const ready = await ensureRuntimeReady();
    if (!ready) return;
    // Chưa có weights (hoặc blob LLM đã bị browser evict dù metadata còn) → tải xong mới vào phiên
    if (!isTierCached(activeTier._id) || !(await verifyLlmBlob(activeTier._id))) {
      if (isTierCached(activeTier._id)) {
        toast('Weights LLM bị thiếu trong cache, đang tải lại…', { icon: '⬇️' });
        await purgeAllWeights();
      }
      if (downloadState !== 'idle' && downloadState !== 'error') return;
      const success = await startDownload(activeTier);
      if (!success) return; // lỗi tải → ở màn chọn tier, có nút retry
    }
    // Lấy từ vựng bonus (due + mới) song song lúc nạp LLM — lỗi thì chấm base, không chặn phiên
    vocabRef.current = await refreshVocab();
    // Prompt mẫu hóa: fill {{focus_words}}/{{level}}/{{name}} theo từng người.
    // Prompt cũ không có token {{focus_words}} thì nối đoạn seed legacy (tương thích DB cũ).
    const { focus } = pickFocusWords(vocabRef.current.due, vocabRef.current.fresh);
    const learner = await fetchLearnerVars();
    const { text: rendered } = renderPromptTemplate(systemPrompt, {
      focus_words: focus.length > 0 ? focus.join(', ') : 'everyday topics',
      level: learner.level,
      name: learner.name,
    });
    sessionPromptRef.current = systemPrompt.includes('{{focus_words}}')
      ? rendered
      : rendered + buildTopicSeed(vocabRef.current.due, vocabRef.current.fresh);
    // Wllama load GGUF 760MB có thể mất vài chục giây lần đầu — toast giữ chỗ để user biết
    const loadToast = toast.loading('Đang nạp model LLM vào RAM…');
    // In full system prompt để thử nghiệm prompt (copy từ Console, khỏi mò DB)
    console.log('[UC-13] systemPrompt đang dùng:', JSON.stringify(sessionPromptRef.current || systemPrompt));
    let greetingText: string;
    try {
      greetingText =
        (await generateGreeting(sessionPromptRef.current || systemPrompt)) ||
        "Hi! I'm your English partner. Let's talk!";
    } finally {
      toast.dismiss(loadToast);
      markReady();
    }
    if (getLastLlmSource() === 'fallback') {
      toast('LLM chưa chạy được (nạp lỗi hoặc sập khi nghĩ) nên AI đang trả lời dự phòng — mở Console lọc [UC-13] để xem nguyên nhân.', {
        icon: '⚠️',
      });
    }
    // Máy 2 card mà rớt về CPU (VRAM onboard không đủ) → chỉ cách bật card rời.
    // Browser trên Windows không cho JS ép card (Chromium bỏ qua powerPreference),
    // nên phải chỉnh ở OS: Settings → Display → Graphics → Edge → High performance.
    const backendDecision = getLastBackendDecision();
    if (backendDecision?.backend === 'cpu' && backendDecision.reason === 'vram-low') {
      toast(
        'Đang chạy LLM bằng CPU vì card onboard thiếu chỗ. Máy có card rời thì vào Windows Graphics chỉnh Edge lên High performance rồi mở lại.',
        { icon: '🎮', duration: 8000 },
      );
    }
    setSessionStarted(true);
    greetingRequestedRef.current = true;
    // Mốc tính thời gian phiên + reset số liệu streak cho phiên mới
    sessionStartRef.current = Date.now();
    utteranceCountRef.current = 0;
    scoreTotalRef.current = 0;
    const greeting: ChatMessage = {
      id: generateId(),
      role: 'ai',
      text: greetingText,
    };
    setMessages([greeting]);
    lastAiQuestionRef.current = greeting.text;
    void speakAi(greeting.text); // lượt AI nói — mic khóa tới khi TTS xong (phase tts → idle)
  }, [sessionStarted, sessionComplete, activeTier, ensureRuntimeReady, isTierCached, downloadState, startDownload, markReady, generateGreeting, systemPrompt, speakAi]);

  // Pipeline 1 lượt user: STT (đã có transcript live) → LLM → chấm điểm → TTS.
  // Tách riêng để CHỈ gọi 1 lần sau khi stopMic (fix bug double message).
  const processUserTurn = useCallback(
    async (captured: { audio: Blob; transcript: string }) => {
      // Phase 1: transcript live từ Web Speech API (ưu tiên) — transcribe(blob) là stub chờ Phase 2.
      // FIX: hiện lời user NGAY khi dừng mic. Trước đây text chỉ fill sau khi LLM
      // suy luận xong nên bubble kẹt ở '…' trong lúc model 760MB đang nghĩ.
      const userMsgId = generateId();
      const liveText = captured.transcript.trim();
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', text: liveText, pending: liveText.length === 0 },
      ]);
      const t0 = performance.now();
      // Mọi lượt dùng session prompt (system + seed từ vựng), rỗng thì rớt về system gốc
      const livePrompt = sessionPromptRef.current || systemPrompt;
      const result =
        liveText.length > 0
          ? await generateOnly(captured.transcript, livePrompt, historyRef.current)
          : await run(captured.audio, livePrompt, historyRef.current);
      console.log(`[UC-13] LLM suy luận 1 lượt mất ${((performance.now() - t0) / 1000).toFixed(1)}s`);
      if (!result) {
        if (liveText.length > 0) {
          // LLM chưa sẵn sàng — giữ transcript user, báo thử lại
          setMessages((prev) => prev.map((m) => (m.id === userMsgId ? { ...m, pending: false } : m)));
          toast('AI chưa sẵn sàng, thử lại.', { icon: '⚠️' });
        } else {
          // AF-06: STT rỗng — không gọi LLM, không chấm
          setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
          toast('Không nghe rõ, thử nói lại.', { icon: '👂' });
        }
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? { ...m, text: result.userText, pending: false } : m)),
      );
      const aiMsgId = generateId();
      setMessages((prev) => [...prev, { id: aiMsgId, role: 'ai', text: result.aiText }]);

      // BR-07: chấm rule-based cục bộ — lỗi không đứt phiên (AF-09).
      // Kèm bonus từ vựng flashcard (due + mới) lấy lúc vào phiên.
      const scoreResult = scoreUtterance(lastAiQuestionRef.current, result.userText, {
        due: vocabRef.current.due,
        fresh: vocabRef.current.fresh,
      });
      if (scoreResult) {
        utteranceCountRef.current += 1;
        scoreTotalRef.current += scoreResult.score;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsgId
              ? { ...m, score: scoreResult.score, feedback: scoreResult.feedback, scoreBreakdown: scoreResult.breakdown }
              : m,
          ),
        );
      } else {
        setMessages((prev) => prev.map((m) => (m.id === userMsgId ? { ...m, scoringFailed: true } : m)));
      }

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', text: result.userText },
        { role: 'ai', text: result.aiText },
      ];
      lastAiQuestionRef.current = result.aiText;
      void speakAi(result.aiText); // TTS sau khi LLM xong (BR-01) — mic khóa trong lúc AI nói
      if (getLastLlmSource() === 'fallback' && !fallbackWarnedRef.current) {
        fallbackWarnedRef.current = true;
        toast('Các câu trả lời đang ở chế độ dự phòng (rule-based), chưa phải LLM — kiểm tra Console [UC-13].', {
          icon: '⚠️',
        });
      }
    },
    [generateOnly, run, systemPrompt, scoreUtterance, speakAi],
  );

  const handleMicToggle = useCallback(async () => {
    if (!sessionStarted || sessionComplete) return;
    if (effectiveMicState === 'blocked-permission') return;
    if (effectiveMicState === 'processing' || effectiveMicState === 'blocked-download') return;

    // Đang ghi → bấm là DỪNG, chỉ lần này chạy pipeline (fix double message)
    if (micState === 'recording') {
      const captured = await stopMic();
      if (!captured) return;
      await processUserTurn(captured);
      return;
    }

    // Chưa ghi → bấm là BẮT ĐẦU nói (không pipeline — không gửi gì cả)
    const ready = await ensureRuntimeReady();
    if (!ready) return;
    const ok = await startMic();
    if (!ok) {
      // AF-05: từ chối quyền mic — hook tự set blocked-permission, guide hiện
      return;
    }
  }, [
    sessionStarted,
    sessionComplete,
    effectiveMicState,
    micState,
    ensureRuntimeReady,
    startMic,
    stopMic,
    processUserTurn,
  ]);

  // AF-01: confirm đổi tier → purge toàn bộ weights cũ → tải mới
  const handleConfirmSwitch = useCallback(async () => {
    const targetTierId = pendingTierId;
    confirmSwitch();
    if (!targetTierId) return;
    await purgeAllWeights();
    const nextTier = tiers.find((t) => t._id === targetTierId);
    if (nextTier) {
      const success = await startDownload(nextTier);
      if (success) {
        toast.success(`Đã đổi sang tier ${nextTier.name}`);
      }
    }
  }, [confirmSwitch, pendingTierId, tiers, startDownload]);

  const handleRetry = useCallback(() => {
    if (!activeTier) return;
    void retry(activeTier);
  }, [retry, activeTier]);

  const handleNewSession = useCallback(() => {
    setSessionComplete(false);
    setSessionStarted(false);
    resetSession();
    historyRef.current = [];
    lastAiQuestionRef.current = '';
    greetingRequestedRef.current = false;
    utteranceCountRef.current = 0;
    scoreTotalRef.current = 0;
    sessionStartRef.current = 0;
    sessionPromptRef.current = '';
    resetStageState();
    stopSpeaking();
    setMessages([]);
  }, [resetSession, stopSpeaking, resetStageState]);

  const handleSelectTier = useCallback(
    (tierId: string) => {
      selectTier(tierId);
      // Flow mới: đổi tier khi phiên đang chạy → reset phiên về màn Play + chào lại
      setMessages([]);
      historyRef.current = [];
      lastAiQuestionRef.current = '';
      greetingRequestedRef.current = false;
      utteranceCountRef.current = 0;
      scoreTotalRef.current = 0;
      sessionStartRef.current = 0;
      sessionPromptRef.current = '';
      resetStageState();
      setSessionStarted(false);
      unloadRuntime(); // BR-03: dọn wllama LLM cũ — tier mới load lại weights riêng
    },
    [selectTier, unloadRuntime, resetStageState],
  );

  // Cleanup khi rời trang
  useEffect(() => {
    return () => stopSpeaking();
  }, [stopSpeaking]);

  const fromTierName = activeTier?.name ?? '';
  const toTierName = tiers.find((t) => t._id === pendingTierId)?.name ?? '';

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">Voice Chat</h2>
          <p className="text-sm text-slate-500 mt-0.5">Luyện nói tiếng Anh với AI chạy ngay trên máy bạn</p>
        </div>
        <TierSelector
          tiers={tiers}
          activeTierId={activeTierId}
          cachedTierIds={cachedTierIds}
          eligibilityOf={eligibilityOf}
          onSelect={handleSelectTier}
        />
      </div>

      {recommendedTierName && <DeviceHintBanner recommendedTierName={recommendedTierName} />}

      {/* Catalog error */}
      {catalogError && (
        <div
          className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
          role="alert"
        >
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{catalogError}</span>
          <button type="button" onClick={() => void refetch()} className="ml-auto font-bold underline cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
        {/* Chat header: trong phiên chỉ hiện điểm (gấu bự ở sân khấu), ngoài phiên hiện avatar nhỏ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {sessionStarted && !sessionComplete ? (
            <span className="text-xs font-semibold text-slate-500">Đang luyện nói · {activeTier?.name ?? ''}</span>
          ) : (
            <AiAvatar
              avatarState={avatarState}
              stateLabel={downloading ? 'Đang tải model…' : phase === 'tts' ? 'Đang nói…' : ''}
            />
          )}
          <span className="text-xs text-slate-400">
            Tổng điểm: <strong className="text-slate-600">{accumulatedScore}</strong>/{targetScore}
          </span>
        </div>

        {/* Download progress (CAP-04) */}
        <div className="px-6 pt-4">
          <DownloadProgressPanel
            visible={downloading || downloadState === 'error'}
            progress={progress}
            totalSizeMB={activeTier?.totalSizeMB ?? 0}
            onRetry={handleRetry}
            hasError={downloadState === 'error'}
          />
          {downloadState === 'error' && errorMessage && (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" role="log" aria-live="polite">
          {catalogLoading ? (
            <div className="h-full flex items-center justify-center py-12">
              <div
                className="w-8 h-8 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"
                role="status"
                aria-label="Đang tải danh sách tier"
              />
            </div>
          ) : sessionComplete ? (
            <>
              <SessionCompleteScreen
                visible={sessionComplete}
                accumulatedScore={accumulatedScore}
                targetScore={targetScore}
                onNewSession={handleNewSession}
              />
              {/* Transcript toàn phiên sau khi xong — xem lại đã nói gì + điểm từng câu */}
              {messages.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Đoạn hội thoại vừa rồi
                  </h4>
                  {messages.map((message) =>
                    message.role === 'ai' ? (
                      <ChatBubbleAi
                        key={message.id}
                        text={message.text}
                        onReplay={() => void speakAi(message.text)}
                        speaking={false}
                      />
                    ) : (
                      <ChatBubbleUser key={message.id} message={message} />
                    ),
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </>
          ) : sessionStarted ? (
            /* Sân khấu "mù chữ": gấu bự giữa màn hình, mặc định KHÔNG chữ.
               Replay lượt AI mới hiện phụ đề EN; toggle dịch thêm bản VI. */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8">
              <AiAvatar size="lg" hideLabel avatarState={avatarState} stateLabel="" />
              {revealedAiMsg && (
                <div className="mt-4 max-w-md space-y-1.5" role="status">
                  <p className="text-sm text-slate-700 leading-relaxed">{revealedAiMsg.text}</p>
                  {translateOn && (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {translations[revealedAiMsg.id] ?? (translating ? 'Đang dịch…' : '')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 mb-4">
                <Mic className="w-8 h-8" aria-hidden="true" />
              </div>
              <h4 className="text-base font-bold text-slate-700 mb-1">Bắt đầu phiên luyện nói</h4>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                {detected && activeTier
                  ? `AI sẽ chào bạn trước, sau đó tới lượt bạn nói. Model ${activeTier.name} chạy ngay trên máy bạn.`
                  : 'AI sẽ chào bạn trước, sau đó tới lượt bạn nói.'}
              </p>
              <button
                type="button"
                onClick={() => void handleStartSession()}
                disabled={!activeTier || catalogLoading || downloading}
                className={`mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${
                  !activeTier || catalogLoading || downloading
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-300 cursor-pointer'
                }`}
              >
                <Play className="w-5 h-5 fill-white" aria-hidden="true" />
                {downloading ? 'Đang tải model…' : 'Bắt đầu phiên (Play)'}
              </button>
              {downloading && activeTier && !isDownloaded && (
                <p className="mt-3 text-xs text-slate-400">Đang tải weights {activeTier.name} — sẽ tự vào phiên khi xong</p>
              )}
            </div>
          ) : (
            <>
              {messages.map((message) =>
                message.role === 'ai' ? (
                  <ChatBubbleAi
                    key={message.id}
                    text={message.text}
                    onReplay={() => void speakAi(message.text)}
                    speaking={phase === 'tts'}
                  />
                ) : (
                  <ChatBubbleUser key={message.id} message={message} />
                ),
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Mic area — trong phiên "mù chữ": chỉ nút bấm, không chữ hướng dẫn */}
        <div className="border-t border-slate-100 px-6 py-4 space-y-3">
          <MicPermissionGuide visible={permissionDenied} />
          {sessionStarted && !sessionComplete && (
            <>
              <MicButton
                state={effectiveMicState}
                recordingSeconds={recordingSeconds}
                downloading={downloading}
                onToggle={() => void handleMicToggle()}
              />
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleReplayLast()}
                  disabled={!lastAiMsg || aiSpeaking}
                  title="AI nói lại lượt vừa rồi + hiện phụ đề"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    !lastAiMsg || aiSpeaking
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Nghe lại
                </button>
                <button
                  type="button"
                  onClick={() => setTranslateOn((v) => !v)}
                  aria-pressed={translateOn}
                  title="Hiện phụ đề kèm bản dịch tiếng Việt (tắt mặc định cho người học thuần Anh)"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    translateOn
                      ? 'border-purple-300 bg-purple-50 text-purple-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" aria-hidden="true" />
                  Phụ đề Việt: {translateOn ? 'Bật' : 'Tắt'}
                </button>
              </div>
            </>
          )}
          {!sessionStarted && activeTier && (
            <p className="text-center text-[10px] text-slate-300">
              Tier: {activeTier.name} · {isDownloaded ? 'Đã tải' : 'Chưa tải weights'} · STT en-US
            </p>
          )}
        </div>
      </div>

      <SwitchTierConfirmModal
        open={switchConfirmVisible}
        fromTierName={fromTierName}
        toTierName={toTierName}
        onConfirm={() => void handleConfirmSwitch()}
        onCancel={cancelSwitch}
      />
    </div>
  );
}
