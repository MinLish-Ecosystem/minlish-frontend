import { ArrowLeft, Headphones } from "lucide-react";
import Badge from "../../common/Badge";
import ProgressBar from "../../common/ProgressBar";
import type { ListeningQuestionType } from "../../../types/listening";

const TYPE_LABELS: Record<ListeningQuestionType, string> = {
  transcription: "Viết lại",
  "word-order": "Ghép từ",
  mcq: "Trắc nghiệm",
};

export interface ListeningSessionHeaderProps {
  questionType: ListeningQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onExit: () => void;
}

/** Header phiên: nút thoát, tiêu đề, huy hiệu dạng câu, tiến độ (ui-flow.md §Layout Structure) */
export default function ListeningSessionHeader({
  questionType,
  questionNumber,
  totalQuestions,
  onExit,
}: ListeningSessionHeaderProps) {
  return (
    <header className="mb-6 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Thoát
        </button>
        <Badge variant="purple">{TYPE_LABELS[questionType]}</Badge>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <Headphones className="h-3.5 w-3.5" />
          Luyện nghe
        </span>
        <span>
          Câu {questionNumber} / {totalQuestions}
        </span>
      </div>

      <ProgressBar
        current={questionNumber}
        total={totalQuestions}
        label={`Tiến độ phiên luyện nghe, câu ${questionNumber} trên ${totalQuestions}`}
      />
    </header>
  );
}
