/**
 * Reading Practice (UC-14) — phiên làm bài + summary inline
 * Design: ux-spec.md §2.2, ui-flow.md §2-§5, component-design.md §1
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { useReadingSession } from "../../features/reading/hooks/useReadingSession";
import type { CefrLevel, SelectedAnswer } from "../../features/reading/types/reading";
import { cn } from "../../lib/utils";
import SessionHeader from "./components/SessionHeader";
import NavigatorPills from "./components/NavigatorPills";
import QuestionCard from "./components/QuestionCard";
import FeedbackBox from "./components/FeedbackBox";
import SessionNavButtons from "./components/SessionNavButtons";
import CompletionScreen from "./components/CompletionScreen";
import ExitConfirmModal from "./components/ExitConfirmModal";
import QuestionSkeleton from "./components/QuestionSkeleton";
import { getErrorCode } from "../../features/reading/api/readingApi";

export default function ReadingSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Navigate state từ điểm vào; refresh → mount như phiên mới KHÔNG filter (ux-spec §10)
  const initialLevel = (location.state as { level?: CefrLevel | null } | null)?.level ?? null;

  const {
    state,
    currentQuestion,
    currentResult,
    isAnswered,
    answeredCount,
    statuses,
    summary,
    actions,
    setLiveAnswered,
  } = useReadingSession(initialLevel);

  // ─── Local UI state (selection chưa submit) ─────────────────────────────────
  const [mcqSelection, setMcqSelection] = useState<string | null>(null);
  const [wordSelections, setWordSelections] = useState<Record<string, string> | null>(null);
  const [focusedBlank, setFocusedBlank] = useState<string | null>(null);

  // Reset selection khi chuyển câu
  useEffect(() => {
    setMcqSelection(currentResult?.selectedAnswer as string | null ?? null);
    setWordSelections(
      currentResult?.selectedAnswer && typeof currentResult.selectedAnswer === "object"
        ? (currentResult.selectedAnswer as Record<string, string>)
        : null,
    );
    setFocusedBlank(null);
    // Reset live answered cho câu mới
    setLiveAnswered(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?._id]);

  const isWordBank = currentQuestion?.type === "word-bank-fill";
  const blankCount = isWordBank
    ? Object.keys(currentQuestion.correctMapping).length
    : 0;

  // Live answered cho nút Submit: MCQ = đã chọn; word-bank = điền ĐỦ blanks
  useEffect(() => {
    if (!currentQuestion) return;
    if (isWordBank) {
      setLiveAnswered(
        wordSelections != null &&
          Object.keys(wordSelections).length === blankCount,
      );
    } else {
      setLiveAnswered(mcqSelection != null);
    }
  }, [mcqSelection, wordSelections, isWordBank, blankCount, currentQuestion, setLiveAnswered]);

  const canSubmit = isAnswered && !currentResult;
  const canNext = currentResult != null;

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !canSubmit) return;
    const selected: SelectedAnswer = isWordBank ? wordSelections : mcqSelection;
    actions.submitCurrentAnswer(selected);
  }, [currentQuestion, canSubmit, isWordBank, wordSelections, mcqSelection, actions]);

  const handleSelectWord = useCallback(
    (blankId: string, word: string) => {
      if (currentResult) return; // đã submit — khóa
      setWordSelections((prev) => ({ ...prev, [blankId]: word }));
      setFocusedBlank(null);
    },
    [currentResult],
  );

  const handleRemoveWord = useCallback(
    (blankId: string) => {
      if (currentResult) return;
      setWordSelections((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        delete next[blankId];
        return next;
      });
    },
    [currentResult],
  );

  // Phím mũi tên ←/→ chỉ điều hướng khi focus NGOÀI options/blanks (ux-spec §5)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (state.phase !== "READY") return;
      const target = event.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      const inQuestionArea =
        tag === "input" || tag === "button" || tag === "select" || tag === "textarea";
      if (inQuestionArea && !target.hasAttribute("data-nav-key")) return;

      if (event.key === "ArrowRight" && canNext && state.currentIndex < state.questions.length - 1) {
        event.preventDefault();
        actions.next();
      } else if (event.key === "ArrowLeft" && state.currentIndex > 0) {
        event.preventDefault();
        actions.previous();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.phase, state.currentIndex, state.questions.length, canNext, actions]);

  // beforeunload — refresh/đóng tab giữa phiên (AF-05)
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.phase === "READY" || state.phase === "FINISHING" || state.phase === "SUBMIT_ERROR") {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.phase]);

  // Thoát trong app — chặn bằng modal (không hủy request đang bay — ui-flow §4)
  useEffect(() => {
    if (state.phase === "READY" || state.phase === "FINISHING" || state.phase === "SUBMIT_ERROR") {
      const unblock = navigate.block?.(() => {
        actions.requestExit();
        return false;
      });
      return unblock;
    }
  }, [state.phase, navigate, actions]);

  const handleExitConfirmed = () => {
    actions.confirmExit();
    navigate("/practice/reading", { replace: true });
  };

  // ─── Render theo phase ──────────────────────────────────────────────────────
  if (state.phase === "LOADING") {
    return (
      <div className="max-w-3xl mx-auto pb-12">
        <QuestionSkeleton aria-busy="true" />
      </div>
    );
  }

  if (state.phase === "EMPTY") {
    return (
      <div className="max-w-3xl mx-auto py-16 pb-12">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <h2 className="text-xl font-extrabold text-slate-800">Chưa có bài tập</h2>
          <p className="mt-2 text-sm text-slate-500">
            Bộ đề Reading đang được cập nhật, quay lại sau nhé!
          </p>
          {state.level && (
            <p className="mt-1 text-xs text-slate-400">
              Mức độ {state.level} chưa có đề — thử bỏ lọc mức độ.
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate("/practice/reading")}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Quay lại
            </button>
            {state.level && (
              <button
                onClick={actions.retryLoad}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Thử lại
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === "LOAD_ERROR") {
    return (
      <div className="max-w-3xl mx-auto py-16 pb-12">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <h2 className="text-xl font-extrabold text-slate-800">Không tải được bài đọc</h2>
          <p className="mt-2 text-sm text-slate-500">
            Có lỗi xảy ra khi tải bộ đề. Vui lòng thử lại.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={actions.retryLoad}
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Thử lại
            </button>
            <button
              onClick={() => navigate("/practice/reading")}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === "FINISHED" && state.submitResponse) {
    return (
      <div className="max-w-3xl mx-auto pb-12">
        <CompletionScreen
          submitResponse={state.submitResponse}
          onTryAgain={actions.resetSession}
          onExit={() => navigate("/practice")}
        />
      </div>
    );
  }

  // READY / FINISHING / SUBMIT_ERROR / SUBMIT_IN_PROGRESS — render question area
  const isFinishing = state.phase === "FINISHING";
  const isSubmitError =
    state.phase === "SUBMIT_ERROR" || state.phase === "SUBMIT_IN_PROGRESS";

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <SessionHeader
        currentIndex={state.currentIndex}
        total={state.questions.length}
        questionType={currentQuestion?.type ?? null}
      />

      <div className="mt-5">
        <NavigatorPills
          total={state.questions.length}
          currentIndex={state.currentIndex}
          statuses={statuses}
          onSelect={actions.goToQuestion}
        />
      </div>

      {isSubmitError && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-semibold text-amber-800">
            {state.phase === "SUBMIT_IN_PROGRESS"
              ? "Kết quả đang được xử lý. Vui lòng thử lại sau."
              : "Không thể lưu kết quả."}
          </p>
          <button
            onClick={actions.retrySubmit}
            className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors cursor-pointer shrink-0"
          >
            Gửi lại kết quả
          </button>
        </div>
      )}

      {currentQuestion && (
        <div className="mt-6">
          <QuestionCard
            question={currentQuestion}
            mcqSelection={mcqSelection}
            wordSelections={wordSelections}
            focusedBlank={focusedBlank}
            submittedResult={currentResult}
            onSelectMcq={(answerId) => {
              if (currentResult) return;
              setMcqSelection(answerId);
            }}
            onSelectWord={handleSelectWord}
            onRemoveWord={handleRemoveWord}
            onFocusBlank={setFocusedBlank}
          />
        </div>
      )}

      {currentResult && (
        <div className="mt-4">
          <FeedbackBox
            isCorrect={currentResult.isCorrect}
            explanation={currentQuestion?.explanation}
            question={currentQuestion}
            submittedAnswer={currentResult.selectedAnswer}
          />
        </div>
      )}

      <div className="mt-6">
        <SessionNavButtons
          currentIndex={state.currentIndex}
          total={state.questions.length}
          canSubmit={canSubmit}
          canNext={canNext}
          isFinishing={isFinishing}
          isLast={state.currentIndex === state.questions.length - 1}
          onSubmit={handleSubmit}
          onPrevious={actions.previous}
          onNext={actions.next}
          onFinish={() => void actions.finish()}
        />
      </div>

      <ExitConfirmModal
        isOpen={state.exitRequested}
        title="Thoát phiên đọc?"
        message="Tiến trình chưa được lưu và sẽ bị mất nếu bạn thoát."
        confirmLabel="Thoát phiên"
        cancelLabel="Ở lại"
        onConfirm={handleExitConfirmed}
        onCancel={actions.cancelExit}
      />
    </div>
  );
}
