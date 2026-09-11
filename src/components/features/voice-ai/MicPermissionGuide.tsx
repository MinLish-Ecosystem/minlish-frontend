/**
 * UC-13 Voice AI — Hướng dẫn cấp quyền mic (AF-05 / AC-10).
 * Inline guide khi người dùng từ chối quyền microphone — chặn ghi âm, không crash.
 */
import { MicOff } from 'lucide-react';

interface MicPermissionGuideProps {
  visible: boolean;
}

export function MicPermissionGuide({ visible }: MicPermissionGuideProps) {
  if (!visible) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800" role="alert">
      <MicOff className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="font-bold">Chưa cấp quyền micro</p>
        <p className="mt-0.5 leading-relaxed">
          Vui lòng cho phép truy cập micro trong trình duyệt để luyện nói. Mở biểu tượng khóa trên thanh địa chỉ →
          Microphone → Allow, rồi bấm mic để thử lại.
        </p>
      </div>
    </div>
  );
}
