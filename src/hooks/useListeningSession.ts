/**
 * Listening Practice (UC-15) — state machine phiên luyện nghe
 * Design: docs/frontend/uc-15-listening/component-design.md (useListeningSession)
 * Flow + states: docs/frontend/uc-15-listening/ui-flow.md + ux-spec.md
 *
 * Nghiệp vụ chính: nạp phiên (AF-01/AF-02), nộp từng câu mở quyền chuyển tiếp (AC-06,
 * D-4), câu chưa làm khi Finish điền rỗng durationMs=0 (AF-04/AC-07), gửi kết quả một
 * lần (BR-07), thoát giữa phiên không gửi gì (AF-05/AC-12).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { getListeningErrorCode, getListeningSession } from "../api/listening.api";
import { emptyAnswerForQuestion, hasSubmittableAnswer } from "../lib/listening.utils";
import {
  finishFailed,
  finishStarted,
  finishSucceeded,
  loadEmpty,
  loadFailed,
  loadStarted,
  loadSucceeded,
  resetSession,
  setCurrentIndex,
  submitAnswer as submitAnswerAction,
} from "../store/slices/listeningSlice";
import { useListeningSubmit } from "./useListeningSubmit";
import type { RootState } from "../store";
import type {
  ListeningLevel,
  ListeningPillStatus,
  ListeningQuestionFeedback,
  ListeningSelectedAnswer,
  ListeningSessionQuestion,
  ListeningSessionStatus,
  ListeningSubmitPayload,
  ListeningSubmitResponse,
} from "../types/listening";
import type { ListeningAnswerRecord } from "../types/listening";

const FINISH_ERROR_MESSAGE = "Không thể gửi kết quả phiên. Vui lòng thử lại.";

export interface UseListeningSessionResult {
  questions: ListeningSessionQuestion[];
  currentIndex: number;
  currentQuestion: ListeningSessionQuestion | null;
  currentFeedback: ListeningQuestionFeedback | null;
  draftAnswer: ListeningSelectedAnswer | null;
  setDraftAnswer: (value: ListeningSelectedAnswer | null) => void;
  answers: Record<string, ListeningAnswerRecord>;
  pillStatuses: ListeningPillStatus[];
  submittedCount: number;
  unfinishedCount: number;
  canSubmit: boolean;
  canGoTo: (index: number) => boolean;
  sessionStatus: ListeningSessionStatus;
  result: ListeningSubmitResponse | null;
  totalTimeMs: number;
  isSubmitting: boolean;
  submitCurrentAnswer: () => void;
  goToQuestion: (index: number) => void;
  next: () => void;
  previous: () => void;
  finish: () => Promise<void>;
  retrySubmit: () => Promise<void>;
  retryLoad: () => void;
  resetForNewSession: () => void;
}

export function useListeningSession(level: ListeningLevel | null): UseListeningSessionResult {
  const dispatch = useDispatch();
  const { questions, currentIndex, answers, submitted, sessionStatus, result } = useSelector(
    (state: RootState) => state.listening,
  );
  const { isSubmitting, submit, retrySubmit: submitRetry } = useListeningSubmit();

  const [draftAnswer, setDraftAnswer] = useState<ListeningSelectedAnswer | null>(null);
  const [totalTimeMs, setTotalTimeMs] = useState(0);
  // Đã dùng ref chống double-tap Finish (double-click trong cùng frame vẫn thấy state cũ)
  const finishingRef = useRef(false);
  // Đồng hồ từng câu (D-5: millisecond); tổng phiên tính từ startedAt
  const questionStartRef = useRef(Date.now());
  const startedAtRef = useRef(new Date().toISOString());

  const currentQuestion = questions[currentIndex] ?? null;
  const currentFeedback = currentQuestion ? submitted[currentQuestion.id] ?? null : null;
  const submittedCount = Object.keys(submitted).length;
  const unfinishedCount = Math.max(0, questions.length - submittedCount);

  const load = useCallback(async () => {
    dispatch(loadStarted());
    try {
      const sessionQuestions = await getListeningSession(level ? { level } : {});
      if (sessionQuestions.length === 0) {
        dispatch(loadEmpty());
        return;
      }
      startedAtRef.current = new Date().toISOString();
      questionStartRef.current = Date.now();
      dispatch(loadSucceeded(sessionQuestions));
    } catch (error) {
      // AF-02: pool rỗng → 404 ERR_NO_QUESTIONS_AVAILABLE hiển thị như trạng thái rỗng
      if (getListeningErrorCode(error) === "ERR_NO_QUESTIONS_AVAILABLE") {
        dispatch(loadEmpty());
        return;
      }
      // AF-01: còn lại là lỗi tải đề — trang hiển thị lỗi + retry
      dispatch(loadFailed());
    }
  }, [dispatch, level]);

  useEffect(() => {
    load();
  }, [load]);

  // Chuyển câu: reset đáp án nháp + đồng hồ câu; câu đã nộp không tích lũy thêm thời gian
  useEffect(() => {
    setDraftAnswer(null);
    questionStartRef.current = Date.now();
  }, [currentIndex]);

  const canSubmit =
    currentQuestion != null &&
    currentFeedback == null &&
    hasSubmittableAnswer(currentQuestion.type, draftAnswer);

  const submitCurrentAnswer = useCallback(() => {
    if (currentQuestion == null || !canSubmit || draftAnswer == null) {
      return;
    }
    const durationMs = Math.max(0, Date.now() - questionStartRef.current);
    // Hợp đồng API-01 không trả đáp án (AC-14) nên FE chưa tự chấm được — ghi nhận
    // 'answered'; kết quả chính do server chấm khi Finish (D-6). Xem build-notes.
    dispatch(
      submitAnswerAction({
        questionId: currentQuestion.id,
        record: { value: draftAnswer, durationMs },
        feedback: { status: "answered", isCorrect: false },
      }),
    );
  }, [canSubmit, currentQuestion, dispatch, draftAnswer]);

  const canGoTo = useCallback(
    (index: number) => {
      const target = questions[index];
      if (!target) {
        return false;
      }
      return index === currentIndex || submitted[target.id] != null;
    },
    [currentIndex, questions, submitted],
  );

  const goToQuestion = useCallback(
    (index: number) => {
      // Chỉ vào được câu hiện tại hoặc câu đã nộp — tránh mất tiến trình câu chưa nộp (AC-06)
      if (!canGoTo(index)) {
        return;
      }
      dispatch(setCurrentIndex(index));
    },
    [canGoTo, dispatch],
  );

  const next = useCallback(() => {
    if (currentFeedback == null || currentIndex >= questions.length - 1) {
      return;
    }
    dispatch(setCurrentIndex(currentIndex + 1));
  }, [currentFeedback, currentIndex, dispatch, questions.length]);

  const previous = useCallback(() => {
    if (currentIndex <= 0) {
      return;
    }
    dispatch(setCurrentIndex(currentIndex - 1));
  }, [currentIndex, dispatch]);

  const finish = useCallback(async () => {
    if (questions.length === 0 || finishingRef.current || isSubmitting) {
      return;
    }
    finishingRef.current = true;
    if (unfinishedCount > 0) {
      // AF-04: câu chưa làm tính sai với thời gian 0 — thông báo rõ trước khi gửi
      toast(`${unfinishedCount} câu chưa làm sẽ được tính là sai khi hoàn tất phiên.`);
    }
    const payload: ListeningSubmitPayload = {
      results: questions.map((question) => ({
        questionId: question.id,
        selectedAnswer: answers[question.id]?.value ?? emptyAnswerForQuestion(question.type),
        durationMs: answers[question.id]?.durationMs ?? 0,
      })),
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
    };
    dispatch(finishStarted());
    try {
      const response = await submit(payload);
      if (!response) {
        return;
      }
      setTotalTimeMs(Date.now() - Date.parse(startedAtRef.current));
      dispatch(finishSucceeded(response));
      toast.success("Đã hoàn tất phiên luyện nghe.");
    } catch {
      dispatch(finishFailed());
      toast.error(FINISH_ERROR_MESSAGE);
    } finally {
      finishingRef.current = false;
    }
  }, [answers, dispatch, isSubmitting, questions, submit, unfinishedCount]);

  const retrySubmit = useCallback(async () => {
    if (finishingRef.current || isSubmitting) {
      return;
    }
    finishingRef.current = true;
    dispatch(finishStarted());
    try {
      const response = await submitRetry();
      if (!response) {
        return;
      }
      setTotalTimeMs(Date.now() - Date.parse(startedAtRef.current));
      dispatch(finishSucceeded(response));
      toast.success("Đã hoàn tất phiên luyện nghe.");
    } catch {
      dispatch(finishFailed());
      toast.error(FINISH_ERROR_MESSAGE);
    } finally {
      finishingRef.current = false;
    }
  }, [dispatch, isSubmitting, submitRetry]);

  const retryLoad = useCallback(() => {
    load();
  }, [load]);

  const resetForNewSession = useCallback(() => {
    dispatch(resetSession());
    setTotalTimeMs(0);
    load();
  }, [dispatch, load]);

  const pillStatuses = useMemo<ListeningPillStatus[]>(
    () =>
      questions.map((question) => {
        const feedback = submitted[question.id];
        if (feedback?.status === "correct") {
          return "correct";
        }
        if (feedback?.status === "incorrect") {
          return "incorrect";
        }
        if (feedback) {
          return "answered";
        }
        return "unanswered";
      }),
    [questions, submitted],
  );

  return {
    questions,
    currentIndex,
    currentQuestion,
    currentFeedback,
    draftAnswer,
    setDraftAnswer,
    answers,
    pillStatuses,
    submittedCount,
    unfinishedCount,
    canSubmit,
    canGoTo,
    sessionStatus,
    result,
    totalTimeMs,
    isSubmitting,
    submitCurrentAnswer,
    goToQuestion,
    next,
    previous,
    finish,
    retrySubmit,
    retryLoad,
    resetForNewSession,
  };
}
