import React from "react";
import { cn } from "../../../lib/utils";
import type { ReadingQuestion as ReadingQuestionType } from "./types";
import ShortSentenceMCQ from "./ShortSentenceMCQ";
import MainIdeaMCQ from "./MainIdeaMCQ";
import WordBankFill from "./WordBankFill";

interface ReadingQuestionProps {
  question: ReadingQuestionType;
  isSubmitted: boolean;
  isCorrect?: boolean;
  selectedAnswer?: string | null;
  wordSelections?: Record<string, string>;
  onSelectAnswer?: (questionId: string, answer: string) => void;
  onSelectWord?: (questionId: string, blankId: string, word: string) => void;
  onSubmit?: (questionId: string) => void;
  onNext?: (questionId: string) => void;
  className?: string;
}

/**
 * Main ReadingQuestion wrapper component.
 * Renders the correct sub-component based on question.type
 */
export default function ReadingQuestion({
  question,
  isSubmitted,
  isCorrect,
  selectedAnswer,
  wordSelections,
  onSelectAnswer,
  onSelectWord,
  onSubmit,
  onNext,
  className,
}: ReadingQuestionProps) {
  const commonProps = {
    isSubmitted,
    isCorrect,
    selectedAnswer,
    onSubmit,
    onNext,
    className,
  };

  switch (question.type) {
    case "short-sentence-mcq":
      return (
        <ShortSentenceMCQ
          question={question}
          {...commonProps}
          onSelectAnswer={onSelectAnswer}
        />
      );

    case "main-idea-mcq":
      return (
        <MainIdeaMCQ
          question={question}
          {...commonProps}
          onSelectAnswer={onSelectAnswer}
        />
      );

    case "word-bank-fill":
      return (
        <WordBankFill
          question={question}
          {...commonProps}
          wordSelections={wordSelections}
          onSelectWord={onSelectWord}
        />
      );

    default:
      return (
        <div className={cn(
          "bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-center min-h-[200px]",
          className
        )}>
          <p className="text-slate-400 text-sm font-medium">
            Unknown question type: {(question as any).type}
          </p>
        </div>
      );
  }
}
