import React from 'react';

interface SubmitButtonProps {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  rightIcon?: React.ReactNode;
  className?: string;
}

export default function SubmitButton({
  label,
  loading,
  disabled,
  rightIcon,
  className,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={className || 'w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-xl shadow-purple-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2'}
    >
      {loading ? `${label}...` : label}
      {!loading && rightIcon}
    </button>
  );
}

