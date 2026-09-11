/**
 * UC-13 Voice AI — Hook đọc thông số thiết bị + quota (FR-101 / CAP-02, OQ-05 hướng A).
 */
import { useEffect, useState } from 'react';
import type { DeviceSpec, StorageQuota } from '../types';
import { detectDeviceSpec, detectStorageQuota } from '../utils/deviceDetect';

export const useDeviceSpec = (): { deviceSpec: DeviceSpec; storageQuota: StorageQuota; detected: boolean } => {
  const [deviceSpec, setDeviceSpec] = useState<DeviceSpec>({
    availableRamGB: null,
    cpuCores: null,
    gpuVramGB: null,
  });
  const [storageQuota, setStorageQuota] = useState<StorageQuota>({ freeMB: null });
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setDeviceSpec(detectDeviceSpec());
      const quota = await detectStorageQuota();
      if (!cancelled) {
        setStorageQuota(quota);
        setDetected(true);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { deviceSpec, storageQuota, detected };
};
