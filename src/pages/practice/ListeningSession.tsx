/**
 * Trang phiên luyện nghe — UC-15 / FR-111
 * Route: /practice/listening/session (MainLayout + ProtectedRoute — ui-flow.md Route Map)
 * States: INIT/EMPTY/LOAD_ERROR/QUESTION/SUBMITTED/FINISHING/FINISHED/FINISH_ERROR/EXIT_MODAL
 * theo ux-spec.md §Màn hình & Trạng thái.
 */
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import Skeleton from "../../components/common/Skeleton";
import ListeningAudioPlayer from "../../components/features/listening/ListeningAudioPlayer";
import ListeningExitModal from "../../components/features/listening/ListeningExitModal";
import ListeningFeedback from "../../components/features/listening/ListeningFeedback";
import ListeningQuestionCard from "../../components/features/listening/ListeningQuestionCard";
import ListeningQuestionNav from "../../components/features/listening/ListeningQuestionNav";
import ListeningSessionActions from "../../components/features/listening/ListeningSessionActions";
import ListeningSessionHeader from "../../components/features/listening/ListeningSessionHeader";
import ListeningSummary from "../../components/features/listening/ListeningSummary";
import { useListeningSession } from "../../hooks/useListeningSession";
import type { ListeningLevel } from "../../types/listening";

const VALID_LEVELS: ListeningLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Trình độ truyền qua query ?level= — sai giá trị thì bỏ qua, dùng mặc định BE (ui-flow.md) */
function parseLevel(raw: string | null): ListeningLevel | null {
  if (raw && (VALID_LEVELS as string[]).includes(raw)) {
    return raw as ListeningLevel;
  }
  return null;
}

/** Skeleton khớp bố cục phiên khi đang tải đề (EXPERIENCE.md State Patterns) */
function SessionSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto max-w-2xl space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-9 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-52 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export default function ListeningSession() {
  const [searchParams] = useSearchParams();
  const level = parseLevel(searchParams.get("level"));
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);
  const session = useListeningSession(level);

  const requestExit = () => {
    if (!session.isSubmitting) {
      setShowExitModal(true);
    }
  };

  if (session.sessionStatus === "idle" || session.sessionStatus === "loading") {
    return <SessionSkeleton />;
  }

  if (session.sessionStatus === "empty") {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <EmptyState
          title="Chưa có bài tập"
          description="Bộ đề Listening đang được cập nhật, quay lại sau nhé!"
          action={<Button onClick={() => navigate("/practice")}>Thoát</Button>}
        />
      </div>
    );
  }

  if (session.sessionStatus === "error") {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <EmptyState
          title="Có lỗi xảy ra"
          description="Không tải được bài nghe. Vui lòng thử lại."
          action={
            <div className="flex gap-3">
              <Button onClick={session.retryLoad}>Thử lại</Button>
              <Button variant="outline" onClick={() => navigate("/practice")}>
                Thoát
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (session.sessionStatus === "finished" && session.result) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ListeningSummary
          correctCount={session.result.correctCount}
          totalQuestions={session.result.totalQuestions}
          accuracy={session.result.accuracy}
          totalTimeMs={session.totalTimeMs}
          onRetry={session.resetForNewSession}
          onExit={() => navigate("/practice")}
        />
      </div>
    );
  }

  // ready | finishing | submit_error — phiên đang diễn ra
  const { currentQuestion, currentFeedback } = session;
  if (!currentQuestion) {
    return null;
  }

  const answerOnRecord = currentFeedback
    ? session.answers[currentQuestion.id]?.value ?? null
    : null;

  return (
    <div className="mx-auto max-w-2xl pb-12">
      <ListeningSessionHeader
        questionType={currentQuestion.type}
        questionNumber={session.currentIndex + 1}
        totalQuestions={session.questions.length}
        onExit={requestExit}
      />

      <ListeningQuestionNav
        statuses={session.pillStatuses}
        currentIndex={session.currentIndex}
        canGoTo={session.canGoTo}
        onGoTo={session.goToQuestion}
      />

      <ListeningAudioPlayer questionId={currentQuestion.id} disabled={session.isSubmitting} />

      <Card className="mb-6 p-6">
        <ListeningQuestionCard
          question={currentQuestion}
          value={currentFeedback ? answerOnRecord : session.draftAnswer}
          disabled={currentFeedback != null || session.isSubmitting}
          onChange={session.setDraftAnswer}
        />
      </Card>

      {currentFeedback && (
        <ListeningFeedback key={currentQuestion.id} feedback={currentFeedback} />
      )}

      {session.sessionStatus === "submit_error" && (
        <div role="alert" className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">Không gửi được kết quả phiên.</p>
          <p className="mt-1 text-xs text-rose-600">
            Tiến trình vẫn được giữ lại. Bạn có thể gửi lại hoặc thoát phiên.
          </p>
          <div className="mt-3 flex gap-3">
            <Button size="sm" onClick={session.retrySubmit}>
              Gửi lại
            </Button>
            <Button size="sm" variant="outline" onClick={requestExit}>
              Thoát
            </Button>
          </div>
        </div>
      )}

      <ListeningSessionActions
        canPrevious={session.currentIndex > 0}
        canSubmit={session.canSubmit}
        canNext={currentFeedback != null && session.currentIndex < session.questions.length - 1}
        hasSubmittedCurrent={currentFeedback != null}
        unfinishedCount={session.unfinishedCount}
        isFinishing={session.isSubmitting}
        onPrevious={session.previous}
        onSubmit={session.submitCurrentAnswer}
        onNext={session.next}
        onFinish={session.finish}
      />

      <ListeningExitModal
        isOpen={showExitModal}
        onStay={() => setShowExitModal(false)}
        onExit={() => navigate("/practice")}
      />
    </div>
  );
}
