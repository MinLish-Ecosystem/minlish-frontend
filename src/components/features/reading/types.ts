/**
 * Reading Question Types
 * 
 * 3 dạng câu hỏi Reading:
 * 1. short-sentence-mcq  - Câu ngắn có chỗ trống + trắc nghiệm
 * 2. main-idea-mcq      - Đoạn văn + câu hỏi ý chính (không có chỗ trống)
 * 3. word-bank-fill      - Word bank + điền vào chỗ trống (click chọn từ)
 */

// ─── Base Types ─────────────────────────────────────────────────────────────

export type QuestionType = 'short-sentence-mcq' | 'main-idea-mcq' | 'word-bank-fill';

// ─── Dạng 1: Câu ngắn + Trắc nghiệm ──────────────────────────────────────────
// Ví dụ: "The quick brown ___ jumps over the lazy dog" → Chọn "fox"

export interface ShortSentenceOption {
  id: string;
  text: string;
}

export interface ShortSentenceMCQ {
  id: string;
  type: 'short-sentence-mcq';
  /** Câu có chỗ trống. Dùng ___blank___ để đánh dấu vị trí */
  sentence: string;
  /** Số thứ tự câu hỏi trong bài đọc */
  questionNumber?: number;
  /** Các lựa chọn trắc nghiệm */
  options: ShortSentenceOption[];
  /** Đáp án đúng */
  correctAnswer: string;
  /** Giải thích (sau khi submit) */
  explanation?: string;
}

// ─── Dạng 2: Đoạn văn + Câu hỏi ý chính ─────────────────────────────────────
// Ví dụ: Đoạn A nói về điều gì? → Chọn đáp án A/B/C/D

export interface MainIdeaOption {
  id: string;
  text: string;
}

export interface MainIdeaMCQ {
  id: string;
  type: 'main-idea-mcq';
  /** Tiêu đề đoạn văn (optional) */
  title?: string;
  /** Đoạn văn cần đọc */
  passage: string;
  /** Câu hỏi ý chính */
  question: string;
  /** Các lựa chọn trắc nghiệm */
  options: MainIdeaOption[];
  /** Đáp án đúng */
  correctAnswer: string;
  /** Giải thích (sau khi submit) */
  explanation?: string;
}

// ─── Dạng 3: Word Bank Fill in the Blanks ─────────────────────────────────────
// Ví dụ: Điền từ vào chỗ trống. Click từ bên dưới để điền.

export interface WordBankBlank {
  /** ID của blank, ví dụ: "blank_1" */
  id: string;
  /** Vị trí hiển thị (index trong passage) */
  position: number;
}

export interface WordBankFill {
  id: string;
  type: 'word-bank-fill';
  /** Đoạn văn có placeholder. Dùng {{blank_1}}, {{blank_2}} để đánh dấu */
  passage: string;
  /** Danh sách từ để chọn (bao gồm cả đáp án + distractors) */
  wordOptions: string[];
  /** Map blank ID -> đáp án đúng */
  correctMapping: Record<string, string>;
  /** Giải thích (sau khi submit) */
  explanation?: string;
}

// ─── Union Type cho tất cả các dạng câu hỏi ───────────────────────────────────

export type ReadingQuestion = ShortSentenceMCQ | MainIdeaMCQ | WordBankFill;

// ─── Session / Progress Types ─────────────────────────────────────────────────

export interface QuestionResult {
  questionId: string;
  selectedAnswer: string | null; // Dạng 1 & 2: đáp án đã chọn. Dạng 3: JSON string của blankId->word map
  isCorrect: boolean;
  timeSpent: number; // milliseconds
}

export interface ReadingSessionState {
  questions: ReadingQuestion[];
  currentIndex: number;
  results: QuestionResult[];
  startedAt: string; // ISO timestamp
  completedAt?: string;
}

// ─── Component Props Types ─────────────────────────────────────────────────────

export interface ReadingQuestionProps {
  question: ReadingQuestion;
  /** Trạng thái đã submit chưa */
  isSubmitted: boolean;
  /** User đã trả lời đúng chưa (true = vàng/xanh, false = đỏ) */
  isCorrect?: boolean;
  /** Khi user chọn đáp án (dạng 1 & 2) */
  onSelectAnswer?: (questionId: string, answer: string) => void;
  /** Khi user chọn từ cho blank (dạng 3) */
  onSelectWord?: (questionId: string, blankId: string, word: string) => void;
  /** Khi user submit đáp án */
  onSubmit?: (questionId: string) => void;
  /** Khi user next question */
  onNext?: (questionId: string) => void;
  /** Đáp án đã chọn (để hiển thị lại sau submit) */
  selectedAnswer?: string | null;
  /** Word bank selections cho dạng 3 (blankId -> word) */
  wordSelections?: Record<string, string>;
  /** ClassName override */
  className?: string;
}

export interface ReadingPracticeProps {
  /** Danh sách câu hỏi */
  questions: ReadingQuestion[];
  /** Tiêu đề bài reading (optional) */
  title?: string;
  /** Mô tả ngắn (optional) */
  description?: string;
  /** Số câu hỏi hiện trên mỗi step (default: 1) */
  questionsPerStep?: number;
  /** Khi hoàn thành toàn bộ session */
  onComplete?: (results: QuestionResult[]) => void;
  /** Custom render cho từng dạng question (optional override) */
  renderQuestion?: (props: ReadingQuestionProps) => React.ReactNode;
  /** ClassName override */
  className?: string;
}