/**
 * Dạng 2: main-idea-mcq — title/passage/question + radio options
 * Design: ux-spec.md §4.1, component-design.md §3
 */

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { MainIdeaMcqQuestion } from "../../../features/reading/types/reading";

export default function MainIdeaMcq({
  question,
  selectedAnswer,
  submitted,
  isCorrect,
  onSelect,
}: {
  question: MainIdeaMcqQuestion;
  selectedAnswer: string | null;
  submitted: boolean;
  isCorrect?: boolean;
  onSelect(answerId: string): void;
}) {
  return (
    <fieldset
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
      disabled={submitted}
    >
      {question.title && (
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          {question.title}
        </p>
      )}

      {/* Passage */}
      <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
        <p className="text-base leading-relaxed text-slate-700 whitespace-pre-line">
          {question.passage}
        </p>
      </div>

      {/* Question */}
      <p className="mt-5 text-base font-bold text-slate-800">
        {question.question ?? "What is the main idea of this passage?"}
      </p>

      {/* Options */}
      <div className="mt-4 space-y-3" role="radiogroup" aria-label="Chọn ý chính">
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
                "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all font-medium text-sm flex items-start gap-3 cursor-pointer disabled:cursor-default",
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
