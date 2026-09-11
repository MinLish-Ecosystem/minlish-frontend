/**
 * Listening Practice (UC-15) — phát/replay audio
 * Quy tắc D-1/BR-02/BR-06: chỉ phát theo hành động của learner (không auto-play);
 * đang phát thì chờ phát xong mới nhận lệnh mới (chống spam request);
 * replay không giới hạn và ưu tiên cache client-side theo questionId (API-02).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getListeningAudio } from "../api/listening.api";
import { cacheAudio } from "../store/slices/listeningSlice";
import type { RootState } from "../store";
import type { ListeningAudioPlayState } from "../types/listening";

/** Copy theo UC-15 §4 ERR_TTS_UNAVAILABLE (AF-03) */
export const AUDIO_ERROR_MESSAGE = "Không thể phát audio lúc này, vui lòng thử lại";

/**
 * Hợp đồng `audioStream` (API-02) chưa chốt format vì BE chưa implement —
 * hỗ trợ URL trực tiếp (http/blob/data) và chuỗi base64 thuần; BE chốt thì thu hẹp lại.
 */
function resolveAudioSrc(audioStream: string): string {
  if (/^(https?:|blob:|data:)/i.test(audioStream)) {
    return audioStream;
  }
  return `data:audio/mpeg;base64,${audioStream}`;
}

export interface UseListeningAudioResult {
  playState: ListeningAudioPlayState;
  isFetchingAudio: boolean;
  audioErrorMessage: string | null;
  play: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useListeningAudio(questionId: string): UseListeningAudioResult {
  const dispatch = useDispatch();
  const cachedSrc = useSelector((state: RootState) => state.listening.audioCache[questionId]);

  const [playState, setPlayState] = useState<ListeningAudioPlayState>("idle");
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [audioErrorMessage, setAudioErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Đang phát/đang tải — chặn lệnh phát chồng cho đến khi phát xong hoặc lỗi (D-1)
  const busyRef = useRef(false);

  // Rời câu hoặc unmount: dừng audio và reset trạng thái của câu cũ
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      busyRef.current = false;
      setPlayState("idle");
    };
  }, [questionId]);

  const play = useCallback(async () => {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setAudioErrorMessage(null);
    try {
      let src: string | undefined = cachedSrc;
      if (!src) {
        setIsFetchingAudio(true);
        try {
          const data = await getListeningAudio(questionId);
          src = resolveAudioSrc(data.audioStream);
          dispatch(cacheAudio({ questionId, src }));
        } finally {
          setIsFetchingAudio(false);
        }
      }
      audioRef.current?.pause();
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onended = () => {
        busyRef.current = false;
        setPlayState("played");
      };
      audio.onerror = () => {
        busyRef.current = false;
        setPlayState("idle");
        setAudioErrorMessage(AUDIO_ERROR_MESSAGE);
      };
      setPlayState("playing");
      await audio.play();
    } catch {
      // AF-03: TTS lỗi/lỗi phát — hiển thị thông điệp + cho retry, không crash
      busyRef.current = false;
      setPlayState("idle");
      setAudioErrorMessage(AUDIO_ERROR_MESSAGE);
    }
  }, [cachedSrc, dispatch, questionId]);

  const retry = useCallback(() => play(), [play]);

  return { playState, isFetchingAudio, audioErrorMessage, play, retry };
}
