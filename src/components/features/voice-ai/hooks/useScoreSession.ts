/**
 * Hook DÙNG CHUNG cho mọi skill chấm điểm (speaking, listening, reading, writing...).
 * Giữ điểm tích lũy phiên + mốc target + callback chạm mốc — không biết gì về luật chấm.
 * Luật chấm của từng skill là hàm thuần ở services/*Score.ts, gọi addScore() để cộng điểm.
 */
import { useCallback, useRef, useState } from 'react';

export interface ScoreSession {
  accumulated: number;
  /** Cộng điểm, trả tổng mới. Chạm target lần đầu → gọi onTargetReached 1 lần duy nhất. */
  addScore: (points: number) => number;
  reset: () => void;
}

export const useScoreSession = (target: number, onTargetReached: () => void): ScoreSession => {
  const [accumulated, setAccumulated] = useState(0);
  const accRef = useRef(0);
  const reachedRef = useRef(false);

  const addScore = useCallback(
    (points: number): number => {
      const next = accRef.current + points;
      accRef.current = next;
      setAccumulated(next);
      if (!reachedRef.current && next >= target) {
        reachedRef.current = true;
        onTargetReached();
      }
      return next;
    },
    [target, onTargetReached],
  );

  const reset = useCallback(() => {
    accRef.current = 0;
    reachedRef.current = false;
    setAccumulated(0);
  }, []);

  return { accumulated, addScore, reset };
};
