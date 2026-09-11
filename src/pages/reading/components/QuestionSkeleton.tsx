/**
 * QuestionSkeleton — skeleton loading khớp layout câu hỏi (ux-spec §9)
 */

import React from "react";

export default function QuestionSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-5 w-40 bg-slate-200 rounded-lg" />
      <div className="mt-3 h-2 w-full bg-slate-100 rounded-full" />
      <div className="mt-8 flex justify-center gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-9 h-9 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-11/12 bg-slate-100 rounded" />
        <div className="h-4 w-4/5 bg-slate-100 rounded" />
        <div className="h-5 w-2/3 bg-slate-200 rounded mt-6" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-12 w-full bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
