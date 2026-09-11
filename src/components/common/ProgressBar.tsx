import React from "react";
import { cn } from "../../lib/utils";

export interface ProgressBarProps {
  /** Giá trị hiện tại (ví dụ vị trí câu hiện tại) */
  current: number;
  total: number;
  className?: string;
  /** Nhãn aria cho trình đọc màn hình */
  label?: string;
}

export default function ProgressBar({ current, total, className, label }: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(current, total)}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-slate-100", className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
