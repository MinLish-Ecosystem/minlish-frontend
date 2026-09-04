/**
 * UC-13 Voice AI — Chọn backend chạy LLM: GPU (WebGPU offload) hay CPU (RAM/WASM).
 * Quy tắc: có WebGPU VÀ VRAM ước lượng đủ chỗ cho weights + context mới dùng GPU,
 * còn lại chạy CPU — tránh OOM giữa phiên trên máy yếu.
 */
import { detectWebGpuSupport, estimateVramFromWebGpu, getWebGlRendererString, probeGpuVramGB } from '../utils/deviceDetect';

export type LlmBackend = 'gpu' | 'cpu';

export interface BackendDecision {
  backend: LlmBackend;
  /** Lý do ngắn để log: no-webgpu | vram-ok | vram-low | unknown-vram-try-gpu | webgpu-crash-retry */
  reason: 'no-webgpu' | 'vram-ok' | 'vram-low' | 'unknown-vram-try-gpu' | 'webgpu-crash-retry';
  vramGB: number | null;
  /** Dung lượng ước tính cần để chạy model (weights × 1.5 + headroom context). */
  needMB: number;
  gpuLabel: string;
}

export const decideLlmBackend = async (llmSizeMB: number): Promise<BackendDecision> => {
  const needMB = Math.ceil(llmSizeMB * 1.5 + 512);
  const gpu = await detectWebGpuSupport();
  const gpuLabel = [gpu.vendor, gpu.architecture].filter(Boolean).join(' ').trim() || 'unknown-gpu';
  if (!gpu.supported) {
    return { backend: 'cpu', reason: 'no-webgpu', vramGB: null, needMB, gpuLabel };
  }
  // Web không cho đọc VRAM trống real-time — ước tổng VRAM qua WebGL, rớt xuống
  // ước từ WebGPU adapter info (onboard lấy nửa RAM máy) nếu tên card lạ.
  const vramGB = probeGpuVramGB() ?? estimateVramFromWebGpu(gpu.vendor, gpu.architecture);
  console.log('[UC-13] GPU detect — renderer:', getWebGlRendererString(), '| VRAM ước:', vramGB);
  if (vramGB == null) {
    // Không ước được VRAM → giữ hành vi cũ: thử GPU, wllama tự fallback nếu lỗi
    return { backend: 'gpu', reason: 'unknown-vram-try-gpu', vramGB, needMB, gpuLabel };
  }
  if (vramGB * 1024 >= needMB) {
    return { backend: 'gpu', reason: 'vram-ok', vramGB, needMB, gpuLabel };
  }
  return { backend: 'cpu', reason: 'vram-low', vramGB, needMB, gpuLabel };
};
