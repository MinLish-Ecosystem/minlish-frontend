import React from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-purple-600 text-white hover:bg-purple-700",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  children?: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading,
  loadingLabel,
  className,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type ?? "button"}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {!loading && leftIcon}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
      {!loading && rightIcon}
    </button>
  );
}


