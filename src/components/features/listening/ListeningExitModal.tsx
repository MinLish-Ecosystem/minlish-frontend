import { AlertTriangle } from "lucide-react";
import Button from "../../common/Button";
import Modal from "../../common/Modal";

export interface ListeningExitModalProps {
  isOpen: boolean;
  onStay: () => void;
  onExit: () => void;
}

/** Hộp thoại xác nhận thoát giữa phiên — thoát không gửi dữ liệu lên server (AF-05, AC-12) */
export default function ListeningExitModal({ isOpen, onStay, onExit }: ListeningExitModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onStay}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <h3 className="text-base font-extrabold text-slate-800">
            Xác nhận thoát phiên luyện nghe
          </h3>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Tiến trình chưa được lưu và sẽ bị mất khi bạn thoát. Bạn có chắc muốn thoát?
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onStay} autoFocus>
            Ở lại
          </Button>
          <Button variant="danger" size="sm" onClick={onExit}>
            Thoát
          </Button>
        </div>
      </div>
    </Modal>
  );
}
