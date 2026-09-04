/**
 * UC-13 Voice AI — Mồi chủ đề hội thoại bằng từ vựng của user (80/20).
 * Prompt cứng không biết hôm nay user cần ôn gì nên AI hỏi lan man — mỗi phiên
 * trộn ~8 từ (ưu tiên due → fresh → ngoài bank) nhồi vào cuối system prompt,
 * AI sẽ hỏi xoáy quanh các từ đó, khớp luôn luật bonus điểm từ vựng.
 */
import api from '../../../../lib/api';

// Bank từ ngoài flashcard (20% đổi gió) — chủ đề đời thường, xoay vòng ngẫu nhiên
const OUTSIDE_BANK = [
  'weekend', 'breakfast', 'movie', 'guitar', 'beach', 'birthday', 'soccer', 'coffee',
  'garden', 'festival', 'bicycle', 'puppy', 'rain', 'market', 'photo', 'dance',
  'pizza', 'river', 'camping', 'bookstore', 'sunrise', 'picnic', 'museum',
  'volleyball', 'noodles', 'concert', 'library', 'sunset', 'hiking', 'bakery', 'kite',
];

const DUE_N = 5;
const FRESH_N = 2;
const OUT_N = 1;

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const clean = (terms: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of terms) {
    const t = raw.trim().toLowerCase();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(raw.trim());
  }
  return out;
};

/**
 * Trộn từ mồi: due trước, thiếu thì bù fresh, còn thiếu bù bank ngoài.
 * Hết từ user (học xong hết) → focus rỗng, caller dùng bank ngoài để vẫn đa dạng.
 */
export interface PickedFocus {
  /** Từ của user theo thứ tự ưu tiên (mở đầu hội thoại bằng từ đầu tiên) */
  focus: string[];
  /** Từ ngoài bù vào cho đủ 80/20 */
  outside: string[];
}

export const pickFocusWords = (due: string[], fresh: string[]): PickedFocus => {
  const dueClean = shuffle(clean(due));
  const dueLower = new Set(dueClean.map((d) => d.toLowerCase()));
  const freshClean = shuffle(clean(fresh).filter((w) => !dueLower.has(w.toLowerCase())));
  const pickedDue = dueClean.slice(0, DUE_N);
  const pickedFresh = freshClean.slice(0, FRESH_N);
  const shortage = DUE_N + FRESH_N - pickedDue.length - pickedFresh.length;
  const pickedSet = new Set([...pickedDue, ...pickedFresh].map((p) => p.toLowerCase()));
  const pickedOut = shuffle(OUTSIDE_BANK.filter((w) => !pickedSet.has(w))).slice(
    0,
    OUT_N + Math.max(0, shortage),
  );
  return { focus: [...pickedDue, ...pickedFresh], outside: pickedOut };
};

/** Thông tin cá nhân hóa cho prompt template — best-effort, lỗi thì rỗng (prompt vẫn chạy). */
export interface LearnerVars {
  name: string;
  level: string;
}

export const fetchLearnerVars = async (): Promise<LearnerVars> => {
  try {
    const [p, lp] = await Promise.all([
      api.get('/api/v1/user/profile').catch(() => null),
      api.get('/api/v1/user/learning-profile').catch(() => null),
    ]);
    const rawName = (p?.data?.data as { name?: unknown } | undefined)?.name;
    const lpData = (lp?.data?.data ?? {}) as { currentLevel?: unknown; targetLevel?: unknown };
    const rawLevel = lpData.currentLevel ?? lpData.targetLevel ?? '';
    return {
      name: typeof rawName === 'string' ? rawName : '',
      level: typeof rawLevel === 'string' ? rawLevel : '',
    };
  } catch {
    return { name: '', level: '' };
  }
};
export const buildTopicSeed = (due: string[], fresh: string[]): string => {
  const { focus, outside: pickedOut } = pickFocusWords(due, fresh);
  if (focus.length === 0) {
    return (
      `\nFree topic ideas: ${pickedOut.slice(0, 3).join(', ')}. ` +
      `Pick one and start with a concrete, fun question.`
    );
  }
  // Kịch bản hội thoại: mở bằng từ đầu → đào sâu theo câu trả lời của user (2-3 lượt/chủ đề)
  // rồi mới chuyển, cấm nhảy ngang (vd đang du lịch bẻ sang sức khỏe).
  return (
    `\nToday's focus words (in order): ${focus.join(', ')}. ` +
    `Start with a question using the first word. As we talk, follow up on MY answers ` +
    `and weave in the next focus words one topic at a time — finish one topic with ` +
    `2-3 exchanges before moving on. Do NOT jump abruptly between unrelated topics ` +
    `(e.g. from travel to health with no bridge). ` +
    `About 80% of your questions should revolve around these words` +
    `${pickedOut.length > 0 ? ` (you may also touch on: ${pickedOut.join(', ')})` : ''}; ` +
    `the rest can be any everyday topic.`
  );
};
