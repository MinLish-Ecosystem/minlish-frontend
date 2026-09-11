import { useId } from "react";

export interface TranscriptionInputProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

/** Dạng transcription — ô nhập văn bản viết lại nội dung nghe được (D-3, BR-03) */
export default function TranscriptionInput({ value, disabled, onChange }: TranscriptionInputProps) {
  const inputId = useId();
  const hintId = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700">
        Viết lại những gì bạn nghe được
      </label>
      <textarea
        id={inputId}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        aria-describedby={hintId}
        placeholder="Gõ lại toàn bộ nội dung bạn nghe được…"
        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800 transition-colors placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-white motion-reduce:transition-none"
      />
      <p id={hintId} className="text-xs text-slate-400">
        Chấm điểm bỏ qua hoa thường và dấu câu nên bạn không cần lo phần này.
      </p>
    </div>
  );
}
