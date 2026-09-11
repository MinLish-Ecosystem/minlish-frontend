/**
 * Reading Practice (UC-14) — session state machine hook
 * Design: docs/frontend/uc-14-reading/component-design.md §3 (useReadingSession)
 * Rules: BR-02..BR-08, AF-01..AF-07 — xem mapping trong component-design.md §5
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getReadingSession, getErrorCode, submitReading } from "../api/readingApi";
import type {
  CefrLevel,
  PillStatus,
  QuestionResult,
  ReadingQuestion,
  ReadingSessionState,
  SelectedAnswer,
  SessionPhase,
  SubmitReadingResponse,
} from "../types/reading";

// ObjectId 24 hex chars — FE tạo groupId làm idempotency key (BE api-spec API-02)
function generateGroupId(): string {
  const hex = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 24; i++) {
    id += hex[Math.floor(Math.random() * 16)];
  }
  return id;
}

/** Chấm client-side theo BR-03 — chỉ dùng feedback local, server chấm lại khi Finish */
function scoreAnswer(
  question: ReadingQuestion,
  selectedAnswer: SelectedAnswer,
): boolean {
  if (selectedAnswer == null) return false;
  if (question.type === "word-bank-fill") {
    // Đúng khi TẤT CẢ blank khớp correctMapping (sai 1 blank = sai cả câu)
    const keys = Object.keys(question.correctMapping);
    if (typeof selectedAnswer !== "object") return false;
    const answer = selectedAnswer as Record<string, string>;
    return keys.every((key) => answer[key] === question.correctMapping[key]);
  }
  return selectedAnswer === question.correctAnswer;
}

export interface UseReadingSessionReturn {
  state: ReadingSessionState;
  currentQuestion: ReadingQuestion | null;
  currentResult: QuestionResult | null;
  /** MCQ: đã chọn 1 option; word-bank: đã điền ĐỦ mọi blank */
  isAnswered: boolean;
  answeredCount: number;
  statuses: PillStatus[];
  /** Summary tạm từ temp state — bị thay bởi submitResponse khi server trả */
  summary: {
    correctCount: number;
    total: number;
    accuracy: number;
    averageTimeMs: number;
  } | null;
  actions: {
    submitCurrentAnswer(selected: SelectedAnswer): void;
    goToQuestion(index: number): void;
    next(): void;
    previous(): void;
    finish(): Promise<void>;
    retrySubmit(): Promise<void>;
    retryLoad(): void;
    requestExit(): void;
    confirmExit(): void;
    cancelExit(): void;
    resetSession(): void;
  };
}

