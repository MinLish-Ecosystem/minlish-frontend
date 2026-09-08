/**
 * UC-13 Voice AI — Modal xác nhận đổi tier (AF-01, BR-03, CAP-05).
 * Hỏi đơn giản "Bạn có chắc muốn thay đổi mức cấu hình không?" — Có = purge toàn bộ weights rồi tải mới; Không/Escape = giữ tier cũ.
 */
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface SwitchTierConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SwitchTierConfirmModal({ open, onConfirm, onCancel }: SwitchTierConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận đổi tier"
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-black text-slate-800 mb-2">Đổi mức cấu hình?</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              Bạn có chắc muốn thay đổi mức cấu hình không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Không
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-300 transition-all cursor-pointer"
              >
                Có
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
