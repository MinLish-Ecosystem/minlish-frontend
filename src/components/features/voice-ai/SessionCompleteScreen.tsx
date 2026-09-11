/**
 * UC-13 Voice AI — Màn hoàn thành phiên (BR-09 / AC-14, CAP-12).
 * Tổng điểm tích lũy đạt targetScore → dừng hỏi–đáp, cho phép bắt đầu phiên mới.
 */
import { PartyPopper } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface SessionCompleteScreenProps {
  visible: boolean;
  accumulatedScore: number;
  targetScore: number;
  onNewSession: () => void;
}

export function SessionCompleteScreen({ visible, accumulatedScore, targetScore, onNewSession }: SessionCompleteScreenProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-12 gap-3"
          role="status"
          aria-live="polite"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <PartyPopper className="w-8 h-8 text-emerald-500" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Hoàn thành phiên 🎉</h3>
          <p className="text-sm text-slate-500">
            Bạn đã đạt {accumulatedScore}/{targetScore} điểm tổng. Chúc mừng!
          </p>
          <button
            type="button"
            onClick={onNewSession}
            className="mt-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold hover:shadow-purple-300 transition-all cursor-pointer"
          >
            Bắt đầu phiên mới
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
