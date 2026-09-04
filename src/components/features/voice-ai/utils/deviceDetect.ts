/**
 * UC-13 Voice AI — Device detection probe (FR-101 / CAP-02).
 * Đọc RAM khả dụng, CPU cores, GPU/VRAM. Mọi API đều optional — browser chặn thì trả null, không crash.
 */
import type { DeviceSpec, StorageQuota } from '../types';

// navigator.deviceMemory chỉ có trên Chrome — expose GB dưới dạng lũy thừa 2
const getAvailableRamGB = (): number | null => {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0) {
    return nav.deviceMemory;
  }
  return null;
};

// VRAM qua WebGL debug renderer info — chỉ detect được tên GPU, không đọc được exact VRAM
// nên ước lượng theo tên GPU phổ biến (best effort, khớp deviceDetect trong component-design).
// Export để gpuPolicy dùng lại khi quyết định backend LLM (GPU vs CPU).
// NOTE: Web không cho đọc VRAM TRỐNG real-time — chỉ ước tổng VRAM rồi so với
// công thức need = sizeMB×1.5 + 512MB headroom (xem gpuPolicy.ts).
export const probeGpuVramGB = (): number | null => {
  const renderer = getWebGlRendererString()?.toLowerCase() ?? '';
  if (!renderer) return null;
  // Ước lượng VRAM theo dòng GPU phổ biến — chỉ dùng để gợi ý tier, không phải exact
  const vramTable: Array<[RegExp, number]> = [
    [/rtx\s*4090|rtx\s*5090|h100|m\d+\s*ultra/, 16],
    [/rtx\s*4080|rtx\s*4070\s*ti|rx\s*7900/, 12],
    [/rtx\s*4070|rtx\s*3080|rx\s*6800/, 8],
    [/rtx\s*4060|rtx\s*3070|rx\s*6700/, 8],
    [/rtx\s*3060|rtx\s*3050|mx\s*5\d0/, 6],
    [/arc\s*a770/, 16],
    [/arc\s*a(580|750)/, 8],
    [/arc\s*a3\d0/, 6],
    [/iris\s*xe|uhd graphics|vega\s*[3-8]/, 2],
    [/intel\(r\)\s*(uhd|iris|graphics)/, 2], // iGPU gen mới (Raptor/Alder Lake-P)
    [/radeon\s*(610m|660m|680m|780m)|amd radeon\(tm\) graphics/, 2], // AMD iGPU
    [/apple\s*m[1-4]/, 8],
  ];
  for (const [pattern, vram] of vramTable) {
    if (pattern.test(renderer)) return vram;
  }
  return null;
};

/** Chuỗi renderer WebGL thô — log để mở rộng bảng VRAM khi gặp GPU lạ. */
export const getWebGlRendererString = (): string | null => {
  try {
    const canvas = document.createElement('canvas');
    // Xin context card rời (máy Optimus hay trả iGPU mặc định nếu không xin)
    const gl =
      canvas.getContext('webgl2', { powerPreference: 'high-performance' }) ??
      canvas.getContext('webgl', { powerPreference: 'high-performance' } as WebGLContextAttributes);
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return null;
    return (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string | null) ?? null;
  } catch {
    return null;
  }
};

/**
 * Ước VRAM từ WebGPU adapter info (dự phòng khi WebGL không nhận ra tên card).
 * Card onboard (Intel gen mới, UHD, Iris, AMD iGPU) xài chung RAM → lấy nửa RAM máy.
 */
export const estimateVramFromWebGpu = (vendor: string, arch: string): number | null => {
  const v = vendor.toLowerCase();
  const a = arch.toLowerCase();
  const ram = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const shared = ram && ram > 0 ? Math.max(2, Math.floor(ram / 2)) : 2;
  if (/apple/.test(v)) return 8;
  if (/intel/.test(v)) {
    if (/arc/.test(a)) return 8; // Arc rời — không đọc exact được
    return shared; // UHD/Iris/gen-* onboard
  }
  if (/amd/.test(v)) return /gfx1[01]|phoenix|strix|rembrandt|raphael/i.test(a) ? shared : 8;
  if (/nvidia/.test(v)) return 6;
  if (/qualcomm/.test(v)) return shared;
  return null;
};

// Pre-flight quota check (OQ-05 hướng A): estimate() đọc usage/quota của Cache Storage
const getStorageQuota = async (): Promise<StorageQuota> => {
  try {
    if (!navigator.storage?.estimate) return { freeMB: null };
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { freeMB: Math.floor((quota - usage) / 1048576) };
  } catch {
    return { freeMB: null };
  }
};

export const detectDeviceSpec = (): DeviceSpec => ({
  availableRamGB: getAvailableRamGB(),
  cpuCores: navigator.hardwareConcurrency ?? null,
  gpuVramGB: probeGpuVramGB(),
});

export const detectStorageQuota = getStorageQuota;

// Yêu cầu browser giữ storage — tránh bị evict giữa chừng khi weights đang cache (OQ-05)
export const requestPersistentStorage = async (): Promise<boolean> => {
  try {
    if (!navigator.storage?.persist) return false;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
};

export interface WebGpuInfo {
  supported: boolean;
  vendor: string;
  architecture: string;
}

// WebGPU có bật không + là GPU gì — để gpuPolicy quyết định offload LLM lên GPU.
// Xin powerPreference high-performance để máy 2 card (Optimus) trả card rời
// (mặc định browser trả iGPU tiết kiệm điện). Không hiện prompt, chạy ở localhost/https.
export const detectWebGpuSupport = async (): Promise<WebGpuInfo> => {
  const none = { supported: false, vendor: '', architecture: '' };
  try {
    const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return none;
    const info = adapter.info;
    return {
      supported: true,
      vendor: info.vendor || '',
      architecture: info.architecture || info.device || '',
    };
  } catch {
    return none;
  }
};
