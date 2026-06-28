import React, { useState } from "react";
import { X, Send, AlertTriangle, Bug, ShieldAlert, MessageSquare, HelpCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../lib/api";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [category, setCategory] = useState<"bug" | "content" | "abuse" | "suggestion" | "other">("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Vui lòng điền đầy đủ tiêu đề và nội dung.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/v1/reports", {
        category,
        subject: subject.trim(),
        message: message.trim()
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Đã gửi báo cáo thành công! Cảm ơn bạn.");
        setSubject("");
        setMessage("");
        onClose();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Không thể gửi báo cáo lúc này.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "bug": return <Bug className="w-4 h-4 text-rose-500" />;
      case "content": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "abuse": return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case "suggestion": return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      default: return <HelpCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4648d4] to-[#6900b3] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-lg">Báo cáo & Góp ý</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Nếu bạn phát hiện lỗi hệ thống, sai sót dữ liệu, vi phạm cộng đồng hoặc có góp ý để cải tiến ứng dụng, hãy gửi phản hồi ngay cho chúng tôi.
          </p>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phân loại</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: "bug", label: "Lỗi hệ thống" },
                { key: "content", label: "Sai nội dung" },
                { key: "abuse", label: "Báo cáo vi phạm" },
                { key: "suggestion", label: "Góp ý phát triển" },
                { key: "other", label: "Khác" }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCategory(item.key as any)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    category === item.key
                      ? "border-[#4648d4] bg-indigo-50/50 text-[#4648d4] ring-2 ring-indigo-100"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {getCategoryIcon(item.key)}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label htmlFor="report-subject" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiêu đề</label>
            <input
              id="report-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Nhập tiêu đề ngắn gọn (vd: Lỗi không phát được âm thanh...)"
              maxLength={100}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#4648d4] focus:ring-4 focus:ring-purple-100 rounded-xl text-sm outline-none transition-all"
            />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label htmlFor="report-message" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung chi tiết</label>
            <textarea
              id="report-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết lỗi hoặc góp ý của bạn tại đây để Admin xử lý nhanh nhất..."
              rows={4}
              maxLength={1500}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#4648d4] focus:ring-4 focus:ring-purple-100 rounded-xl text-sm outline-none transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#4648d4] hover:bg-[#4648d4]/90 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
