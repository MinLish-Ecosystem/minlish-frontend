import React from "react";
import { Plus, BookCopy, Check } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface TrendingSetCardProps {
  title: string;
  description: string;
  tags: string[];
  termsCount: number;
  topBorderColorClass: string;
  isAdded?: boolean;
  onClick?: () => void;
  onAdd?: (e: React.MouseEvent) => void;
}

export default function TrendingSetCard({
  title,
  description,
  tags,
  termsCount,
  topBorderColorClass,
  isAdded = false,
  onClick,
  onAdd,
}: TrendingSetCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "min-w-[280px] w-[280px] bg-white rounded-xl p-6 shadow-md hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 border-t-4 group cursor-pointer relative overflow-hidden flex flex-col snap-start",
        topBorderColorClass
      )}
    >
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 mb-6 line-clamp-2">
          {description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag, idx) => (
            <span 
              key={idx} 
              className="px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
        <span className="text-sm text-slate-500 flex items-center gap-1 font-medium">
          <BookCopy className="w-4 h-4" /> {termsCount} Terms
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (isAdded) return;
            if (onAdd) onAdd(e);
          }}
          disabled={isAdded}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            isAdded 
              ? "text-emerald-500 bg-emerald-50 cursor-default" 
              : "text-purple-600 hover:bg-purple-50"
          )}
          title={isAdded ? "Already in Library" : "Add to My Library"}
        >
          {isAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
