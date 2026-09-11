import React from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant = "neutral" | "purple" | "success" | "danger" | "info";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
  purple: "border-purple-100 bg-purple-50 text-purple-700",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  danger: "border-rose-100 bg-rose-50 text-rose-700",
  info: "border-blue-100 bg-blue-50 text-blue-700",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children?: React.ReactNode;
}

export default function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
