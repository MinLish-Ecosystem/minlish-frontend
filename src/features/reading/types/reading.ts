/**
 * Reading Practice (UC-14) — types
 * Contract: docs/frontend/uc-14-reading/component-design.md §3 + docs/backend/uc-14-reading/api-spec.md
 */

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type ReadingQuestionType =
  | "short-sentence-mcq"
  | "main-idea-mcq"
  | "word-bank-fill";

export interface QuestionOption {
  id: string;
  text: string;
}

// ─── ReadingQuestion — discriminated union khớp BE api-spec ───────────────────

interface ReadingQuestionBase {
  _id: string;
  level: CefrLevel;
  explanation?: string;
}

export interface ShortSentenceMcqQuestion extends ReadingQuestionBase {
  type: "short-sentence-mcq";
  sentence: string;
  options: QuestionOption[];
  correctAnswer: string;
}

export interface MainIdeaMcqQuestion extends ReadingQuestionBase {
  type: "main-idea-mcq";
  passage: string;
  question?: string;
  title?: string;
  options: QuestionOption[];
  correctAnswer: string;
}

export interface WordBankFillQuestion extends ReadingQuestionBase {
  type: "word-bank-fill";
  passage: string;
  wordOptions: string[];
  correctMapping: Record<string, string>;
}

export type ReadingQuestion =
  | ShortSentenceMcqQuestion
  | MainIdeaMcqQuestion
  | WordBankFillQuestion;

// ─── Temp result per câu — KHÔNG gửi isCorrect lên server ─────────────────────

export type SelectedAnswer = string | Record<string, string> | null;

export interface QuestionResult {
  questionId: string;
  /** null = chưa làm; dạng 3 là object {blank_N: word} */
  selectedAnswer: SelectedAnswer;
  /** client-side feedback only — không gửi server */
  isCorrect: boolean;
  /** ms — gửi server */
  timeSpent: number;
}

export type SubmitResultItem = Pick<
  QuestionResult,
  "questionId" | "selectedAnswer" | "timeSpent"
>;

// ─── Submit payload + response — khớp BE api-spec.md API-02 ────────────────────

export interface SubmitReadingPayload {
  /** ObjectId FE tạo 1 lần khi bắt đầu phiên — giữ nguyên khi retry */
  groupId: string;
  results: SubmitResultItem[];
  startedAt: string;
  completedAt: string;
}

export interface SubmitReadingResponse {
  groupId: string;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  /** integer 0..100 — server tính, FE không tự thay */
  accuracy: number;
  totalTimeMs: number;
  /** server tính = totalTimeMs / totalQuestions — FE không tự tính */
  averageTimeMs: number;
}

// ─── Session state (useReadingSession) ─────────────────────────────────────────

export type SessionPhase =
  | "LOADING"
  | "EMPTY"
  | "LOAD_ERROR"
  | "READY"
  | "FINISHING"
  | "FINISHED"
  | "SUBMIT_ERROR"
  | "SUBMIT_IN_PROGRESS";

export interface ReadingSessionState {
  phase: SessionPhase;
  groupId: string;
  level: CefrLevel | null;
  questions: ReadingQuestion[];
  currentIndex: number;
  /** key = questionId (ghi đè khi submit lại — AF-06) */
  results: Map<string, QuestionResult>;
  submitResponse: SubmitReadingResponse | null;
  startedAt: string;
  exitRequested: boolean;
}

export type PillStatus = "unanswered" | "correct" | "incorrect";
