/**
 * UC-13 Voice AI — Dịch phụ đề EN→VI cho nút "Phụ đề Việt" (toggle, tắt mặc định
 * để người học thuần tiếng Anh không bị phụ thuộc chữ).
 * Dùng API MyMemory miễn phí phía client, cache RAM theo câu, timeout 8s.
 * Hết quota / mất mạng → throw để UI hiện "Không dịch được", phiên không đứt.
 */

const cache = new Map<string, string>();

export const translateEnToVi = async (text: string): Promise<string> => {
  const key = text.trim();
  if (!key) return '';
  const hit = cache.get(key);
  if (hit) return hit;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(key)}&langpair=en|vi`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const vi = (data?.responseData?.translatedText ?? '').trim();
    if (!vi || /QUERY LENGTH LIMIT|INVALID/i.test(vi)) throw new Error('Translate quota/error');
    cache.set(key, vi);
    return vi;
  } finally {
    clearTimeout(timer);
  }
};
