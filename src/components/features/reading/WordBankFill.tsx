import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, HelpCircle, RefreshCw } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { WordBankFill as WordBankFillType } from "./types";

// ─── Word Chip (clickable word from word bank) ────────────────────────────────
function WordChip({
  word,
  isUsed,
  isCorrect,
  isSubmitted,
  onClick,
}: {
  word: string;
  isUsed: boolean;
  isCorrect?: boolean;
  isSubmitted: boolean;
  onClick: () => void;
}) {
  let style = "border-slate-300 bg-white text-slate-700 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700";

  if (isSubmitted) {
    if (isCorrect === true) {
      style = "border-emerald-400 bg-emerald-50 text-emerald-700";
    } else if (isCorrect === false) {
      style = "border-rose-400 bg-rose-50 text-rose-700";
    } else {
      style = "border-slate-200 bg-slate-50 text-slate-400";
    }
  } else if (isUsed) {
    style = "border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-300";
  }

  return (
    <motion.button
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={!isUsed && !isSubmitted ? { scale: 1.05 } : {}}
      whileTap={!isUsed && !isSubmitted ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={isSubmitted}
      className={cn(
        "px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all cursor-pointer select-none",
        style,
        isUsed && !isSubmitted ? "cursor-pointer" : "",
        isUsed ? "cursor-default" : !isSubmitted ? "cursor-pointer" : "cursor-default"
      )}
    >
      {word}
    </motion.button>
  );
}

// ─── Blanks Status Indicator ───────────────────────────────────────────────────
function BlanksStatus({
  totalBlanks,
  filledCount,
  correctCount,
  isSubmitted,
}: {
  totalBlanks: number;
  filledCount: number;
  correctCount: number;
  isSubmitted: boolean;
}) {
  const pct = totalBlanks > 0 ? Math.round((filledCount / totalBlanks) * 100) : 0;

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
        <span>
          {filledCount}/{totalBlanks} blanks filled
          {isSubmitted && (
            <span className="ml-2">
              · <span className={cn(correctCount === totalBlanks ? "text-emerald-500" : "text-rose-500")}>
                {correctCount}/{totalBlanks} correct
              </span>
            </span>
          )}
        </span>
        {!isSubmitted && <span>{pct}%</span>}
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors",
            filledCount === totalBlanks ? "bg-purple-500" : "bg-slate-300"
          )}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface WordBankFillProps {
  question: WordBankFillType;
  isSubmitted: boolean;
  isCorrect?: boolean;
  wordSelections?: Record<string, string>;
  onSelectWord?: (questionId: string, blankId: string, word: string) => void;
  onSubmit?: (questionId: string) => void;
  onNext?: (questionId: string) => void;
  className?: string;
}

// Regex để parse passage: tìm {{blank_1}}, {{blank_2}}, ...
const BLANK_REGEX = /\{\{(blank_\w+)\}\}/g;

