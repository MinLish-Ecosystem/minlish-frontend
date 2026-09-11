import React from "react";
import { cn } from "../../lib/utils";

export interface SkeletonProps {
  className?: string;
}

/** Khối skeleton pulse — trạng thái tải khớp bố cục (EXPERIENCE.md State Patterns) */
export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-xl bg-slate-200/70 motion-safe:animate-pulse",
        className,
      )}
    />
  );
}
