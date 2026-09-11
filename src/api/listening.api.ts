/**
 * Listening Practice (UC-15) — API client
 * Contract: docs/backend/uc-15-listening/api-spec.md (API-01..03, learner scope)
 * Axios instance: src/lib/api.ts (silent refresh, MAINTENANCE_MODE, session-expired)
 */
import api from "../lib/api";
import type {
  ListeningLevel,
  ListeningSessionQuestion,
  ListeningSubmitPayload,
  ListeningSubmitResponse,
} from "../types/listening";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** GET /api/v1/skills/listening/session — câu hỏi phiên, không kèm đáp án (AC-14) */
export async function getListeningSession(
  params: { level?: ListeningLevel } = {},
): Promise<ListeningSessionQuestion[]> {
  const response = await api.get<ApiEnvelope<{ questions: ListeningSessionQuestion[] }>>(
    "/api/v1/skills/listening/session",
    { params: params.level ? { level: params.level } : {} },
  );
  return response.data.data.questions;
}

export interface ListeningAudioData {
  audioStream: string;
}

/** POST /api/v1/skills/listening/audio — audio TTS sinh từ transcript bị ẩn (API-02) */
export async function getListeningAudio(questionId: string): Promise<ListeningAudioData> {
  const response = await api.post<ApiEnvelope<ListeningAudioData>>(
    "/api/v1/skills/listening/audio",
    { questionId },
  );
  return response.data.data;
}

/** POST /api/v1/skills/listening/submit — gọi MỘT lần khi Finish (API-03, BR-07) */
export async function submitListeningSession(
  payload: ListeningSubmitPayload,
): Promise<ListeningSubmitResponse> {
  const response = await api.post<ApiEnvelope<ListeningSubmitResponse>>(
    "/api/v1/skills/listening/submit",
    payload,
  );
  return response.data.data;
}

/** Lấy errorCode chuẩn từ lỗi Axios — FE bám errorCode, không bám message (NFR-028) */
export function getListeningErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { errorCode?: string } } }).response;
    return response?.data?.errorCode;
  }
  return undefined;
}
