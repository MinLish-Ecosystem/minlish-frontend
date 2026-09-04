/**
 * UC-13 Voice AI — Hook quản lý active tier + switch flow (FR-103 / CAP-05, AF-01, BR-03).
 * activeTierId persist localStorage; đổi tier khi đã cache → modal xác nhận → purge toàn bộ → tải mới.
 */
import { useCallback, useMemo, useState } from 'react';
import type { DeviceSpec, StorageQuota, TierEligibility, VoiceAITierDto } from '../types';
import { getActiveTierId, getCachedTierId, setActiveTierId } from '../services/weightsCache';
import { checkTierEligibility, recommendHighestTier } from '../utils/eligibility';

interface TierManagerState {
  activeTierId: string | null;
  recommendedTierId: string | null;
  eligibilityOf: (tierId: string) => TierEligibility;
  isCached: (tierId: string) => boolean;
  selectTier: (tierId: string) => void;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
  switchConfirmVisible: boolean;
  pendingTierId: string | null;
  setActive: (tierId: string) => void;
}

interface PendingSwitch {
  fromTierId: string;
  toTierId: string;
}

export const useTierManager = (
  deviceSpec: DeviceSpec,
  storageQuota: StorageQuota,
  tiers: VoiceAITierDto[],
): TierManagerState => {
  const [activeTierId, setActiveTierIdState] = useState<string | null>(() => getActiveTierId());
  const [pending, setPending] = useState<PendingSwitch | null>(null);

  const recommended = useMemo(
    () => recommendHighestTier(tiers, deviceSpec, storageQuota),
    [tiers, deviceSpec, storageQuota],
  );

  // Chọn tier đầu tiên khi chưa có active: ưu tiên recommendation, fallback tier đầu eligible
  const resolveActive = useCallback((): string | null => {
    const stored = getActiveTierId();
    if (stored && tiers.some((t) => t._id === stored)) return stored;
    const fallback =
      recommended?._id ??
      tiers.find((t) => checkTierEligibility(t, deviceSpec, storageQuota) === 'eligible')?._id;
    return fallback ?? null;
  }, [tiers, recommended, deviceSpec, storageQuota]);

  const currentActive = activeTierId ?? resolveActive();
  if (currentActive && currentActive !== activeTierId) {
    setActiveTierId(currentActive);
    setActiveTierIdState(currentActive);
  }

  const eligibilityOf = useCallback(
    (tierId: string): TierEligibility => {
      const tier = tiers.find((t) => t._id === tierId);
      if (!tier) return 'blocked';
      return checkTierEligibility(tier, deviceSpec, storageQuota);
    },
    [tiers, deviceSpec, storageQuota],
  );

  const isCached = useCallback((tierId: string): boolean => getCachedTierId() === tierId, []);

  const setActive = useCallback((tierId: string) => {
    setActiveTierId(tierId);
    setActiveTierIdState(tierId);
  }, []);

  const selectTier = useCallback(
    (tierId: string) => {
      if (tierId === currentActive) return;
      if (eligibilityOf(tierId) !== 'eligible') return; // chặn cứng, không override (AF-03)
      const cachedId = getCachedTierId();
      // AF-01: đã có weights của tier khác → phải confirm trước khi purge
      if (cachedId && cachedId !== tierId) {
        setPending({ fromTierId: cachedId, toTierId: tierId });
        return;
      }
      setActive(tierId);
    },
    [currentActive, eligibilityOf, setActive],
  );

  const confirmSwitch = useCallback(() => {
    if (!pending) return;
    setActive(pending.toTierId);
    setPending(null);
  }, [pending, setActive]);

  const cancelSwitch = useCallback(() => setPending(null), []);

  return {
    activeTierId: currentActive,
    recommendedTierId: recommended?._id ?? null,
    eligibilityOf,
    isCached,
    selectTier,
    confirmSwitch,
    cancelSwitch,
    switchConfirmVisible: pending != null,
    pendingTierId: pending?.toTierId ?? null,
    setActive,
  };
};
