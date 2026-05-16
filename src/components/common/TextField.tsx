import React from 'react';
import FormError from './FormError';

interface TextFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  autoComplete?: string;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export default function TextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  leftIcon,
  rightElement,
  error,
  required,
  disabled,
  inputMode,
  maxLength,
  autoComplete,
  containerClassName,
  inputClassName,
  labelClassName,
}: TextFieldProps) {
  const hasLeft = Boolean(leftIcon);
  const hasRight = Boolean(rightElement);

  return (
    <div className={`space-y-2 ${containerClassName || ''}`}>
      {label && (
        <label htmlFor={id} className={labelClassName || 'text-sm font-semibold text-slate-700'}>
          {label}
        </label>
      )}
      <div className="relative">
        {hasLeft && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all ${
            hasLeft ? 'pl-12' : 'pl-4'
          } ${hasRight ? 'pr-12' : 'pr-4'} ${inputClassName || ''}`}
          required={required}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
        />
        {hasRight && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            {rightElement}
          </span>
        )}
      </div>
      <FormError message={error} />
    </div>
  );
}
