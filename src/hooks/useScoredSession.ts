/**
 * Lõi session tính điểm DÙNG CHUNG cho mọi skill (speaking, listening, reading, writing...).
 * Giữ: điểm tích lũy, mốc target, bắn onTargetReached đúng 1 lần khi chạm mốc.
 * Luật chấm của từng skill nằm ở services/*Score.ts của skill đó — hook này không biết
 * điểm từ đâu ra, chỉ cộng dồn. Dùng:
 *   const { accumulatedScore, addScore, resetSession } = useScoredSession(100, onDone);
 */
import { useCallback, useRef, useState } from 'react';

interface ScoredSession {
  accumulatedScore: number;
  targetScore: number;
  /** Cộng điểm 1 lượt, trả tổng mới. Chạm mốc → gọi onTargetReached 1 lần duy nhất. */
  addScore: (points: number) => number;
  resetSession: () => void;
}

export const useScoredSession = (targetScore: number, onTargetReached: () => void): ScoredSession => {
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const reachedRef = useRef(false);
  const totalRef = useRef(0);

  const addScore = useCallback(
    (points: number): number => {
      totalRef.current += Math.max(0, Math.round(points));
      const next = totalRef.current;
      setAccumulatedScore(next);
      if (!reachedRef.current && next >= targetScore) {
        reachedRef.current = true;
        onTargetReached();
      }
      return next;
    },
    [targetScore, onTargetReached],
  );

  const resetSession = useCallback(() => {
    reachedRef.current = false;
    totalRef.current = 0;
    setAccumulatedScore(0);
  }, []);

  return { accumulatedScore, targetScore, addScore, resetSession };
};
