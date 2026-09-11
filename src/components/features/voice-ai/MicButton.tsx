/**
 * UC-13 Voice AI — Mic toggle button (CAP-06, BR-04, BR-05, ux-spec §5.1).
 * States: idle → recording (viền đỏ pulse + timer) → processing → blocked-download → blocked-permission.
 * Touch target ≥44px mobile / 64px desktop (a11y floor). Mọi state đều có text + icon, không chỉ màu.
 */
import { Lock, Mic, Square } from 'lucide-react';
import { motion } from 'motion/react';
import type { MicState } from './types';

interface MicButtonProps {
  state: MicState;
  recordingSeconds: number;
  downloading: boolean;
  onToggle: () => void;
}

const formatSeconds = (total: number): string => {
  const minutes = Math.floor(total / 60).toString().padStart(2, '0');
  const seconds = (total % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export function MicButton({ state, recordingSeconds, downloading, onToggle }: MicButtonProps) {
  const disabled = state === 'processing' || state === 'disabled' || (downloading && state !== 'recording');
  const ariaLabel =
    state === 'recording'
      ? 'Dừng ghi âm'
      : state === 'processing'
        ? 'Đang xử lý'
        : state === 'blocked-download'
          ? 'Model đang tải, vui lòng chờ'
          : state === 'blocked-permission'
            ? 'Chưa cấp quyền micro'
            : 'Bắt đầu ghi âm';

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={state === 'recording'}
        whileHover={disabled ? undefined : { scale: 1.06 }}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        className={`relative w-16 h-16 md:w-[64px] md:h-[64px] rounded-full flex items-center justify-center shadow-lg transition-all ${
          disabled
            ? 'bg-slate-300/80 cursor-not-allowed shadow-none' // mờ — vô hiệu hóa khi AI nói/đang xử lý
            : state === 'recording'
              ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
              : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:shadow-purple-300'
        }`}
      >
        {state === 'recording' && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full bg-red-500/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-red-500/15"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
          </>
        )}
        {/* Icon mic ở MỌI trạng thái — khi AI nói/đang xử lý chỉ MỜ + khóa (không spinner xoay) */}
        {state === 'blocked-permission' ? (
          <Lock className="w-6 h-6 text-white" aria-hidden="true" />
        ) : state === 'recording' ? (
          <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center" aria-hidden="true">
            <Square className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </span>
        ) : (
          <Mic className={`w-7 h-7 text-white ${disabled ? 'opacity-60' : ''}`} aria-hidden="true" />
        )}
      </motion.button>
      <p className="text-xs font-medium text-slate-500" role="status" aria-live="polite">
        {state === 'recording'
          ? `Đang nghe… ${formatSeconds(recordingSeconds)} — bấm lần nữa để dừng`
          : state === 'processing'
            ? 'AI đang trả lời…'
            : state === 'blocked-download'
              ? 'Đang tải model…'
              : state === 'blocked-permission'
                ? 'Chưa cấp quyền micro'
                : 'Bấm mic để nói'}
      </p>
    </div>
  );
}
