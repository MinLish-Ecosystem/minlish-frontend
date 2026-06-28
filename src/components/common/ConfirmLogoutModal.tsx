import React from "react";
import { LogOut, X } from "lucide-react";

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmLogoutModal({ isOpen, onClose, onConfirm }: ConfirmLogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600">
            <LogOut className="w-5 h-5 shrink-0" />
            <h4 className="font-extrabold text-base">Xác nhận đăng xuất</h4>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <p className="text-slate-500 text-xs leading-relaxed">
          Bạn có chắc chắn muốn đăng xuất khỏi hệ thống? Mọi phiên làm việc chưa hoàn thành có thể bị gián đoạn.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-all"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
