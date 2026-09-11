/**
 * UC-13 Voice AI — Tier selector dropdown (CAP-01, ux-spec §5.2).
 * Hiển thị 5 tier + dung lượng + badge trạng thái (đã tải / chưa tải / máy yếu / thiếu bộ nhớ).
 */
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Cpu } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { TierEligibility, VoiceAITierDto } from './types';
import { formatGigaBytes } from './utils/eligibility';

interface TierSelectorProps {
  tiers: VoiceAITierDto[];
  activeTierId: string | null;
  cachedTierIds: string[];
  eligibilityOf: (id: string) => TierEligibility;
  onSelect: (id: string) => void;
}

const badgeFor = (tier: VoiceAITierDto, cached: boolean, eligibility: TierEligibility): string => {
  if (tier.status !== 'available') return 'Đang cập nhật';
  if (eligibility === 'blocked') return 'Máy không đủ cấu hình';
  if (eligibility === 'blocked-storage') return `Bộ nhớ không đủ (~${formatGigaBytes(tier.totalSizeMB)} cần thiết)`;
  if (cached) return `Đã tải · ${formatGigaBytes(tier.totalSizeMB)}`;
  return 'Chưa tải';
};

export function TierSelector({ tiers, activeTierId, cachedTierIds, eligibilityOf, onSelect }: TierSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = tiers.find((t) => t._id === activeTierId);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all text-sm font-semibold cursor-pointer"
      >
        <Cpu className="w-4 h-4" aria-hidden="true" />
        <span>Tier: {selected?.name ?? '—'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chọn mức cấu hình model</p>
            </div>
            {tiers.map((tier) => {
              const eligibility = eligibilityOf(tier._id);
              const disabled = tier.status !== 'available' || eligibility !== 'eligible';
              const cached = cachedTierIds.includes(tier._id);
              return (
                <button
                  key={tier._id}
                  type="button"
                  role="option"
                  aria-selected={tier._id === activeTierId}
                  disabled={disabled}
                  onClick={() => {
                    onSelect(tier._id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                    tier._id === activeTierId ? 'bg-purple-50' : ''
                  } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-bold ${tier._id === activeTierId ? 'text-purple-700' : 'text-slate-800'}`}>
                        {tier.name}
                        <span className="ml-2 text-xs font-normal text-slate-400">{formatGigaBytes(tier.totalSizeMB)}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        RAM ≥ {tier.requirements.minRamGB}GB
                        {tier.requirements.gpuRequired ? ' · Cần GPU' : ''}
                      </p>
                    </div>
                    {tier._id === activeTierId && <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" aria-hidden="true" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{badgeFor(tier, cached, eligibility)}</p>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
