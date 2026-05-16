import React from "react";
import { cn } from "../../lib/utils";

export interface LoadingProps {
  className?: string;
  label?: string;
}

export default function Loading({ className, label = "Loading..." }: LoadingProps) {
  return (
    <div className={cn("flex items-center gap-2 text-slate-500", className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

