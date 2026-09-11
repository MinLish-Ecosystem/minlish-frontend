import { useMemo } from "react";

export interface WordOrderInputProps {
  /** wordOptions từ BE — đã xáo trộn sẵn (API-01) */
  wordOptions: string[];
  /** Thứ tự từ đã chọn; rỗng khi chưa ghép */
  selected: string[];
  disabled: boolean;
  onChange: (selected: string[]) => void;
}

/** Dạng word-order — chips từ xáo trộn, bấm để ghép/bỏ khỏi câu (D-3, BR-03); chip là button nên thao tác được bằng bàn phím */
export default function WordOrderInput({ wordOptions, selected, disabled, onChange }: WordOrderInputProps) {
  // Kho từ còn lại tính theo đa tập để từ trùng lặp không bị mất nhầm
  const remainingWords = useMemo(() => {
    const usedCounts = new Map<string, number>();
    selected.forEach((word) => usedCounts.set(word, (usedCounts.get(word) ?? 0) + 1));
    const remaining: string[] = [];
    wordOptions.forEach((word) => {
      const used = usedCounts.get(word) ?? 0;
      if (used > 0) {
        usedCounts.set(word, used - 1);
      } else {
        remaining.push(word);
      }
    });
    return remaining;
  }, [selected, wordOptions]);

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-700">Ghép các từ theo thứ tự bạn nghe được</p>

      <div
        aria-label="Câu bạn đã ghép"
        className="min-h-[64px] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3"
      >
        {selected.length === 0 ? (
          <p className="py-2 text-sm text-slate-400">Bấm các từ bên dưới để ghép thành câu</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map((word, index) => (
              <button
                key={`${word}-${index}`}
                type="button"
                onClick={() => onChange(selected.filter((_, position) => position !== index))}
                disabled={disabled}
                aria-label={`Bỏ từ "${word}" khỏi câu`}
                className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:border-purple-300 disabled:cursor-not-allowed motion-reduce:transition-none"
              >
                {word}
              </button>
            ))}
          </div>
        )}
      </div>

      <div aria-label="Kho từ" className="flex flex-wrap gap-2">
        {remainingWords.map((word, index) => (
          <button
            key={`${word}-${index}`}
            type="button"
            onClick={() => onChange([...selected, word])}
            disabled={disabled}
            aria-label={`Thêm từ "${word}" vào câu`}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
