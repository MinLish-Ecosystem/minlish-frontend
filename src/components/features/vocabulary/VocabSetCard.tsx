import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Book } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface VocabSetCardProps {
  id: string;
  name: string;
  wordsCount: number;
  category: string;
  level: string;
  mastery: number;
  colorTheme?: "blue" | "emerald" | "amber" | "purple" | "rose" | "cyan";
  onClick?: () => void;
  onEditSet?: () => void;
  onDeleteSet?: () => void;
  onExportCSV?: () => void;
}

const themeStyles = {
  blue: {
    border: "border-blue-500",
    text: "text-blue-500",
    bg: "bg-blue-500",
    lightBg: "bg-blue-50",
    lightBorder: "border-blue-200",
  },
  emerald: {
    border: "border-emerald-500",
    text: "text-emerald-500",
    bg: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    lightBorder: "border-emerald-200",
  },
  amber: {
    border: "border-amber-500",
    text: "text-amber-500",
    bg: "bg-amber-500",
    lightBg: "bg-amber-50",
    lightBorder: "border-amber-200",
  },
  purple: {
    border: "border-purple-500",
    text: "text-purple-500",
    bg: "bg-purple-500",
    lightBg: "bg-purple-50",
    lightBorder: "border-purple-200",
  },
  rose: {
    border: "border-rose-500",
    text: "text-rose-500",
    bg: "bg-rose-500",
    lightBg: "bg-rose-50",
    lightBorder: "border-rose-200",
  },
  cyan: {
    border: "border-cyan-500",
    text: "text-cyan-500",
    bg: "bg-cyan-500",
    lightBg: "bg-cyan-50",
    lightBorder: "border-cyan-200",
  },
};

export default function VocabSetCard({
  name,
  wordsCount,
  category,
  level,
  mastery,
  colorTheme = "blue",
  onClick,
  onEditSet,
  onDeleteSet,
  onExportCSV,
}: VocabSetCardProps) {
  const styles = themeStyles[colorTheme] || themeStyles.blue;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 border-t-4 group cursor-pointer relative overflow-hidden",
        styles.border
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
        <button
          className="text-slate-400 hover:text-purple-600 relative z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((s) => !s);
          }}
          aria-haspopup="true"
          aria-expanded={showMenu}
          title="Options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {showMenu && (
          <div
            className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-md py-2 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer"
              onClick={() => { setShowMenu(false); onEditSet && onEditSet(); }}
            >
              Edit
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer"
              onClick={() => { setShowMenu(false); onExportCSV && onExportCSV(); }}
            >
              Export CSV
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 cursor-pointer"
              onClick={() => { setShowMenu(false); onDeleteSet && onDeleteSet(); }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="pr-6">
          <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-purple-600 transition-colors line-clamp-1">
            {name}
          </h3>
          <p className="text-sm text-slate-500 flex items-center gap-1 font-medium">
            <Book className="w-4 h-4" />
            {wordsCount} Words
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <span
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-bold border",
            styles.lightBg,
            styles.text,
            styles.lightBorder
          )}
        >
          {category}
        </span>
        <span className="px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200">
          {level}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-xs font-bold mb-2">
          <span className="text-slate-500">Mastery Progress</span>
          <span className={styles.text}>{mastery}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full relative transition-all duration-1000", styles.bg)}
            style={{ width: `${mastery}%` }}
          >
            {/* Glossy effect for progress bar */}
            <div className="absolute inset-0 bg-white/20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
