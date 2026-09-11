/**
 * UC-13 Voice AI — Hook orchestrate pipeline STT → LLM → TTS on-device (BR-01 / CAP-06, CAP-07).
 * TTS chỉ phát sau khi LLM sinh xong toàn bộ (BR-01); STT rỗng → trả null (AF-06).
 */
import { useCallback, useRef, useState } from 'react';
import type { ModelFormat, PipelinePhase } from '../types';
import { loadRuntime, type LoadedRuntime } from '../services/onDeviceRuntime';

interface VoicePipelineState {
  phase: PipelinePhase;
  prepareRuntime: (
    formats: { stt: ModelFormat; llm: ModelFormat; tts: ModelFormat },
    tierId?: string | null,
    opts?: { llmSizeMB?: number },
  ) => Promise<void>;
  /** Dọn wllama LLM khi đổi tier/thoát phiên (BR-03). */
  unloadRuntime: () => void;
  run: (
    audio: Blob,
    systemPrompt: string,
    history: Array<{ role: 'ai' | 'user'; text: string }>,
  ) => Promise<{ userText: string; aiText: string } | null>;
  /** Chạy LLM trực tiếp từ transcript đã có (từ Web Speech API live). */
  generateOnly: (
    userText: string,
    systemPrompt: string,
    history: Array<{ role: 'ai' | 'user'; text: string }>,
  ) => Promise<{ userText: string; aiText: string } | null>;
  /** Sinh câu chào mở đầu phiên bằng LLM on-device. */
  generateGreeting: (systemPrompt: string) => Promise<string>;
  speakAi: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

export const useVoicePipeline = (): VoicePipelineState => {
  const [phase, setPhase] = useState<PipelinePhase>('idle');
  const runtimeRef = useRef<LoadedRuntime | null>(null);

  const prepareRuntime = useCallback(
    async (
      formats: { stt: ModelFormat; llm: ModelFormat; tts: ModelFormat },
      tierId?: string | null,
      opts?: { llmSizeMB?: number },
    ) => {
      setPhase('llm'); // trạng thái thinking trong lúc load runtime
      runtimeRef.current = await loadRuntime(formats, tierId ?? null, opts);
      setPhase('idle');
    },
    [],
  );

  const unloadRuntime = useCallback(() => {
    runtimeRef.current?.unloadLlm();
    runtimeRef.current = null;
    setPhase('idle');
  }, []);

  const run = useCallback(
    async (
      audio: Blob,
      systemPrompt: string,
      history: Array<{ role: 'ai' | 'user'; text: string }>,
    ): Promise<{ userText: string; aiText: string } | null> => {
      const runtime = runtimeRef.current;
      if (!runtime) return null;
      setPhase('stt');
      const userText = (await runtime.transcribe(audio)).trim();
      // AF-06: STT rỗng/noise → caller hiển thị "Không nghe rõ", không gọi LLM
      if (!userText) {
        setPhase('idle');
        return null;
      }
      setPhase('llm');
      const aiText = await runtime.generate(systemPrompt, history, userText);
      setPhase('idle');
      return { userText, aiText };
    },
    [],
  );

  // Phase 1: LLM trực tiếp từ transcript live — bỏ qua stub transcribe(blob)
  const generateOnly = useCallback(
    async (
      userTextRaw: string,
      systemPrompt: string,
      history: Array<{ role: 'ai' | 'user'; text: string }>,
    ): Promise<{ userText: string; aiText: string } | null> => {
      const runtime = runtimeRef.current;
      const userText = userTextRaw.trim();
      if (!runtime || !userText) return null;
      setPhase('llm');
      const aiText = await runtime.generate(systemPrompt, history, userText);
      setPhase('idle');
      return { userText, aiText };
    },
    [],
  );

  // Sinh câu chào mở đầu phiên bằng LLM on-device — fallback bên trong runtime
  const generateGreeting = useCallback(async (systemPrompt: string): Promise<string> => {
    const runtime = runtimeRef.current;
    if (!runtime) return "Hi! I'm your English partner. Let's talk!";
    return runtime.generateGreeting(systemPrompt);
  }, []);

  // BR-01: TTS chỉ phát sau khi LLM xong — caller gọi speakAi sau khi có aiText
  const speakAi = useCallback(async (text: string) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    setPhase('tts');
    try {
      await runtime.speak(text);
    } finally {
      setPhase('idle');
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    runtimeRef.current?.stopSpeaking();
    setPhase('idle');
  }, []);

  return { phase, prepareRuntime, unloadRuntime, run, generateOnly, generateGreeting, speakAi, stopSpeaking };
};
