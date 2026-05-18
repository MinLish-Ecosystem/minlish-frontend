import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";

export type WordStatus = "New" | "Learning" | "Mastered";

export interface WordCardProps {
  term: string;
  pronunciation: string;
  definition: string;
  status: WordStatus;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusStyles = {
  New: {
    border: "bg-cyan-500",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-500",
  },
  Learning: {
    border: "bg-amber-500",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-500",
  },
  Mastered: {
    border: "bg-emerald-500",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-500",
  },
  Review: {
    border: "bg-rose-500",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-500",
  },
};

export default function WordCard({
  term,
  pronunciation,
  definition,
  status,
  onEdit,
  onDelete,
}: WordCardProps) {
  const styles = statusStyles[status] || statusStyles.New;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden">
      {/* Top Border Indicator */}
      <div className={cn("absolute top-0 left-0 w-full h-1", styles.border)}></div>
      
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{term}</h3>
          <p className="text-sm text-slate-500 italic">{pronunciation}</p>
        </div>
        <span
          className={cn(
            "px-2 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider",
            styles.badgeBg,
            styles.badgeText
          )}
        >
          {status}
        </span>
      </div>
      
      <p className="text-base text-slate-700 mb-4">{definition}</p>
      
      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
          title="Edit Word"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
          title="Delete Word"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
