import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../../common/Button";

export interface ListeningSessionActionsProps {
  canPrevious: boolean;
  canSubmit: boolean;
  canNext: boolean;
  hasSubmittedCurrent: boolean;
  /** Số câu chưa nộp — cảnh báo sẽ tính sai khi hoàn tất (AF-04, ux-spec rào cản) */
  unfinishedCount: number;
  isFinishing: boolean;
  onPrevious: () => void;
  onSubmit: () => void;
  onNext: () => void;
  onFinish: () => void;
}

/** Thanh hành động: Trước/Sau, Nộp câu (Kiểm tra), Hoàn thành (ui-flow.md §Layout Structure) */
export default function ListeningSessionActions({
  canPrevious,
  canSubmit,
  canNext,
  hasSubmittedCurrent,
  unfinishedCount,
  isFinishing,
  onPrevious,
  onSubmit,
  onNext,
  onFinish,
}: ListeningSessionActionsProps) {
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
          onClick={onPrevious}
          disabled={!canPrevious || isFinishing}
        >
          Trước
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          {!hasSubmittedCurrent && (
            <Button onClick={onSubmit} disabled={!canSubmit || isFinishing}>
              Kiểm tra
            </Button>
          )}
          <Button
            variant="outline"
            rightIcon={<ChevronRight className="h-4 w-4" />}
            onClick={onNext}
            disabled={!canNext || isFinishing}
          >
            Sau
          </Button>
          <Button onClick={onFinish} loading={isFinishing} loadingLabel="Đang gửi…">
            Hoàn thành
          </Button>
        </div>
      </div>

      {unfinishedCount > 0 && !isFinishing && (
        <p className="mt-3 text-center text-xs font-medium text-amber-600">
          Còn {unfinishedCount} câu chưa làm — những câu này sẽ được tính là sai khi hoàn tất phiên.
        </p>
      )}
    </div>
  );
}
