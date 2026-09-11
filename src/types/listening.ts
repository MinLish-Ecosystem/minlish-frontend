/**
 * Listening Practice (UC-15 / FR-111) — types
 * Contract: docs/frontend/uc-15-listening/component-design.md §Props/State
 *           + docs/backend/uc-15-listening/api-spec.md (API-01..03)
 * Lưu ý AC-14: câu hỏi phiên KHÔNG chứa transcript/correctAnswer/correctOrder/explanation.
 */

export type ListeningQuestionType = "transcription" | "word-order" | "mcq";

export type ListeningLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface ListeningQuestionOption {
  id: string;
  text: string;
}

/** Câu hỏi trong phiên — khớp API-01, không mang đáp án (D-2, AC-14) */
export interface ListeningSessionQuestion {
  id: string;
  type: ListeningQuestionType;
  level: ListeningLevel;
  options?: ListeningQuestionOption[]; // mcq
  wordOptions?: string[]; // word-order (BE trả đã xáo trộn)
}

export type ListeningSelectedAnswer = string | string[];

export interface ListeningResultItem {
  questionId: string;
  selectedAnswer: ListeningSelectedAnswer;
  /** millisecond; câu chưa làm khi Finish = 0 (AF-04, D-5) */
  durationMs: number;
}

export interface ListeningSubmitPayload {
  results: ListeningResultItem[];
  startedAt: string; // ISO
  completedAt: string; // ISO
}

export interface ListeningSubmitResponse {
  groupId: string;
  correctCount: number;
  totalQuestions: number;
  /** 0..100 — server là nguồn sự thật (D-6) */
  accuracy: number;
}

// ─── Trạng thái nội bộ FE ─────────────────────────────────────────────────────

export type ListeningAudioPlayState = "idle" | "playing" | "played";

/**
 * Trạng thái phiên — mở rộng từ component-design (thêm 'empty'/'submit_error')
 * để phân biệt AF-02 (bộ đề rỗng) và AF-07 (gửi kết quả lỗi) theo ux-spec states.
 */
export type ListeningSessionStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "error"
  | "finishing"
  | "finished"
  | "submit_error";

/** Đáp án đã nộp của một câu */
export interface ListeningAnswerRecord {
  value: ListeningSelectedAnswer | null;
  durationMs: number;
}

/**
 * Feedback sau khi nộp câu.
 * 'answered' = đã nộp nhưng hợp đồng API hiện chưa trả đáp án/transcript để chấm
 * client-side (mâu thuẫn BR-04/BR-05 với AC-14 — xem build-notes uc-15-listening);
 * 'correct'/'incorrect' = đã chấm client-side khi BE bổ sung dữ liệu chấm.
 */
export interface ListeningQuestionFeedback {
  status: "answered" | "correct" | "incorrect";
  isCorrect: boolean;
  explanation?: string;
  transcript?: string;
}

export type ListeningPillStatus = "unanswered" | "answered" | "correct" | "incorrect";
