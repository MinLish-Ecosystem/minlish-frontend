/**
 * Listening Practice (UC-15) — tiện ích chung của feature
 * Design: docs/frontend/uc-15-listening/component-design.md (listening.utils.ts)
 * Lưu ý: hàm chuẩn hoá đáp án để chấm client-side (BR-04) chưa đưa vào vì hợp đồng
 * API-01 không trả transcript/correctOrder/correctAnswer — xem build-notes uc-15-listening.
 */
import type { ListeningQuestionType, ListeningSelectedAnswer } from "../types/listening";

/** Đáp án rỗng cho câu chưa làm khi Finish — server chấm là sai (AF-04, D-5) */
export function emptyAnswerForQuestion(type: ListeningQuestionType): ListeningSelectedAnswer {
  // word-order gửi mảng từ; hai dạng còn lại gửi chuỗi rỗng
  if (type === "word-order") {
    return [];
  }
  return "";
}

/** Điều kiện nộp câu theo dạng — ux-spec.md §Ba dạng câu hỏi */
export function hasSubmittableAnswer(
  type: ListeningQuestionType,
  draft: ListeningSelectedAnswer | null,
): boolean {
  if (draft == null) {
    return false;
  }
  if (type === "transcription") {
    return typeof draft === "string" && draft.trim().length > 0;
  }
  if (type === "word-order") {
    return Array.isArray(draft) && draft.length > 0;
  }
  return typeof draft === "string" && draft.length > 0;
}

/** Định dạng millisecond → mm:ss cho tổng kết phiên (ui-flow.md wireframe) */
export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
