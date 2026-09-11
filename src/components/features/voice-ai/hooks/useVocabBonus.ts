/**
 * UC-13 Voice AI — Lấy từ vựng flashcard của user để tính bonus điểm nói.
 * due = reviewCards (tới hạn ôn, bonus cao), fresh = newCards (từ mới, bonus nhẹ).
 * Nguồn: GET /api/v1/learning/queue?previewOnly=true (full queue, không trừ phần đã học).
 * Lỗi/mất mạng → trả rỗng, phiên vẫn chấm base bình thường (không đứt).
 */
import { useCallback, useState } from 'react';
import api from '../../../../lib/api';
import type { VocabBonusLists } from '../types';

const MAX_TERMS = 300;

const pickWords = (cards: unknown): string[] => {
  if (!Array.isArray(cards)) return [];
  return cards
    .map((c) => (c as { word?: unknown }).word)
    .filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
    .slice(0, MAX_TERMS);
};

export const useVocabBonus = (): {
  vocab: VocabBonusLists;
  refreshVocab: () => Promise<VocabBonusLists>;
} => {
  const [vocab, setVocab] = useState<VocabBonusLists>({ due: [], fresh: [] });

  const refresh = useCallback(async (): Promise<VocabBonusLists> => {
    try {
      const res = await api.get('/api/v1/learning/queue', { params: { previewOnly: true } });
      const data = (res.data?.data ?? {}) as { reviewCards?: unknown; newCards?: unknown };
      const next: VocabBonusLists = { due: pickWords(data.reviewCards), fresh: pickWords(data.newCards) };
      setVocab(next);
      console.log(`[UC-13] Vocab bonus: ${next.due.length} từ ôn + ${next.fresh.length} từ mới`);
      return next;
    } catch {
      const empty: VocabBonusLists = { due: [], fresh: [] };
      setVocab(empty);
      return empty;
    }
  }, []);

  return { vocab, refreshVocab: refresh };
};
