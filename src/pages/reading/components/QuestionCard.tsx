/**
 * QuestionCard — switch theo question.type, render đúng component con (BR-01)
 * Design: component-design.md §3
 */

import React from "react";
import type {
  MainIdeaMcqQuestion,
  QuestionResult,
  ReadingQuestion,
  ShortSentenceMcqQuestion,
  WordBankFillQuestion,
} from "../../../features/reading/types/reading";
import ShortSentenceMcq from "./ShortSentenceMcq";
import MainIdeaMcq from "./MainIdeaMcq";
import WordBankFill from "./WordBankFill";

export default function QuestionCard({
  question,
  mcqSelection,
  wordSelections,
  focusedBlank,
  submittedResult,
  onSelectMcq,
  onSelectWord,
  onRemoveWord,
  onFocusBlank,
}: {
  question: ReadingQuestion;
  mcqSelection: string | null;
  wordSelections: Record<string, string> | null;
  focusedBlank: string | null;
  submittedResult: QuestionResult | null;
  onSelectMcq(answerId: string): void;
  onSelectWord(blankId: string, word: string): void;
  onRemoveWord(blankId: string): void;
  onFocusBlank(blankId: string | null): void;
}) {
  const isSubmitted = submittedResult != null;
  const isCorrect = submittedResult?.isCorrect;

  if (question.type === "short-sentence-mcq") {
    return (
      <ShortSentenceMcq
        question={question as ShortSentenceMcqQuestion}
        selectedAnswer={mcqSelection}
        submitted={isSubmitted}
        isCorrect={isCorrect}
        onSelect={onSelectMcq}
      />
    );
  }

  if (question.type === "main-idea-mcq") {
    return (
      <MainIdeaMcq
        question={question as MainIdeaMcqQuestion}
        selectedAnswer={mcqSelection}
        submitted={isSubmitted}
        isCorrect={isCorrect}
        onSelect={onSelectMcq}
      />
    );
  }

  return (
    <WordBankFill
      question={question as WordBankFillQuestion}
      filledBlanks={wordSelections}
      focusedBlank={focusedBlank}
      submitted={isSubmitted}
      isCorrect={isCorrect}
      onSelectWord={onSelectWord}
      onRemoveWord={onRemoveWord}
      onFocusBlank={onFocusBlank}
    />
  );
}
