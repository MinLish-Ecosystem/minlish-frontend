/**
 * UC-13 Voice AI — Luật chấm nói, hàm THUẦN (CHUYÊN BIỆT cho speaking).
 * Không React, không state — skill khác muốn chấm thì viết services/*Score.ts riêng
 * và dùng chung primitives ở utils/textMatch.ts. Session state (cộng dồn, target,
 * từ đã bonus) do hook useSpeechScoring giữ.
 */
import type { ScoreResult, VocabBonusLists } from '../types';
import { extractKeywords, normalizeToStems, stemLight, termMatches } from '../utils/textMatch';

export interface SpeakingScoreConfig {
  keywordWeight: number;
  grammarWeight: number;
  dueWordBonus: number;
  dueBonusCap: number;
  newWordBonus: number;
  newBonusCap: number;
  utteranceCap: number;
}

export const DEFAULT_SPEAKING_CONFIG: SpeakingScoreConfig = {
  keywordWeight: 0.11,
  grammarWeight: 0.05,
  dueWordBonus: 2,
  dueBonusCap: 6,
  newWordBonus: 1,
  newBonusCap: 3,
  utteranceCap: 18,
};

// Trục keyword: tỉ lệ từ khóa câu hỏi xuất hiện trong câu trả lời
export const scoreKeywordAxis = (aiQuestion: string, userAnswer: string): number | null => {
  const expected = extractKeywords(aiQuestion).map(stemLight);
  if (expected.length === 0) return null;
  const answerWords = normalizeToStems(userAnswer);
  const matched = expected.filter((word) => answerWords.has(word)).length;
  return matched / expected.length;
};

// Trục ngữ pháp: heuristic độ dài + dấu câu + capitalization (thang thấp chống lạm phát)
export const scoreGrammarAxis = (userAnswer: string): number | null => {
  const trimmed = userAnswer.trim();
  if (trimmed.length < 2) return null;
  let score = 0.3;
  const words = trimmed.split(/\s+/);
  if (words.length >= 4) score += 0.2;
  if (words.length >= 8) score += 0.1;
  if (/^[A-Z]/.test(trimmed)) score += 0.1;
  if (/[.?!]$/.test(trimmed)) score += 0.1;
  return Math.min(0.8, score);
};

export interface VocabBonusResult {
  bonus: number;
  matchedDue: string[];
  matchedNew: string[];
  /** Key `due:x` / `new:x` để caller đánh dấu đã bonus (mỗi từ 1 lần/phiên). */
  bonusKeys: string[];
}

// Bonus từ vựng: đọc bonused (không mutate), trả bonusKeys để caller tự đánh dấu
export const scoreVocabBonus = (
  userAnswer: string,
  vocab: VocabBonusLists | undefined,
  bonused: ReadonlySet<string>,
  config: SpeakingScoreConfig = DEFAULT_SPEAKING_CONFIG,
): VocabBonusResult => {
  const matchedDue: string[] = [];
  const matchedNew: string[] = [];
  const bonusKeys: string[] = [];
  if (!vocab) return { bonus: 0, matchedDue, matchedNew, bonusKeys };
  const answerStems = normalizeToStems(userAnswer);
  let dueBonus = 0;
  for (const raw of vocab.due) {
    const term = raw.trim();
    if (!term) continue;
    if (dueBonus >= config.dueBonusCap) break;
    const key = `due:${term.toLowerCase()}`;
    if (bonused.has(key)) continue;
    if (!termMatches(term, answerStems)) continue;
    bonusKeys.push(key);
    matchedDue.push(term);
    dueBonus += config.dueWordBonus;
  }
  let newBonus = 0;
  for (const raw of vocab.fresh) {
    const term = raw.trim();
    if (!term) continue;
    if (newBonus >= config.newBonusCap) break;
    const key = `new:${term.toLowerCase()}`;
    if (bonused.has(key)) continue;
    if (!termMatches(term, answerStems)) continue;
    bonusKeys.push(key);
    matchedNew.push(term);
    newBonus += config.newWordBonus;
  }
  return {
    bonus: Math.min(dueBonus, config.dueBonusCap) + Math.min(newBonus, config.newBonusCap),
    matchedDue,
    matchedNew,
    bonusKeys,
  };
};

export const feedbackForSpeaking = (score: number): string => {
  if (score >= 13) return 'Xuất sắc! Câu nói rõ ràng và đúng trọng tâm.';
  if (score >= 8) return 'Tốt! Hãy thử dùng thêm từ vựng đang ôn nhé.';
  return 'Cố lên! Cố nhắc lại các ý chính của câu hỏi trong câu trả lời.';
};

/**
 * Chấm 1 câu nói. Trả null khi không chấm được (AF-09) — caller giữ phiên chạy tiếp.
 * Không mutate bonused — caller tự add bonusKeys vào set của phiên.
 */
export const scoreSpeakingUtterance = (
  aiQuestion: string,
  userAnswer: string,
  vocab: VocabBonusLists | undefined,
  bonused: ReadonlySet<string>,
  config: SpeakingScoreConfig = DEFAULT_SPEAKING_CONFIG,
): { result: ScoreResult | null; bonusKeys: string[] } => {
  const keywordScore = scoreKeywordAxis(aiQuestion, userAnswer);
  const grammarScore = scoreGrammarAxis(userAnswer);
  if (keywordScore == null || grammarScore == null) {
    return { result: null, bonusKeys: [] };
  }
  const base = (keywordScore * config.keywordWeight + grammarScore * config.grammarWeight) * 100;
  const { bonus, matchedDue, matchedNew, bonusKeys } = scoreVocabBonus(userAnswer, vocab, bonused, config);
  const score = Math.min(config.utteranceCap, Math.round(base + bonus));
  return {
    result: {
      score,
      feedback: feedbackForSpeaking(score),
      breakdown: {
        keyword: Math.round(keywordScore * 100),
        grammar: Math.round(grammarScore * 100),
        vocab: bonus,
        matchedDue,
        matchedNew,
      },
    },
    bonusKeys,
  };
};
