/**
 * UC-13 Voice AI — AI Avatar Rive (OQ-02 resolved, CAP-13).
 * Asset: public/models/talking-bear.riv — State Machine 1, inputs Talk/Hear/Look/Check/success/fail.
 * Map AvatarState → input: speaking→Talk, listening→Hear, thinking→Look.
 * Tự thích ứng kiểu input runtime: trigger thì fire khi vào state, boolean thì set true/false.
 * Load lỗi → rớt về emoji placeholder — chat + mic vẫn chạy (degrade an toàn).
 */
import { useEffect, useRef, useState } from 'react';
import { useRive } from '@rive-app/react-canvas';
import type { AvatarState } from './types';

const STATE_MACHINE = 'State Machine 1';
// Talking Bear (Rive marketplace, CC BY) — remix của Wave/Hear/Talk, inputs Talk/Hear/Look.
const RIV_SRC = `${import.meta.env.BASE_URL}models/talking-bear.riv`;

interface AiAvatarProps {
  avatarState: AvatarState;
  stateLabel: string;
  /** sm: header phiên; lg: sân khấu gấu bự giữa màn hình lúc tập nói. */
  size?: 'sm' | 'lg';
  /** Ẩn dòng label — sân khấu "mù chữ" mặc định không chữ. */
  hideLabel?: boolean;
}

const LABELS: Record<AvatarState, string> = {
  idle: 'Sẵn sàng',
  listening: 'Đang nghe…',
  thinking: 'Đang suy nghĩ…',
  speaking: 'Đang nói…',
  hidden: '',
};

const COLORS: Record<AvatarState, string> = {
  idle: 'bg-purple-100 text-purple-600',
  listening: 'bg-red-100 text-red-600',
  thinking: 'bg-amber-100 text-amber-600',
  speaking: 'bg-emerald-100 text-emerald-600',
  hidden: '',
};

/** Type code trong @rive-app/canvas: Number=56, Trigger=58, Boolean=59. */
const RIVE_TRIGGER = 58;

/** Kích input Rive lấy tươi từ instance (tránh object hook cũ sau remount). */
const fireFresh = (riveObj: unknown, name: string, active: boolean): void => {
  try {
    const r = riveObj as {
      stateMachineInputs?: (m: string) => Array<{ name?: unknown; type?: unknown; fire?: unknown; value?: unknown }>;
    };
    const inputs = r.stateMachineInputs?.(STATE_MACHINE) ?? [];
    const target = inputs.find((i) => i.name === name);
    if (!target) {
      console.error(`[UC-13] Rive: không thấy input ${name} trong ${STATE_MACHINE}`);
      return;
    }
    // Trigger(58) thì fire; Boolean(59)/Number(56) thì gán value.
    // LƯU Ý: fire() trên Boolean/Number là no-op im lặng (rive.d.ts) — đây từng là bug gấu đơ.
    if (target.type === RIVE_TRIGGER) {
      if (active && typeof target.fire === 'function') {
        (target.fire as () => void).call(target);
        console.log(`[UC-13] Rive fire → ${name}`);
      }
      return;
    }
    const asNumber = typeof target.value === 'number';
    (target as { value: boolean | number }).value = asNumber ? (active ? 1 : 0) : active;
    console.log(`[UC-13] Rive set ${name} = ${asNumber ? (active ? 1 : 0) : active}`);
  } catch (e) {
    console.error(`[UC-13] Rive input ${name} lỗi:`, e);
  }
};

export function AiAvatar({ avatarState, stateLabel, size = 'sm', hideLabel = false }: AiAvatarProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: RIV_SRC,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    onLoad: () => console.log('[UC-13] Rive avatar loaded:', RIV_SRC),
    onLoadError: () => {
      console.error('[UC-13] Rive avatar LOAD LỖI (sẽ hiện emoji tĩnh):', RIV_SRC);
      setLoadFailed(true);
    },
  });
  const prevStateRef = useRef<AvatarState>('idle');

  // Debug: in kiểu input thật trong file .riv (trigger hay boolean) — chỉ log 1 lần
  useEffect(() => {
    if (!rive) return;
    if (import.meta.env.DEV) {
      (window as unknown as { __minlishRive?: unknown }).__minlishRive = rive;
    }
    try {
      const names = rive.stateMachineNames;
      const inputs = rive.stateMachineInputs(STATE_MACHINE) ?? [];
      const kindName = (t: unknown): string =>
        t === 58 ? 'Trigger' : t === 59 ? 'Boolean' : t === 56 ? 'Number' : String(t);
      console.log(
        '[UC-13] Rive stateMachines:',
        names,
        '| inputs:',
        inputs.map((i) => {
          const rec = i as unknown as Record<string, unknown>;
          return `${String(rec.name)}:${kindName(rec.type)}`;
        }),
      );
    } catch (e) {
      console.error('[UC-13] Rive: không đọc được state machine inputs:', e);
    }
  }, [rive]);

  // Lượt AI nói → Talk, lượt user nói → Hear, LLM đang nghĩ → Look.
  // Chỉ kích khi MỚI vào state — refire liên tục sẽ restart animation, nhìn như đơ.
  useEffect(() => {
    if (!rive) return;
    try {
      const playing = (rive as unknown as { isPlaying?: boolean }).isPlaying;
      if (playing === false) {
        (rive as unknown as { play?: (m?: string) => void }).play?.(STATE_MACHINE);
        console.log('[UC-13] Rive state machine đang pause — play lại');
      }
    } catch {
      // bỏ qua
    }
    if (prevStateRef.current !== avatarState) {
      prevStateRef.current = avatarState;
      fireFresh(rive, 'Talk', avatarState === 'speaking');
      fireFresh(rive, 'Hear', avatarState === 'listening');
      fireFresh(rive, 'Look', avatarState === 'thinking');
    }
    console.log('[UC-13] Rive avatarState →', avatarState);
  }, [rive, avatarState]);

  if (avatarState === 'hidden') return null;
  const label = stateLabel || LABELS[avatarState];
  const circle =
    size === 'lg' ? 'w-64 h-64 md:w-80 md:h-80' : 'w-16 h-16';
  const emojiSize = size === 'lg' ? 'text-6xl' : 'text-2xl';
  return (
    <div
      className={`flex items-center gap-3 ${size === 'lg' ? 'flex-col' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className={`${circle} rounded-full overflow-hidden flex items-center justify-center shadow-inner ${
          avatarState === 'listening' ? 'animate-pulse' : ''
        } ${COLORS[avatarState]}`}
      >
        {loadFailed ? (
          /* Fallback emoji khi .riv load lỗi */
          <span className={emojiSize} aria-hidden="true">
            {avatarState === 'speaking' ? '🗣️' : avatarState === 'thinking' ? '💭' : avatarState === 'listening' ? '👂' : '🤖'}
          </span>
        ) : (
          <RiveComponent className="w-full h-full" />
        )}
      </div>
      {!hideLabel && <span className="text-xs font-semibold text-slate-500">{label}</span>}
    </div>
  );
}
