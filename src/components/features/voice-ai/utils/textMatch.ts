/**
 * UC-13 Voice AI — Primitives so khớp văn bản tiếng Anh (DÙNG CHUNG).
 * Mọi skill chấm điểm (speaking, writing sau này...) dùng lại các hàm này,
 * luật riêng của từng skill nằm ở services/*Score.ts của skill đó.
 */

// Stopword bỏ khi rút keyword — giữ content words
export const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'you', 'your', 'i', 'me', 'my',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'about', 'and', 'or', 'but', 'it', 'this', 'that',
  'what', 'how', 'why', 'when', 'where', 'who', 'can', 'could', 'will', 'would', 'please', 'tell',
]);

// Stem nhẹ bỏ đuôi phổ thông — match "go/going", "school/schools"
export const stemLight = (word: string): string => {
  if (word.length > 4 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 3 && word.endsWith('ed')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1);
  return word;
};

// Chuẩn hóa text thành tập stem (lowercase, bỏ dấu câu)
export const normalizeToStems = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(stemLight),
  );

// Trích keyword kỳ vọng từ câu hỏi/chủ đề — bỏ stopword, giữ content words, dedupe
export const extractKeywords = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
  return Array.from(new Set(words));
};

// Từ vựng có thể là cụm (vd "take care of") — khớp khi đủ mọi token trong câu nói
export const termMatches = (term: string, answerStems: Set<string>): boolean => {
  const tokens = term
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(stemLight);
  if (tokens.length === 0) return false;
  return tokens.every((t) => answerStems.has(t));
};
