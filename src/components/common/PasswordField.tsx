import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import TextField from './TextField';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  error?: string;
  required?: boolean;
  inputClassName?: string;
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  leftIcon,
  error,
  required,
  inputClassName,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      id={id}
      label={label}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      leftIcon={leftIcon}
      rightElement={
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      }
      error={error}
      required={required}
      inputClassName={inputClassName}
    />
  );
}
