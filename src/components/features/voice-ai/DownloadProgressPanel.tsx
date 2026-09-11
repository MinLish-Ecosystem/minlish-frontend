/**
 * UC-13 Voice AI — Download progress panel (CAP-04, ux-spec §4.2).
 * 3 progress bars song song (stt/llm/tts) + tổng dung lượng + Retry khi lỗi.
 */
import { RotateCcw } from 'lucide-react';
import type { DownloadProgress } from './types';
import { formatGigaBytes } from './utils/eligibility';

interface DownloadProgressPanelProps {
  visible: boolean;
  progress: DownloadProgress[];
  totalSizeMB: number;
  onRetry?: () => void;
  hasError: boolean;
}

export function DownloadProgressPanel({ visible, progress, totalSizeMB, onRetry, hasError }: DownloadProgressPanelProps) {
  if (!visible) return null;
  return (
    <div className="px-4 py-4 rounded-xl bg-white border border-slate-200 shadow-sm" role="group" aria-label="Tiến trình tải model">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-slate-700">{hasError ? 'Tải model thất bại' : 'Đang tải model…'}</p>
        <p className="text-xs text-slate-400">Tổng: {formatGigaBytes(totalSizeMB)}</p>
      </div>
      <div className="space-y-2.5" aria-busy={!hasError}>
        {progress.map((item) => (
          <div key={item.component} className="flex items-center gap-3">
            <span className="w-8 text-xs font-bold uppercase text-slate-500">{item.component}</span>
            <div
              className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"
              role="progressbar"
              aria-valuenow={item.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Tiến trình ${item.component}`}
            >
              <div
                className={`h-full rounded-full transition-all ${hasError ? 'bg-red-400' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                style={{ width: `${item.percent}%` }}
              />
            </div>
            <span className="w-10 text-right text-[10px] text-slate-400">{item.percent}%</span>
          </div>
        ))}
      </div>
      {hasError && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Thử lại
        </button>
      )}
    </div>
  );
}
