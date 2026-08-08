import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, HelpCircle, BookOpen } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { MainIdeaMCQ as MainIdeaMCQType } from "./types";

// ─── Option button component ───────────────────────────────────────────────────
function OptionButton({
  label,
  option,
  selected,
  isSubmitted,
  isCorrectAnswer,
  onClick,
}: {
  label: string;
  option: { id: string; text: string };
  selected: boolean;
  isSubmitted: boolean;
  isCorrectAnswer: boolean;
  onClick: () => void;
}) {
  let style = "border-slate-200 bg-white text-slate-700 hover:border-purple-400 hover:bg-purple-50";

  if (isSubmitted) {
    if (isCorrectAnswer) {
      style = "border-emerald-400 bg-emerald-50 text-emerald-700";
    } else if (selected) {
      style = "border-rose-400 bg-rose-50 text-rose-700";
    } else {
      style = "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
    }
  } else if (selected) {
    style = "border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-300";
  }

  return (
    <motion.button
      whileHover={!isSubmitted ? { scale: 1.01 } : {}}
      whileTap={!isSubmitted ? { scale: 0.99 } : {}}
      onClick={onClick}
      disabled={isSubmitted}
      className={cn(
        "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all font-medium text-sm flex items-start gap-3",
        style,
        isSubmitted ? "cursor-default" : "cursor-pointer"
      )}
    >
      {/* Label badge */}
      <span className={cn(
        "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border mt-0.5",
        selected && !isSubmitted
          ? "bg-purple-500 text-white border-purple-500"
          : "bg-slate-100 text-slate-600 border-slate-200"
      )}>
        {label}
      </span>

      <span className="flex-1 leading-relaxed">{option.text}</span>

      {/* Status icon */}
      <span className="shrink-0 mt-0.5">
        {isSubmitted && isCorrectAnswer && (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        )}
        {isSubmitted && selected && !isCorrectAnswer && (
          <XCircle className="w-5 h-5 text-rose-500" />
        )}
      </span>
    </motion.button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface MainIdeaMCQProps {
  question: MainIdeaMCQType;
  isSubmitted: boolean;
  isCorrect?: boolean;
  selectedAnswer?: string | null;
  onSelectAnswer?: (questionId: string, answer: string) => void;
  onSubmit?: (questionId: string) => void;
  onNext?: (questionId: string) => void;
  className?: string;
}

export default function MainIdeaMCQ({
  question,
  isSubmitted,
  isCorrect,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  onNext,
  className,
}: MainIdeaMCQProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(selectedAnswer ?? null);

  const handleSelect = (optionId: string) => {
    if (isSubmitted) return;
    setLocalSelected(optionId);
    onSelectAnswer?.(question.id, optionId);
  };

  const handleSubmit = () => {
    if (!localSelected) return;
    onSubmit?.(question.id);
  };

  const handleNext = () => {
    onNext?.(question.id);
  };

  // Get label letter (A, B, C, D)
  const optionLabels: Record<string, string> = {};
  question.options.forEach((opt, idx) => {
    optionLabels[opt.id] = String.fromCharCode(65 + idx); // A, B, C, D
  });

  return (
    <div className={cn("bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden", className)}>
      {/* Passage Section */}
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 p-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            {question.title ?? "Reading Passage"}
          </h3>
        </div>

        {/* Passage content */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
          <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">
            {question.passage}
          </p>
        </div>
      </div>

      {/* Question Section */}
      <div className="p-6">
        {/* Question */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold border border-purple-200">
              Q
            </div>
            <h3 className="text-base font-bold text-slate-700">
              {question.question}
            </h3>
          </div>

          {/* Highlight correct answer after submit */}
          {isSubmitted && (
            <div className={cn(
              "mt-3 p-3 rounded-xl text-sm font-medium flex items-center gap-2",
              isCorrect
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-rose-50 border border-rose-200 text-rose-700"
            )}>
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Correct! Well done.</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>
                    Incorrect. The correct answer is{" "}
                    <strong>
                      {optionLabels[question.correctAnswer]}: {" "}
                      {question.options.find(o => o.id === question.correctAnswer)?.text}
                    </strong>
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option) => (
            <OptionButton
              key={option.id}
              label={optionLabels[option.id]}
              option={option}
              selected={localSelected === option.id}
              isSubmitted={isSubmitted}
              isCorrectAnswer={question.correctAnswer === option.id}
              onClick={() => handleSelect(option.id)}
            />
          ))}
        </div>

        {/* Explanation */}
        {isSubmitted && question.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3"
          >
            <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Explanation</p>
              <p className="text-sm text-blue-800 leading-relaxed">{question.explanation}</p>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!localSelected}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                localSelected
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
