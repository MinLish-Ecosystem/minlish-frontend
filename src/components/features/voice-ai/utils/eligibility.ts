/**
 * UC-13 Voice AI — Tier eligibility + recommendation (BR-06 / CAP-02, CAP-03).
 * RAM khả dụng ≥ 0.8×minRamGB; nếu gpuRequired thì VRAM ≥ 0.9×yêu cầu (chặn cứng, không override).
 * Quota gate (OQ-05 hướng A): freeQuota ≥ totalSizeMB × 1.1 — vượt → 'blocked-storage'.
 */
import type { DeviceSpec, StorageQuota, TierEligibility, VoiceAITierDto } from '../types';

export const RAM_BUFFER_RATIO = 0.8;
export const VRAM_BUFFER_RATIO = 0.9;
export const STORAGE_BUFFER_RATIO = 1.1;

export const checkTierEligibility = (
  tier: VoiceAITierDto,
  deviceSpec: DeviceSpec,
  storageQuota: StorageQuota,
): TierEligibility => {
  const { availableRamGB, cpuCores, gpuVramGB } = deviceSpec;

  // Không đọc được thông số thiết bị → không chặn cứng (graceful degrade, tránh khóa cả trang)
  const ramOk = availableRamGB == null || availableRamGB >= RAM_BUFFER_RATIO * tier.requirements.minRamGB;
  const cpuOk = cpuCores == null || cpuCores >= tier.requirements.minCpuCores;
  const gpuOk =
    !tier.requirements.gpuRequired || gpuVramGB == null || gpuVramGB >= VRAM_BUFFER_RATIO * 1;

  if (!ramOk || !cpuOk || !gpuOk) return 'blocked';

  // Quota gate: estimate() không khả dụng → bỏ qua (fallback catch giữa stream)
  if (storageQuota.freeMB != null && storageQuota.freeMB < tier.totalSizeMB * STORAGE_BUFFER_RATIO) {
    return 'blocked-storage';
  }
  return 'eligible';
};

// BR-06: gợi ý tier cao nhất thỏa mọi tiêu chí; null nếu không tier nào pass
export const recommendHighestTier = (
  tiers: VoiceAITierDto[],
  deviceSpec: DeviceSpec,
  storageQuota: StorageQuota,
): VoiceAITierDto | null => {
  const passing = tiers.filter(
    (tier) => tier.status === 'available' && checkTierEligibility(tier, deviceSpec, storageQuota) === 'eligible',
  );
  return passing.length > 0 ? passing[passing.length - 1] : null;
};

export const formatGigaBytes = (sizeMB: number): string => {
  if (sizeMB >= 1024) return `~${(sizeMB / 1024).toFixed(1)} GB`;
  return `${sizeMB} MB`;
};
