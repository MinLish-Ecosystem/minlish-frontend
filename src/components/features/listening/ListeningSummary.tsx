import { CheckCircle2, RotateCcw, Target, Timer } from "lucide-react";
import Button from "../../common/Button";
import Card from "../../common/Card";
import { formatDurationMs } from "../../../lib/listening.utils";

export interface ListeningSummaryProps {
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  totalTimeMs: number;
  onRetry: () => void;
  onExit: () => void;
}

/**
 * Vùng tổng kết phiên — hiển thị ngay trên màn hình phiên, không tạo route riêng
 * (ux-spec §3, ui-flow wireframe). Số liệu từ server (D-6); thời gian do FE đo.
 */
export default function ListeningSummary({
  correctCount,
  totalQuestions,
  accuracy,
  totalTimeMs,
  onRetry,
  onExit,
}: ListeningSummaryProps) {
  return (
    <Card className="p-8 text-center" role="status" aria-live="polite">
      <h2 className="text-xl font-bold text-slate-800">Kết quả phiên luyện nghe</h2>
      <p className="mt-1 text-sm text-slate-500">Kết quả được chấm theo dữ liệu máy chủ.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <CheckCircle2 className="mx-auto h-5 w-5 text-purple-600" />
          <p className="mt-2 text-2xl font-bold text-purple-700">
            {correctCount}/{totalQuestions}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-500">
            Số câu đúng
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <Target className="mx-auto h-5 w-5 text-emerald-600" />
          <p className="mt-2 text-2xl font-bold text-emerald-700">{accuracy}%</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
            Tỉ lệ đúng
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Timer className="mx-auto h-5 w-5 text-blue-600" />
          <p className="mt-2 text-2xl font-bold text-blue-700">{formatDurationMs(totalTimeMs)}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500">
            Thời gian
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Button leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onRetry}>
          Luyện lại
        </Button>
        <Button variant="outline" onClick={onExit}>
          Thoát
        </Button>
      </div>
    </Card>
  );
}
