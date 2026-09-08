/**
 * Dạng 3: word-bank-fill — passage có blank buttons + word chips
 * Design: ux-spec.md §4.2 ({{blank_N}} markers), component-design.md §3
 * OQ-2 đã đóng: feedback hiển thị CẢ HAI — từng blank đúng/sai + mapping đúng
 */

import React from "react";
import { cn } from "../../../lib/utils";
import type { WordBankFillQuestion } from "../../../features/reading/types/reading";

export default function WordBankFill({
  question,
  filledBlanks,
  focusedBlank,
  submitted,
  isCorrect,
  onSelectWord,
  onRemoveWord,
  onFocusBlank,
}: {
  question: WordBankFillQuestion;
  filledBlanks: Record<string, string> | null;
  focusedBlank: string | null;
  submitted: boolean;
  isCorrect?: boolean;
  onSelectWord(blankId: string, word: string): void;
  onRemoveWord(blankId: string): void;
  onFocusBlank(blankId: string | null): void;
}) {
  const blanks = Object.keys(question.correctMapping);
  // Marker {{blank_N}} liên tiếp từ blank_1 (D-4)
  const parts = question.passage.split(/(\{\{blank_\d+\}\})/g);

  const handleWordClick = (word: string) => {
    if (submitted) return;
    // Từ được dùng nhiều nơi — click điền vào blank đang focus, hoặc blank trống đầu tiên
    const target =
      focusedBlank ??
      blanks.find((b) => !filledBlanks?.[b]) ??
      null;
    if (!target) return;
    onSelectWord(target, word);
  };

  const renderBlank = (blankId: string) => {
    const word = filledBlanks?.[blankId];
    const isFilled = word != null;
    // Sau submit: đánh dấu TỪNG blank đúng/sai (OQ-2)
    const blankCorrect =
      submitted && word === question.correctMapping[blankId];

    let style =
      "border-dashed border-slate-400 bg-slate-50 text-slate-400 hover:border-purple-400";
    if (submitted) {
      style = blankCorrect
        ? "border-solid border-emerald-400 bg-emerald-50 text-emerald-700"
        : "border-solid border-rose-400 bg-rose-50 text-rose-700";
    } else if (focusedBlank === blankId) {
      style = "border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-200";
    } else if (isFilled) {
      style = "border-solid border-purple-400 bg-purple-50 text-purple-700";
    }

    return (
      <button
        key={blankId}
        type="button"
        role="button"
        aria-label={`Chỗ trống ${blankId.replace("blank_", "")}${word ? `: ${word}` : ""}`}
        disabled={submitted}
        onClick={() => {
          if (submitted) return;
          if (isFilled) {
            onRemoveWord(blankId);
          } else {
            onFocusBlank(blankId);
          }
        }}
        className={cn(
          "inline-block min-w-[90px] px-3 py-1 rounded-lg border-2 text-center font-bold text-sm align-middle transition-all cursor-pointer disabled:cursor-default",
          style,
        )}
      >
        {word ?? "____"}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Passage với blank slots */}
      <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
        <p className="text-base leading-loose text-slate-700">
          {parts.map((part, i) => {
            const match = part.match(/^\{\{(blank_\d+)\}\}$/);
            if (match) {
              return (
                <React.Fragment key={i}>
                  {renderBlank(match[1])}
                </React.Fragment>
              );
            }
            return <React.Fragment key={i}>{part}</React.Fragment>;
          })}
        </p>
      </div>

      {/* Hint focus */}
      {!submitted && (
        <p className="mt-3 text-xs text-slate-400" aria-live="polite">
          {focusedBlank
            ? `Đang điền vào chỗ trống ${focusedBlank.replace("blank_", "")} — chọn từ bên dưới`
            : "Bấm vào chỗ trống để chọn vị trí, rồi bấm từ bên dưới để điền. Bấm từ đã điền để gỡ."}
        </p>
      )}

      {/* Word bank */}
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Word bank
        </p>
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Ngân hàng từ">
          {question.wordOptions.map((word) => {
            // Một từ có thể dùng cho nhiều blank (D-4) — chip không disable khi đã dùng
            const usedSomewhere = Object.values(filledBlanks ?? {}).includes(word);
            return (
              <button
                key={word}
                type="button"
                disabled={submitted}
                onClick={() => handleWordClick(word)}
                className={cn(
                  "px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all cursor-pointer disabled:cursor-default min-h-[44px]",
                  submitted
                    ? "border-slate-200 bg-slate-50 text-slate-400"
                    : usedSomewhere
                      ? "border-slate-300 bg-slate-100 text-slate-600 hover:border-purple-400"
                      : "border-slate-300 bg-white text-slate-700 hover:border-purple-400 hover:bg-purple-50",
                )}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mapping đúng sau submit — OQ-2: hiển thị đầy đủ (AC-06) */}
      {submitted && !isCorrect && (
        <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
            Đáp án đúng
          </p>
          <div className="flex flex-wrap gap-2">
            {blanks.map((blankId) => (
              <span
                key={blankId}
                className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-xs font-semibold text-slate-700"
              >
                {blankId.replace("blank_", "")}:{" "}
                <span className="text-blue-700">{question.correctMapping[blankId]}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
