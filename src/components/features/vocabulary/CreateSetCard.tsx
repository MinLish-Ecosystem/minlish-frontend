import React from "react";
import { Plus } from "lucide-react";

interface CreateSetCardProps {
  onClick?: () => void;
}

export default function CreateSetCard({ onClick }: CreateSetCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-50 rounded-xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] group"
    >
      <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
        <Plus className="text-purple-600 w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">Create Custom Set</h3>
      <p className="text-sm text-slate-500">Add your own vocabulary lists</p>
    </div>
  );
}
