/**
 * UC-13 Voice AI — Device hint banner (CAP-03, ux-spec Journey 1).
 * Hiển thị "Máy bạn phù hợp tối đa: {tier}" theo khuyến nghị BR-06.
 */
import { Lightbulb } from 'lucide-react';

interface DeviceHintBannerProps {
  recommendedTierName: string | null;
}

export function DeviceHintBanner({ recommendedTierName }: DeviceHintBannerProps) {
  if (!recommendedTierName) return null;
  return (
    <div
      role="status"
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-100 text-sm text-purple-700"
    >
      <Lightbulb className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>
        Máy bạn phù hợp tối đa: <strong>{recommendedTierName}</strong>
      </span>
    </div>
  );
}
