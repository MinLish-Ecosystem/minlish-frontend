import { useId } from "react";
import { cn } from "../../../lib/utils";
import type { ListeningQuestionOption } from "../../../types/listening";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export interface McqOptionsProps {
  options: ListeningQuestionOption[];
  value: string | null;
  disabled: boolean;
  onChange: (optionId: string) => void;
}

/** Dạng mcq — nhóm lựa chọn A/B/C/D (D-3, BR-03); fieldset/radio cho a11y chuẩn */
export default function McqOptions({ options, value, disabled, onChange }: McqOptionsProps) {
  const groupName = useId();
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="text-sm font-semibold text-slate-700">Chọn đáp án bạn nghe được</legend>
      {options.map((option, index) => {
        const letter = OPTION_LETTERS[index] ?? String(index + 1);
        const checked = value === option.id;
        return (
          <label
            key={option.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors",
              checked
                ? "border-purple-400 bg-purple-50"
                : "border-slate-200 bg-white hover:border-purple-200",
              disabled && "cursor-not-allowed opacity-80",
              "motion-reduce:transition-none",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.id}
              checked={checked}
              onChange={() => onChange(option.id)}
              className="h-4 w-4 accent-purple-600"
            />
            <span className="text-sm font-bold text-purple-600">{letter}.</span>
            <span className="text-sm text-slate-700">{option.text}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
