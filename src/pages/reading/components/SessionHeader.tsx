/**
 * Session header: "Câu {n}/{total}" + progress bar + type badge
 * Design: ux-spec.md §2.2, §6 (role=progressbar)
 */

import React from "react";
import { motion } from "motion/react";
import type { ReadingQuestionType } from "../../../features/reading/types/reading";
import { cn } from "../../../lib/utils";

const TYPE_LABELS: Record<ReadingQuestionType, string> = {
  "short-sentence-mcq": "Sentence Completion",
  "main-idea-mcq": "Ý CHÍNH",
  "word-bank-fill": "WORD BANK",
};

const TYPE_STYLES: Record<ReadingQuestionType, string> = {
  "short-sentence-mcq": "bg-purple-50 text-purple-600 border-purple-200",
  "main-idea-mcq": "bg-blue-50 text-blue-600 border-blue-200",
  "word-bank-fill": "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export default function SessionHeader({
  currentIndex,
  total,
  questionType,
}: {
  currentIndex: number;
  total: number;
  questionType: ReadingQuestionType | null;
}) {
  const pct = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-slate-700">
          Câu {currentIndex + 1}/{total}
        </p>
        {questionType && (
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
              TYPE_STYLES[questionType],
            )}
          >
            {TYPE_LABELS[questionType]}
          </span>
        )}
      </div>
      <div
        className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Câu ${currentIndex + 1} trên tổng ${total}`}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
