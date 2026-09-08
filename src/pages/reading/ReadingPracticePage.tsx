/**
 * Reading Practice (UC-14) — chọn level + bắt đầu phiên
 * Design: docs/frontend/uc-14-reading/ux-spec.md §2.1, ui-flow.md §1
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Play, Info, ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CefrLevel } from "../../features/reading/types/reading";

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function ReadingPracticePage() {
  const navigate = useNavigate();
  const [level, setLevel] = useState<CefrLevel | null>(null);

  const startSession = () => {
    // Truyền level qua navigate state — session page đọc (refresh = mất, mount như không filter — ux-spec §10)
    navigate("/practice/reading/session", { state: { level } });
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Page header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/practice")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-purple-700 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Practice
        </button>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-600" />
          Luyện đọc hiểu
        </h1>
        <p className="mt-2 text-slate-500">
          Hoàn thành các câu hỏi đọc hiểu với phản hồi ngay từng câu.
        </p>
      </div>

      {/* Level selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
          Chọn mức độ (tùy chọn)
        </h2>
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Chọn mức độ CEFR">
          <button
            onClick={() => setLevel(null)}
            aria-pressed={level === null}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer min-w-[44px] min-h-[44px]",
              level === null
                ? "border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-200"
                : "border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50",
            )}
          >
            Tất cả mức độ
          </button>
          {CEFR_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              aria-pressed={level === lvl}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer min-w-[44px] min-h-[44px]",
                level === lvl
                  ? "border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-200"
                  : "border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50",
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Info card — mô tả 3 dạng bài + luật */}
      <div className="mt-6 bg-purple-50/60 rounded-2xl border border-purple-100 p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
          <div className="space-y-3 text-sm text-slate-600">
            <p className="font-bold text-slate-700">Mỗi phiên gồm tối đa 15 câu, gồm 3 dạng:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-semibold">Sentence Completion</span> — câu ngắn có chỗ
                trống, chọn đáp án đúng
              </li>
              <li>
                <span className="font-semibold">Main Idea</span> — đọc đoạn văn và chọn ý chính
              </li>
              <li>
                <span className="font-semibold">Word Bank</span> — điền từ vào chỗ trống từ ngân
                hàng từ
              </li>
            </ul>
            <p className="text-slate-500">
              Phải nộp câu hiện tại trước khi sang câu tiếp. Tiến trình chưa lưu sẽ bị mất nếu
              bạn thoát giữa phiên.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8">
        <button
          onClick={startSession}
          className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full py-4 text-base font-extrabold shadow-lg shadow-purple-200 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          Bắt đầu phiên
        </button>
      </div>
    </div>
  );
}