export default function WordBankFill({
  question,
  isSubmitted,
  isCorrect,
  wordSelections,
  onSelectWord,
  onSubmit,
  onNext,
  className,
}: WordBankFillProps) {
  // Lấy danh sách blank IDs từ passage
  const blankIds = React.useMemo(() => {
    const matches = [...question.passage.matchAll(BLANK_REGEX)];
    return [...new Set(matches.map(m => m[1]))];
  }, [question.passage]);

  const [localSelections, setLocalSelections] = useState<Record<string, string>>(
    wordSelections ?? {}
  );

  // Từ đã được chọn (trong word bank)
  const usedWords = Object.values(localSelections);

  const handleWordClick = useCallback((word: string) => {
    // Nếu từ đã được chọn → bỏ chọn (remove khỏi blank gần nhất)
    if (usedWords.includes(word)) {
      const newSelections = { ...localSelections };
      for (const blankId of blankIds) {
        if (newSelections[blankId] === word) {
          delete newSelections[blankId];
          break;
        }
      }
      setLocalSelections(newSelections);
      return;
    }

    // Nếu từ chưa được chọn → điền vào blank đầu tiên chưa có từ
    const firstEmptyBlank = blankIds.find(id => !localSelections[id]);
    if (firstEmptyBlank) {
      const newSelections = { ...localSelections, [firstEmptyBlank]: word };
      setLocalSelections(newSelections);
      onSelectWord?.(question.id, firstEmptyBlank, word);
    }
  }, [usedWords, localSelections, blankIds, question.id, onSelectWord]);

  const handleBlankClick = useCallback((blankId: string) => {
    if (isSubmitted) return;
    // Xóa từ trong blank này
    const newSelections = { ...localSelections };
    delete newSelections[blankId];
    setLocalSelections(newSelections);
  }, [isSubmitted, localSelections, blankIds]);

  const handleReset = () => {
    setLocalSelections({});
  };

  const handleSubmit = () => {
    onSubmit?.(question.id);
  };

  const handleNext = () => {
    onNext?.(question.id);
  };

  // Render passage với blank indicators
  const renderPassage = () => {
    const parts = question.passage.split(BLANK_REGEX);
    const matches = [...question.passage.matchAll(BLANK_REGEX)];
    const result: React.ReactNode[] = [];

    parts.forEach((part, partIdx) => {
      result.push(<span key={`part-${partIdx}`}>{part}</span>);

      if (partIdx < matches.length) {
        const blankId = matches[partIdx][1];
        const selectedWord = localSelections[blankId];
        const correctWord = question.correctMapping[blankId];

        let blankStyle = "";
        let statusIcon: React.ReactNode = null;

        if (isSubmitted) {
          const isBlankCorrect = selectedWord === correctWord;
          blankStyle = isBlankCorrect
            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
            : "border-rose-400 bg-rose-50 text-rose-700";
          statusIcon = isBlankCorrect
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            : <XCircle className="w-4 h-4 text-rose-500" />
        } else if (selectedWord) {
          blankStyle = "border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-300";
        } else {
          blankStyle = "border-dashed border-slate-400 bg-slate-50 text-slate-400";
        }

        result.push(
          <button
            key={`blank-${blankId}`}
            onClick={() => handleBlankClick(blankId)}
            disabled={isSubmitted}
            className={cn(
              "inline-block min-w-[90px] max-w-[160px] px-3 py-1.5 rounded-xl border-2 text-sm font-bold text-center transition-all align-middle",
              blankStyle,
              !isSubmitted ? "cursor-pointer hover:opacity-80" : "cursor-default"
            )}
            title={!isSubmitted && selectedWord ? "Click to remove" : undefined}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span className="truncate">{selectedWord ?? "_____"}</span>
              {statusIcon}
            </div>
          </button>
        );
      }
    });

    return result;
  };

  // Tính số đáp án đúng
  const correctCount = isSubmitted
    ? blankIds.filter(id => localSelections[id] === question.correctMapping[id]).length
    : 0;

  const allFilled = blankIds.every(id => localSelections[id]);

  return (
    <div className={cn("bg-white rounded-3xl p-6 border border-slate-200 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold border border-purple-200">
          WB
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Fill in the Blanks
          </h3>
          <p className="text-xs text-slate-400">
            Click a word below to fill a blank. Click a filled blank to remove.
          </p>
        </div>
        {!isSubmitted && Object.keys(localSelections).length > 0 && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Progress bar */}
      <BlanksStatus
        totalBlanks={blankIds.length}
        filledCount={Object.keys(localSelections).length}
        correctCount={correctCount}
        isSubmitted={isSubmitted}
      />

      {/* Passage */}
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl p-5 border border-slate-200 mb-6">
        <p className="text-slate-700 leading-loose text-base">
          {renderPassage()}
        </p>
      </div>

      {/* Word Bank */}
      <div className="mb-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Word Bank
        </p>
        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 min-h-[60px]">
          <AnimatePresence>
            {question.wordOptions.map((word) => {
              const isUsed = usedWords.includes(word);
              // Check correctness per word
              let isCorrect: boolean | undefined = undefined;
              if (isSubmitted) {
                const blanksUsingThisWord = blankIds.filter(
                  id => localSelections[id] === word
                );
                if (blanksUsingThisWord.length > 0) {
                  isCorrect = blanksUsingThisWord.some(
                    id => question.correctMapping[id] === word
                  );
                } else if (isUsed) {
                  isCorrect = false;
                }
              }

              return (
                <WordChip
                  key={word}
                  word={word}
                  isUsed={isUsed}
                  isCorrect={isCorrect}
                  isSubmitted={isSubmitted}
                  onClick={() => handleWordClick(word)}
                />
              );
            })}
          </AnimatePresence>
        </div>
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
            disabled={!allFilled}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
              allFilled
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
