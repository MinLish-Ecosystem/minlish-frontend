import { Check, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { ListeningPillStatus } from "../../../types/listening";

const STATUS_META: Record<ListeningPillStatus, string> = {
  unanswered: "chưa làm",
  answered: "đã làm",
  correct: "đúng",
  incorrect: "sai",
};

const STATUS_CLASSES: Record<ListeningPillStatus, string> = {
  unanswered: "border-slate-200 bg-white text-slate-500",
  answered: "border-blue-200 bg-blue-50 text-blue-600",
  correct: "border-emerald-200 bg-emerald-50 text-emerald-600",
  incorrect: "border-rose-200 bg-rose-50 text-rose-600",
};

export interface ListeningQuestionNavProps {
  statuses: ListeningPillStatus[];
  currentIndex: number;
  /** Chỉ câu hiện tại hoặc câu đã nộp được phép mở — bảo vệ tiến trình (AC-06) */
  canGoTo: (index: number) => boolean;
  onGoTo: (index: number) => void;
}

/** Viên điều hướng câu 1..n — trạng thái thể hiện bằng icon/văn bản, không chỉ màu (ux-spec A11y) */
export default function ListeningQuestionNav({
  statuses,
  currentIndex,
  canGoTo,
  onGoTo,
}: ListeningQuestionNavProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Điều hướng câu hỏi">
      {statuses.map((status, index) => {
        const isActive = index === currentIndex;
        const selectable = isActive || canGoTo(index);
        return (
          <button
            key={index}
            type="button"
            onClick={() => onGoTo(index)}
            disabled={!selectable}
            aria-label={`Câu ${index + 1}: ${STATUS_META[status]}`}
            aria-current={isActive ? "step" : undefined}
            title={`Câu ${index + 1} — ${STATUS_META[status]}`}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-colors",
              STATUS_CLASSES[status],
              isActive && "ring-2 ring-purple-400 ring-offset-2",
              selectable ? "cursor-pointer hover:border-purple-300" : "cursor-not-allowed opacity-60",
              "motion-reduce:transition-none",
            )}
          >
            {status === "correct" ? (
              <Check className="h-4 w-4" />
            ) : status === "incorrect" ? (
              <X className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </button>
        );
      })}
    </div>
  );
}
