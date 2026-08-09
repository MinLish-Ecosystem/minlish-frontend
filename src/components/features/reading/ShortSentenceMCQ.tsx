import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { ShortSentenceMCQ as ShortSentenceMCQType } from "./types";

// ─── Blank indicator component ────────────────────────────────────────────────
function BlankIndicator({ isAnswered, isCorrect, selectedAnswer }: {
  isAnswered: boolean;
  isCorrect?: boolean;
  selectedAnswer?: string;
}) {
  const baseClass = "inline-block min-w-[80px] px-3 py-1 rounded-lg border-2 text-center font-bold text-base align-middle"
  if (!isAnswered) {
    return (
      <span className={cn(
        baseClass,
        "border-dashed border-slate-400 text-slate-400 bg-slate-50"
      )}>
        ___?___
      </span>
    );
  }
  if (isCorrect) {
    return (
      <span className={cn(
        baseClass,
        "border-emerald-400 bg-emerald-50 text-emerald-600"
      )}>
        {selectedAnswer}
      </span>
    );
  }
  return (
    <span className={cn(
      baseClass,
      "border-rose-400 bg-rose-50 text-rose-600"
    )}>
      {selectedAnswer}
    </span>
  );
}

// ─── Option button component ───────────────────────────────────────────────────
function OptionButton({
  option,
  selected,
  isSubmitted,
  isCorrectAnswer,
  onClick,
}: {
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
      whileHover={!isSubmitted ? { scale: 1.02 } : {}}
      whileTap={!isSubmitted ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={isSubmitted}
      className={cn(
        "w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm flex items-center gap-3",
        style,
        isSubmitted ? "cursor-default" : "cursor-pointer"
      )}
    >
      {/* Status icon when submitted */}
      {isSubmitted && (
        <span className="shrink-0">
          {isCorrectAnswer ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : selected ? (
            <XCircle className="w-5 h-5 text-rose-500" />
          ) : null}
        </span>
      )}

      <span className="flex-1">{option.text}</span>

      {/* Selected indicator when not submitted */}
      {!isSubmitted && selected && (
        <span className="shrink-0 w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
          ✓
        </span>
      )}
    </motion.button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface ShortSentenceMCQProps {
  question: ShortSentenceMCQType;
  isSubmitted: boolean;
  isCorrect?: boolean;
  selectedAnswer?: string | null;
  onSelectAnswer?: (questionId: string, answer: string) => void;
  onSubmit?: (questionId: string) => void;
  onNext?: (questionId: string) => void;
  className?: string;
}

export default function ShortSentenceMCQ({
  question,
  isSubmitted,
  isCorrect,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  onNext,
  className,
}: ShortSentenceMCQProps) {
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

  // Render sentence với ___blank___ được thay bằng BlankIndicator
  const renderSentence = () => {
    const parts = question.sentence.split("___blank___");
    return parts.map((part, idx) => (
      <React.Fragment key={idx}>
        <span>{part}</span>
        {idx < parts.length - 1 && (
          <BlankIndicator
            isAnswered={isSubmitted || !!selectedAnswer}
            isCorrect={isSubmitted ? isCorrect : undefined}
            selectedAnswer={selectedAnswer ?? localSelected ?? undefined}
          />
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className={cn("bg-white rounded-3xl p-6 border border-slate-200 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold border border-purple-200">
          {question.questionNumber ?? "?"}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Complete the sentence
          </h3>
          <p className="text-xs text-slate-400">Choose the correct answer to fill in the blank</p>
        </div>
      </div>

      {/* Sentence with blank */}
      <div className="mb-6">
        <p className="text-lg leading-relaxed text-slate-700 font-medium">
          {renderSentence()}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            selected={localSelected === option.id}
            isSubmitted={isSubmitted}
            isCorrectAnswer={question.correctAnswer === option.id}
            onClick={() => handleSelect(option.id)}
          />
        ))}
      </div>

      {/* Explanation (shown after submit) */}
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
  );
}
