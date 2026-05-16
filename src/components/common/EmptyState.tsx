import React from "react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-slate-200 p-8 text-center", className)}>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

