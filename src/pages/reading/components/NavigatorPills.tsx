/**
 * Navigator pills: 1..N — trạng thái unanswered/active/correct/incorrect
 * Design: ux-spec.md §2.2, §6 (aria-label, aria-current), component-design.md §3
 */

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { PillStatus } from "../../../features/reading/types/reading";

export default function NavigatorPills({
  total,
  currentIndex,
  statuses,
  onSelect,
}: {
  total: number;
  currentIndex: number;
  statuses: PillStatus[];
  onSelect: (index: number) => void;
}) {
  const statusLabels: Record<PillStatus, string> = {
    unanswered: "chưa làm",
    correct: "đúng",
    incorrect: "sai",
  };

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar md:flex-wrap md:justify-center"
      role="group"
      aria-label="Điều hướng câu hỏi"
    >
      {Array.from({ length: total }, (_, i) => {
        const status = statuses[i];
        const isActive = i === currentIndex;
        let style =
          "border-slate-200 bg-white text-slate-600 hover:bg-purple-50 hover:border-purple-300";
        if (status === "correct") {
          style = "border-emerald-400 bg-emerald-50 text-emerald-600";
        } else if (status === "incorrect") {
          style = "border-rose-400 bg-rose-50 text-rose-600";
        }
        if (isActive) {
          style = "border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-200";
        }

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Câu ${i + 1} — ${statusLabels[status]}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "w-9 h-9 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center shrink-0 cursor-pointer",
              style,
            )}
          >
            {status !== "unanswered" && !isActive ? (
              status === "correct" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )
            ) : (
              i + 1
            )}
          </button>
        );
      })}
    </div>
  );
}
