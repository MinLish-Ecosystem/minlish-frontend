/**
 * Reading Practice (UC-14) — API client
 * Contract: docs/backend/uc-14-reading/api-spec.md (GET session, POST submit)
 * Axios instance: src/lib/api.ts (silent refresh, MAINTENANCE_MODE, session-expired)
 */

import api from "../../../lib/api";
import type {
  CefrLevel,
  ReadingQuestion,
  SubmitReadingPayload,
  SubmitReadingResponse,
} from "../types/reading";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** GET /api/v1/skills/reading/session — tối đa 15 câu random, filter tùy chọn level */
export async function getReadingSession(params: {
  level?: CefrLevel;
}): Promise<ReadingQuestion[]> {
  const response = await api.get<ApiEnvelope<{ questions: ReadingQuestion[] }>>(
    "/api/v1/skills/reading/session",
    { params: params.level ? { level: params.level } : {} },
  );
  return response.data.data.questions;
}

/**
 * POST /api/v1/skills/reading/submit — 1 lần duy nhất khi Finish.
 * 201 (lần đầu) và 200 (replay dedupe) đều map như nhau — FE không phân biệt.
 */
export async function submitReading(
  payload: SubmitReadingPayload,
): Promise<SubmitReadingResponse> {
  const response = await api.post<ApiEnvelope<SubmitReadingResponse>>(
    "/api/v1/skills/reading/submit",
    payload,
  );
  return response.data.data;
}

/** Lấy errorCode chuẩn từ AxiosError (FE bám errorCode, không bám message — NFR-028) */
export function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { errorCode?: string } } })
      .response;
    return response?.data?.errorCode;
  }
  return undefined;
}
