/**
 * UC-13 Voice AI — Hook giữ STATE phiên chấm nói (BR-07 / CAP-10, CAP-11).
 * Cộng dồn/target dùng lõi chung useScoredSession (xài chung cho mọi skill);
 * luật chấm thuần nằm ở services/speakingScore.ts (chuyên biệt speaking);
 * primitives dùng chung nằm ở utils/textMatch.ts.
 */
import { useCallback, useRef } from 'react';
import { useScoredSession } from '../../../../hooks/useScoredSession';
import type { ScoreResult, VocabBonusLists } from '../types';
import { DEFAULT_SPEAKING_CONFIG, scoreSpeakingUtterance } from '../services/speakingScore';

// Re-export để callsite cũ không phải sửa import
export const KEYWORD_WEIGHT = DEFAULT_SPEAKING_CONFIG.keywordWeight;
export const GRAMMAR_WEIGHT = DEFAULT_SPEAKING_CONFIG.grammarWeight;
export const DUE_WORD_BONUS = DEFAULT_SPEAKING_CONFIG.dueWordBonus;
export const DUE_BONUS_CAP = DEFAULT_SPEAKING_CONFIG.dueBonusCap;
export const NEW_WORD_BONUS = DEFAULT_SPEAKING_CONFIG.newWordBonus;
export const NEW_BONUS_CAP = DEFAULT_SPEAKING_CONFIG.newBonusCap;
export const PER_UTTERANCE_CAP = DEFAULT_SPEAKING_CONFIG.utteranceCap;
export type { VocabBonusLists } from '../types';

// targetScore — hằng số hard-code FE (BA chốt 2026-08-29, BR-09). 100 ≈ 7-10 lượt/phiên.
export const TARGET_SCORE = 100;

interface SpeechScoringState {
  accumulatedScore: number;
  targetScore: number;
  scoreUtterance: (aiQuestion: string, userAnswer: string, vocab?: VocabBonusLists) => ScoreResult | null;
  resetSession: () => void;
}

export const useSpeechScoring = (opts: {
  onTargetReached: () => void;
}): SpeechScoringState => {
  // Key `due:x` / `new:x` đã bonus trong phiên — reset mỗi phiên mới
  const bonusedRef = useRef<Set<string>>(new Set());
  const { accumulatedScore, targetScore, addScore, resetSession: resetBase } =
    useScoredSession(TARGET_SCORE, opts.onTargetReached);

  const resetSession = useCallback(() => {
    bonusedRef.current = new Set();
    resetBase();
  }, [resetBase]);

  const scoreUtterance = useCallback(
    (aiQuestion: string, userAnswer: string, vocab?: VocabBonusLists): ScoreResult | null => {
      const { result, bonusKeys } = scoreSpeakingUtterance(aiQuestion, userAnswer, vocab, bonusedRef.current);
      if (!result) {
        return null; // AF-09: câu không chấm được theo luật → "chưa đánh giá", chat không đứt
      }
      for (const key of bonusKeys) bonusedRef.current.add(key);
      // BR-09 / AC-14: cộng dồn, chạm targetScore → hoàn thành phiên (lõi chung lo)
      addScore(result.score);
      return result;
    },
    [addScore],
  );

  return { accumulatedScore, targetScore, scoreUtterance, resetSession };
};
