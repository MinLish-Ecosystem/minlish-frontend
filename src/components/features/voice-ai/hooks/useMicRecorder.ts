/**
 * UC-13 Voice AI — Hook ghi âm mic (BR-05 / CAP-06, AF-05).
 * Flow mới 2026-09-01: tách start/stop để tránh double-pipeline khi cả 2 lần bấm
 * cùng await 1 promise recording (bug gửi 2 message).
 * - startMic(): bắt đầu ghi (user bấm mic để NÓI)
 * - stopMic(): dừng ghi + trả {audio, transcript} — CHỈ lần dừng chạy pipeline
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MicState } from '../types';
import { startLiveRecognition, stopLiveRecognition } from '../services/onDeviceRuntime';

interface MicRecorderState {
  micState: MicState;
  permissionDenied: boolean;
  recordingSeconds: number;
  /** Bấm mic để BẮT ĐẦU nói — chỉ bắt đầu ghi, KHÔNG trả pipeline. */
  startMic: () => Promise<boolean>;
  /** Bấm mic để DỪNG — dừng ghi + gom transcript live. Trả null nếu chưa ghi. */
  stopMic: () => Promise<{ audio: Blob; transcript: string } | null>;
  setBlocked: (blocked: boolean) => void;
}

const MIC_SLICE_MS = 100;

export const useMicRecorder = (): MicRecorderState => {
  const [micState, setMicState] = useState<MicState>('idle');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      void stopLiveRecognition(); // dọn recognition khi rời trang
    };
  }, []);

  /** Bắt đầu ghi âm + STT live song song. Trả false nếu không xin được mic. */
  const startMic = useCallback(async (): Promise<boolean> => {
    if (recorderRef.current || stoppingRef.current) return false; // đang ghi/chưa dọn xong — chặn double-start
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionDenied(false);
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      // STT live song song (Phase 1: Web Speech API — Edge/Chrome hỗ trợ)
      startLiveRecognition();
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start(MIC_SLICE_MS);
      recorderRef.current = recorder;
      setMicState('recording');
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
      return true;
    } catch {
      // AF-05: từ chối quyền mic → hướng dẫn bật quyền, chặn ghi âm, không crash
      setPermissionDenied(true);
      setMicState('blocked-permission');
      return false;
    }
  }, []);

  /** Dừng ghi âm — gom Blob + transcript live. Trả null nếu không đang ghi. */
  const stopMic = useCallback(async (): Promise<{ audio: Blob; transcript: string } | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive' || stoppingRef.current) return null;
    stoppingRef.current = true;
    setMicState('processing');
    const stopped = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      };
    });
    recorder.stop();
    // Recorder dừng xong SAU ĐÓ mới stop recognition để gom trọn transcript
    const blob = await stopped;
    const transcript = await stopLiveRecognition();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current = null;
    stoppingRef.current = false;
    setMicState('idle');
    return { audio: blob, transcript: transcript.trim() };
  }, []);

  const setBlocked = useCallback((blocked: boolean) => {
    setMicState(blocked ? 'blocked-download' : 'idle');
  }, []);

  return { micState, permissionDenied, recordingSeconds, startMic, stopMic, setBlocked };
};
