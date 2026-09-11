import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Info, XCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { ListeningQuestionFeedback } from "../../../types/listening";

export interface ListeningFeedbackProps {
  feedback: ListeningQuestionFeedback;
}

/**
 * Vùng kết quả câu sau khi nộp: đúng/sai + giải thích + transcript (BR-05, D-2).
 * Nằm trong vùng sống để trình đọc màn hình đọc ngay; không hiển thị correctOrder (D-2).
 * Với hợp đồng hiện tại (API-01 không trả đáp án — AC-14) status là 'answered',
 * các nhánh correct/incorrect sẵn sàng cho khi BE bổ sung dữ liệu chấm (xem build-notes).
 */
export default function ListeningFeedback({ feedback }: ListeningFeedbackProps) {
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const toneClasses =
    feedback.status === "correct"
      ? "border-emerald-100 bg-emerald-50"
      : feedback.status === "incorrect"
        ? "border-rose-100 bg-rose-50"
        : "border-blue-100 bg-blue-50";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("mb-6 rounded-2xl border p-5", toneClasses)}
    >
      {feedback.status === "correct" && (
        <p className="flex items-center gap-2 text-base font-bold text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          Chính xác!
        </p>
      )}
      {feedback.status === "incorrect" && (
        <p className="flex items-center gap-2 text-base font-bold text-rose-700">
          <XCircle className="h-5 w-5" />
          Chưa đúng
        </p>
      )}
      {feedback.status === "answered" && (
        <>
          <p className="flex items-center gap-2 text-base font-bold text-blue-700">
            <Info className="h-5 w-5" />
            Đã ghi nhận đáp án của bạn
          </p>
          <p className="mt-1 text-sm text-blue-600">
            Kết quả chính thức do hệ thống chấm khi bạn hoàn thành phiên.
          </p>
        </>
      )}

      {feedback.explanation && (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-700">Giải thích: </span>
          {feedback.explanation}
        </p>
      )}

      {feedback.transcript != null && (
        <div className="mt-3 border-t border-slate-200/60 pt-3">
          <button
            type="button"
            onClick={() => setTranscriptExpanded((prev) => !prev)}
            aria-expanded={transcriptExpanded}
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-purple-600"
          >
            {transcriptExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {transcriptExpanded ? "Ẩn transcript" : "Xem transcript"}
          </button>
          {transcriptExpanded && (
            <p className="mt-2 rounded-xl bg-white/70 p-3 text-sm leading-relaxed text-slate-700">
              {feedback.transcript}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
