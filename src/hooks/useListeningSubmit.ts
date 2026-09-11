/**
 * Listening Practice (UC-15) — nộp kết quả phiên
 * Quy tắc D-4/BR-07: Finish gửi kết quả MỘT lần; khoá khi đang gửi chống double-tap;
 * retry gửi lại đúng payload lần gần nhất, giữ nguyên trạng body (AF-07; groupId do BE
 * sinh theo OQ-1 của api-spec — FE không tự tạo).
 */
import { useCallback, useRef, useState } from "react";
import { submitListeningSession } from "../api/listening.api";
import type { ListeningSubmitPayload, ListeningSubmitResponse } from "../types/listening";

export interface UseListeningSubmitResult {
  isSubmitting: boolean;
  /** null = bị chặn do request trước đang chạy; lỗi thật sẽ throw cho caller xử lý */
  submit: (payload: ListeningSubmitPayload) => Promise<ListeningSubmitResponse | null>;
  retrySubmit: () => Promise<ListeningSubmitResponse | null>;
}

export function useListeningSubmit(): UseListeningSubmitResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const busyRef = useRef(false);
  const lastPayloadRef = useRef<ListeningSubmitPayload | null>(null);

  const submit = useCallback(
    async (payload: ListeningSubmitPayload): Promise<ListeningSubmitResponse | null> => {
      if (busyRef.current) {
        return null;
      }
      busyRef.current = true;
      setIsSubmitting(true);
      lastPayloadRef.current = payload;
      try {
        return await submitListeningSession(payload);
      } finally {
        busyRef.current = false;
        setIsSubmitting(false);
      }
    },
    [],
  );

  const retrySubmit = useCallback(async (): Promise<ListeningSubmitResponse | null> => {
    if (!lastPayloadRef.current) {
      return null;
    }
    return submit(lastPayloadRef.current);
  }, [submit]);

  return { isSubmitting, submit, retrySubmit };
}
