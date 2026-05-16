import React from "react";
import { ArrowRight, BookCopy } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface FeaturedSmallCardProps {
  title: string;
  description: string;
  wordsCount: number;
  icon?: React.ReactNode;
  badgeText?: string;
  topBorderColorClass: string;
  bottomContent?: React.ReactNode;
  onClick?: () => void;
}

export default function FeaturedSmallCard({
  title,
  description,
  wordsCount,
  icon,
  badgeText,
  topBorderColorClass,
  bottomContent,
  onClick,
}: FeaturedSmallCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl bg-white p-6 shadow-md hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 border-t-4 group cursor-pointer relative overflow-hidden flex flex-col justify-between",
        topBorderColorClass
      )}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-slate-800 mb-1 group-hover:text-purple-600 transition-colors">
            {title}
          </h3>
          {badgeText ? (
            <span className="px-2.5 py-1 rounded-md bg-cyan-100 text-cyan-600 text-xs font-bold border border-cyan-200 uppercase tracking-wider">
              {badgeText}
            </span>
          ) : icon ? (
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              {icon}
            </div>
          ) : null}
        </div>
        <p className="text-sm text-slate-500 mb-4">{description}</p>
      </div>

      <div className="mt-auto flex justify-between items-center">
        {bottomContent ? (
          bottomContent
        ) : (
          <span className="text-sm text-slate-500 flex items-center gap-1 font-medium">
            <BookCopy className="w-4 h-4" /> {wordsCount} Words
          </span>
        )}
        <ArrowRight className="w-5 h-5 text-purple-600" />
      </div>
    </div>
  );
}
