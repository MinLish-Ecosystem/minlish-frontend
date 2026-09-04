/**
 * UC-13 Voice AI — Weights cache wrapper (FR-102 / CAP-04).
 * Lưu weights multi-GB vào Cache Storage, metadata vào localStorage.
 * Pre-flight quota check theo OQ-05 hướng A: persist() trước stream; catch QuotaExceededError giữa chừng.
 */
import api from '../../../../lib/api';
import type { ComponentDownload, DownloadProgress, VoiceAITierDto } from '../types';

const ACTIVE_TIER_KEY = 'minlish_voice_active_tier';
const CACHE_PREFIX = 'voice-ai-weights';
const META_KEY = 'minlish_voice_cached_meta';

interface CachedMeta {
  tierId: string;
  components: { stt: string; llm: string; tts: string };
}

export const getActiveTierId = (): string | null => localStorage.getItem(ACTIVE_TIER_KEY);

export const setActiveTierId = (tierId: string): void => {
  localStorage.setItem(ACTIVE_TIER_KEY, tierId);
};

const readMeta = (): CachedMeta | null => {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as CachedMeta) : null;
  } catch {
    return null;
  }
};

const writeMeta = (meta: CachedMeta | null): void => {
  if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
  else localStorage.removeItem(META_KEY);
};

const cacheNameFor = (tierId: string): string => `${CACHE_PREFIX}-${tierId}`;

export const isTierCached = (tierId: string): boolean => {
  const meta = readMeta();
  return meta?.tierId === tierId;
};

export const getCachedTierId = (): string | null => readMeta()?.tierId ?? null;

/**
 * Kiểm tra blob LLM thật sự còn trong Cache Storage.
 * Metadata localStorage có thể còn trong khi browser đã evict blob nặng
 * (tier high ~1GB) — trường hợp này trước đây bỏ qua tải lại nên LLM
 * fallback im lặng. Trả false để caller tải lại.
 * FIX 2: check cả magic GGUF (4 byte đầu), vì blob cũ hỏng (tải lúc link
 * lỗi/timeout) vẫn đủ size nhưng không phải GGUF.
 */
const isGgufBlob = async (blob: Blob): Promise<boolean> => {
  try {
    return (await blob.slice(0, 4).text()) === 'GGUF';
  } catch {
    return false;
  }
};

export const verifyLlmBlob = async (tierId: string): Promise<boolean> => {
  try {
    const direct = await readComponent(tierId, 'llm', 'model.gguf');
    if (direct && direct.size > 1024 && (await isGgufBlob(direct))) return true;
    const cache = await caches.open(cacheNameFor(tierId));
    for (const req of await cache.keys()) {
      if (req.url.includes('/llm/') && req.url.endsWith('.gguf')) {
        const res = await cache.match(req);
        const blob = await res?.blob();
        if (blob && blob.size > 1024 && (await isGgufBlob(blob))) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
};

// BR-03: purge toàn bộ weights mọi tier khác — chỉ giữ 1 tier active tại một thời điểm
export const purgeAllWeights = async (): Promise<void> => {
  try {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith(CACHE_PREFIX)).map((n) => caches.delete(n)));
  } catch {
    // Cache Storage không khả dụng — metadata vẫn phải xoá để state nhất quán
  }
  writeMeta(null);
};

const urlForComponent = (tierId: string, component: string, fileName: string): string =>
  `/voice-ai-weights/${tierId}/${component}/${fileName}`;

export const storeComponent = async (tierId: string, component: string, fileName: string, blob: Blob): Promise<void> => {
  const cache = await caches.open(cacheNameFor(tierId));
  await cache.put(urlForComponent(tierId, component, fileName), new Response(blob));
};

export const readComponent = async (tierId: string, component: string, fileName: string): Promise<Blob | null> => {
  try {
    const cache = await caches.open(cacheNameFor(tierId));
    const response = await cache.match(urlForComponent(tierId, component, fileName));
    return response ? await response.blob() : null;
  } catch {
    return null;
  }
};

// Stream 1 component weights với progress; lỗi giữa chừng → throw để hook catch (AF-04)
// URL là proxy BE (/api/v1/voice-ai/model/file — Mega chặn CORS) → prefix baseURL + gắn Bearer token.
const streamComponent = async (
  url: string,
  sizeMB: number,
  onProgress: (percent: number) => void,
): Promise<Blob> => {
  const absoluteUrl = url.startsWith('http') ? url : `${api.defaults.baseURL}${url}`;
  const token = localStorage.getItem('minlish_token');
  const response = await fetch(absoluteUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const totalBytes = sizeMB * 1048576;
  const reader = response.body?.getReader();
  if (!reader) {
    return await response.blob();
  }
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  let lastEmit = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    // Throttle ~250ms tránh render storm (component-design §9)
    const now = Date.now();
    if (now - lastEmit > 250) {
      lastEmit = now;
      onProgress(totalBytes > 0 ? Math.min(100, Math.round((loaded / totalBytes) * 100)) : 0);
    }
  }
  onProgress(100);
  const type = response.headers.get('Content-Type') ?? 'application/octet-stream';
  return new Blob(chunks as BlobPart[], { type });
};

export interface DownloadComponentsResult {
  progress: DownloadProgress[];
  error: { component: 'stt' | 'llm' | 'tts'; message: string } | null;
}

// Tải đủ 3 components của tier (mỗi component có thể gồm nhiều file — ONNX encoder/decoder);
// lỗi giữa chừng → trả error, KHÔNG đánh dấu đã tải (AF-04)
export const downloadTierWeights = async (
  tier: VoiceAITierDto,
  downloads: { stt: ComponentDownload; llm: ComponentDownload; tts: ComponentDownload },
  onProgress: (progress: DownloadProgress[]) => void,
): Promise<DownloadComponentsResult> => {
  const progress: DownloadProgress[] = [
    { component: 'stt', percent: 0, sizeMB: tier.components.stt.sizeMB },
    { component: 'llm', percent: 0, sizeMB: tier.components.llm.sizeMB },
    { component: 'tts', percent: 0, sizeMB: tier.components.tts.sizeMB },
  ];
  const emit = () => onProgress([...progress]);

  for (const component of ['stt', 'llm', 'tts'] as const) {
    try {
      // files[] đầy đủ; fallback legacy url 1-file nếu BE cũ chưa trả files
      const files = downloads[component].files ?? [
        { role: 'model' as const, fileName: `${component}.bin`, url: downloads[component].url, sizeMB: tier.components[component].sizeMB },
      ];
      const totalMB = files.reduce((sum, f) => sum + f.sizeMB, 0) || tier.components[component].sizeMB;
      let doneMB = 0;
      for (const file of files) {
        const blob = await streamComponent(
          file.url,
          file.sizeMB,
          (filePercent) => {
            // % component = phần đã tải xong + % file hiện tại quy về tổng
            const pct = totalMB > 0 ? Math.min(100, Math.round(((doneMB + (filePercent / 100) * file.sizeMB) / totalMB) * 100)) : 0;
            progress.find((p) => p.component === component)!.percent = pct;
            emit();
          },
        );
        await storeComponent(tier._id, component, file.fileName, blob);
        doneMB += file.sizeMB;
      }
      progress.find((p) => p.component === component)!.percent = 100;
      emit();
    } catch (error) {
      return {
        progress,
        error: {
          component,
          message: error instanceof Error ? error.message : 'Unknown download error',
        },
      };
    }
  }
  writeMeta({ tierId: tier._id, components: { stt: 'ok', llm: 'ok', tts: 'ok' } });
  return { progress, error: null };
};