export function useReadingSession(initialLevel: CefrLevel | null): UseReadingSessionReturn {
  const [state, setState] = useState<ReadingSessionState>({
    phase: "LOADING",
    groupId: generateGroupId(),
    level: initialLevel,
    questions: [],
    currentIndex: 0,
    results: new Map(),
    submitResponse: null,
    startedAt: new Date().toISOString(),
    exitRequested: false,
  });

  // Per-question timer — reset khi chuyển câu (BR-07); câu đã submit xem lại không tích lũy
  const questionStartRef = useRef<number>(Date.now());
  const [currentTimerRunning, setCurrentTimerRunning] = useState(true);
  const lastSubmittedRef = useRef<Set<string>>(new Set();
  lastSubmittedRef.current = new Set();

  // Latest submit payload — retry giữ nguyên groupId + NGUYÊN TRẠNG body (D-6)
  const lastPayloadRef = useRef<string>("");
  const levelRef = useRef<CefrLevel | null>(initialLevel);

  const loadSession = useCallback(async (level: CefrLevel | null) => {
    setState((prev) => ({
      ...prev,
      phase: "LOADING",
      level,
      questions: [],
      currentIndex: 0,
      results: new Map(),
      submitResponse: null,
    }));
    try {
      const questions = await getReadingSession({ level: level ?? undefined });
      if (questions.length === 0) {
        setState((prev) => ({ ...prev, phase: "EMPTY", questions: [] }));
        return;
      }
      lastSubmittedRef.current = new Set();
      questionStartRef.current = Date.now();
      setCurrentTimerRunning(true);
      setState((prev) => ({ ...prev, phase: "READY", questions }));
    } catch (error) {
      // 404 ERR_NO_QUESTIONS_AVAILABLE → EMPTY (AF-02); còn lại LOAD_ERROR (AF-01)
      const errorCode = getErrorCode(error);
      if (errorCode === "ERR_NO_QUESTIONS_AVAILABLE") {
        setState((prev) => ({ ...prev, phase: "EMPTY", questions: [] }));
      } else {
        setState((prev) => ({ ...prev, phase: "LOAD_ERROR" }));
      }
    }
  }, []);

  useEffect(() => {
    levelRef.current = state.level;
  }, [state.level]);

  useEffect(() => {
    void loadSession(initialLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestion = state.questions[state.currentIndex] ?? null;
  const currentResult = currentQuestion
    ? state.results.get(currentQuestion._id) ?? null
    : null;

  const isAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === "word-bank-fill") {
      // Phải điền ĐỦ mọi blank mới được Submit (memlog 2026-09-04)
      const blankCount = Object.keys(currentQuestion.correctMapping).length;
      const result = state.results.get(currentQuestion._id);
      const filled = result?.selectedAnswer;
      if (currentTimerRunning && !result) {
        // chưa submit lần nào — track selection tạm qua partialAnswers từ page
        return false;
      }
      if (filled && typeof filled === "object") {
        return Object.keys(filled).length === blankCount;
      }
      return false;
    }
    const result = state.results.get(currentQuestion._id);
    return result?.selectedAnswer != null;
  }, [currentQuestion, state.results, currentTimerRunning]);

  // isAnswered cho word-bank cần biết selection CHƯA submit — page truyền lên qua extension
  const isAnsweredRef = useRef(false);
  const setLiveAnswered = useCallback((value: boolean) => {
    isAnsweredRef.current = value;
  }, []);

  const answeredCount = useMemo(
    () =>
      state.questions.filter(
        (q) => state.results.get(q._id)?.selectedAnswer != null,
      ).length,
    [state.questions, state.results],
  );

  const statuses = useMemo<PillStatus[]>(
    () =>
      state.questions.map((q) => {
        const result = state.results.get(q._id);
        if (!result || result.selectedAnswer == null) return "unanswered";
        return result.isCorrect ? "correct" : "incorrect";
      }),
    [state.questions, state.results],
  );

  const summary = useMemo(() => {
    if (state.phase !== "FINISHING" && state.phase !== "SUBMIT_ERROR") return null;
    const total = state.questions.length;
    const correct = [...state.results.values()].filter((r) => r.isCorrect).length;
    const totalTime = [...state.results.values()].reduce(
      (acc, r) => acc + r.timeSpent,
      0,
    );
    return {
      correctCount: correct,
      total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      averageTimeMs: total > 0 ? Math.round(totalTime / total) : 0,
    };
  }, [state.phase, state.questions, state.results]);

  const actions = useMemo(() => {
    const submitCurrentAnswer = (selected: SelectedAnswer) => {
      const question = state.questions[state.currentIndex];
      if (!question) return;
      const timeSpent = Date.now() - questionStartRef.current;
      const wasSubmitted = lastSubmittedRef.current.has(question._id);
      const result: QuestionResult = {
        questionId: question._id,
        selectedAnswer: selected,
        isCorrect: scoreAnswer(question, selected),
        // Submit lại (AF-06): timeSpent MỚI của lần sửa ghi đè
        timeSpent: wasSubmitted
          ? timeSpent
          : Math.max(0, timeSpent),
      };
      lastSubmittedRef.current.add(question._id);
      setState((prev) => {
        const results = new Map(prev.results);
        results.set(question._id, result);
        return { ...prev, results };
      });
    };

    const goToQuestion = (index: number) => {
      if (index < 0 || index >= state.questions.length) return;
      // Reset per-question timer khi chuyển câu (BR-07)
      questionStartRef.current = Date.now();
      setCurrentTimerRunning(true);
      setState((prev) => ({ ...prev, currentIndex: index }));
    };

    const finish = async () => {
      if (state.phase === "FINISHING" || state.phase === "FINISHED") return;
      setState((prev) => ({ ...prev, phase: "FINISHING" }));

      // BR-05: câu chưa làm → selectedAnswer=null, timeSpent=0
      const results = state.questions.map((question) => {
        const existing = state.results.get(question._id);
        return {
          questionId: question._id,
          selectedAnswer: existing?.selectedAnswer ?? null,
          timeSpent: existing?.timeSpent ?? 0,
        };
      });

      const payload = {
        groupId: state.groupId,
        results,
        startedAt: state.startedAt,
        completedAt: new Date().toISOString(),
      };
      lastPayloadRef.current = JSON.stringify(payload);

      try {
        const response = await submitReading(payload);
        setState((prev) => ({ ...prev, phase: "FINISHED", submitResponse: response }));
      } catch (error) {
        const errorCode = getErrorCode(error);
        if (errorCode === "ERR_SUBMIT_IN_PROGRESS") {
          // 409 — đang xử lý request khác: khóa Finish, giữ temp state, đợi retry
          toast.error("Kết quả đang được xử lý. Vui lòng thử lại sau.");
          setState((prev) => ({ ...prev, phase: "SUBMIT_IN_PROGRESS" }));
          return;
        }
        if (errorCode === "ERR_GROUP_ID_CONFLICT") {
          // 409 — body khác fingerprint đã lưu: không ghi đè, không tự retry
          toast.error(
            "Kết quả đã được ghi trước đó với nội dung khác. Không thể ghi đè.",
          );
          setState((prev) => ({ ...prev, phase: "SUBMIT_ERROR" }));
          return;
        }
        toast.error("Không thể lưu kết quả. Vui lòng thử lại.");
        setState((prev) => ({ ...prev, phase: "SUBMIT_ERROR" }));
      }
    };

    const retrySubmit = async () => {
      // Gửi lại cùng groupId + nguyên trạng body (D-6) — không build body mới
      const payload = JSON.parse(lastPayloadRef.current) as Parameters<
        typeof submitReading
      >[0];
      setState((prev) => ({ ...prev, phase: "FINISHING" }));
      try {
        const response = await submitReading(payload);
        setState((prev) => ({ ...prev, phase: "FINISHED", submitResponse: response }));
      } catch (error) {
        const errorCode = getErrorCode(error);
        if (errorCode === "ERR_SUBMIT_IN_PROGRESS") {
          toast.error("Kết quả đang được xử lý. Vui lòng thử lại sau.");
          setState((prev) => ({ ...prev, phase: "SUBMIT_IN_PROGRESS" }));
          return;
        }
        if (errorCode === "ERR_GROUP_ID_CONFLICT") {
          toast.error(
            "Kết quả đã được ghi trước đó với nội dung khác. Không thể ghi đè.",
          );
          setState((prev) => ({ ...prev, phase: "SUBMIT_ERROR" }));
          return;
        }
        toast.error("Không thể lưu kết quả. Vui lòng thử lại.");
        setState((prev) => ({ ...prev, phase: "SUBMIT_ERROR" }));
      }
    };

    const retryLoad = () => {
      void loadSession(levelRef.current);
    };

    const requestExit = () => {
      setState((prev) => ({ ...prev, exitRequested: true }));
    };

    const confirmExit = () => {
      // KHÔNG gửi request nào (AF-05) — page xử lý navigate
      setState((prev) => ({ ...prev, exitRequested: false }));
    };

    const cancelExit = () => {
      setState((prev) => ({ ...prev, exitRequested: false }));
    };

    const resetSession = () => {
      // Try Again — groupId MỚI + lấy đề mới cùng level
      setState((prev) => ({
        phase: "LOADING",
        groupId: generateGroupId(),
        level: prev.level,
        questions: [],
        currentIndex: 0,
        results: new Map(),
        submitResponse: null,
        startedAt: new Date().toISOString(),
        exitRequested: false,
      }));
      void loadSession(levelRef.current);
    };

    return {
      submitCurrentAnswer,
      goToQuestion,
      next: () => goToQuestion(state.currentIndex + 1),
      previous: () => goToQuestion(state.currentIndex - 1),
      finish,
      retrySubmit,
      retryLoad,
      requestExit,
      confirmExit,
      cancelExit,
      resetSession,
    };
  }, [state, loadSession]);

  return {
    state,
    currentQuestion,
    currentResult,
    isAnswered: isAnswered || isAnsweredRef.current,
    setLiveAnswered,
    answeredCount,
    statuses,
    summary,
    actions,
  };
}
