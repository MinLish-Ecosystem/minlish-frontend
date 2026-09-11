/**
 * Dạng 1: short-sentence-mcq — sentence render ___blank___ thành slot + radio options
 * Design: ux-spec.md §4.1, component-design.md §3 (radiogroup ARIA)
 */

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { ShortSentenceMcqQuestion } from "../../../features/reading/types/reading";

function BlankSlot({ filled, correct, text }: { filled: boolean; correct?: boolean; text?: string }) {
  const base =
    "inline-block min-w-[90px] px-3 py-1 rounded-lg border-2 text-center font-bold align-middle";
  if (!filled) {
    return (
      <span className={cn(base, "border-dashed border-slate-400 text-slate-400 bg-slate-50")}>
        ___?___
      </span>
    );
  }
  return (
    <span
      className={cn(
        base,
        correct
          ? "border-emerald-400 bg-emerald-50 text-emerald-600"
          : "border-rose-400 bg-rose-50 text-rose-600",
      )}
    >
      {text}
    </span>
  );
}

export default function ShortSentenceMcq({
  question,
  selectedAnswer,
  submitted,
  isCorrect,
  onSelect,
}: {
  question: ShortSentenceMcqQuestion;
  selectedAnswer: string | null;
  submitted: boolean;
  isCorrect?: boolean;
  onSelect(answerId: string): void;
}) {
  // Marker ___blank___ → slot hiển thị lựa chọn
  const parts = question.sentence.split(/_{3,}blank_{3,}/i);

  const selectedOptionText = selectedAnswer
    ? question.options.find((o) => o.id === selectedAnswer)?.text ?? null
    : null;

  return (
    <fieldset
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
      disabled={submitted}
    >
      <legend className="sr-only">Câu hỏi điền khuyết</legend>

      {/* Sentence với slot */}
      <p className="text-lg font-medium text-slate-800 leading-relaxed">
        {parts[0]}
        <BlankSlot filled={selectedAnswer != null} correct={submitted ? isCorrect : undefined} text={selectedOptionText} />
        {parts[1]}
      </p>

      {/* Options */}
      <div className="mt-6 space-y-3" role="radiogroup" aria-label="Chọn đáp án">
        {question.options.map((option) => {
          const selected = selectedAnswer === option.id;
          const isCorrectAnswer = submitted && option.id === question.correctAnswer;
          const isWrongSelected = submitted && selected && option.id !== question.correctAnswer;

          let style =
            "border-slate-200 bg-white text-slate-700 hover:border-purple-400 hover:bg-purple-50";
          if (isCorrectAnswer) {
            style = "border-emerald-400 bg-emerald-50 text-emerald-700";
          } else if (isWrongSelected) {
            style = "border-rose-400 bg-rose-50 text-rose-700";
          } else if (submitted) {
            style = "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
          } else if (selected) {
            style = "border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-300";
          }

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={submitted}
              onClick={() => onSelect(option.id)}
              className={cn(
                "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center gap-3 cursor-pointer disabled:cursor-default",
                style,
              )}
            >
              <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-black shrink-0">
                {option.id.toUpperCase()}
              </span>
              <span className="flex-1">{option.text}</span>
              {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              {isWrongSelected && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
