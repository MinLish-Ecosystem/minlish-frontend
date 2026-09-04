/**
 * UC-13 Voice AI — Prompt mẫu hóa (cá nhân hóa theo user).
 * Admin viết prompt với biến {{ten_bien}}, runtime fill giá trị của từng người:
 * - {{focus_words}} — từ mồi hôm nay (due → fresh → ngoài), rỗng thì "everyday topics"
 * - {{level}}       — trình độ hiện tại (currentLevel, rớt về targetLevel)
 * - {{name}}        — tên user
 * Token lạ (gõ sai) giữ nguyên + warn Console để admin phát hiện, không lặng lẽ nuốt.
 */

export interface PromptVars {
  focus_words: string;
  level: string;
  name: string;
}

const TOKEN_RE = /\\?\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export const hasToken = (template: string, name: keyof PromptVars): boolean =>
  template.includes(`{{${name}}}`);

export const renderPromptTemplate = (
  template: string,
  vars: PromptVars,
): { text: string; missing: string[] } => {
  const missing = new Set<string>();
  // \{{token}} → giữ nguyên văn {{token}} (dùng trong ví dụ BAD của prompt)
  const text = template.replace(TOKEN_RE, (m, key: string) => {
    if (m.startsWith('\\')) return m.slice(1);
    if (key === 'focus_words' || key === 'level' || key === 'name') return vars[key];
    missing.add(key);
    return m;
  });
  if (missing.size > 0) {
    console.warn('[UC-13] Prompt có token lạ (không render, kiểm tra chính tả):', [...missing]);
  }
  return { text, missing: [...missing] };
};
