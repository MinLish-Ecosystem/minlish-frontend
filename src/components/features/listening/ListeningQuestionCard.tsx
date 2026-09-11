import McqOptions from "./McqOptions";
import TranscriptionInput from "./TranscriptionInput";
import WordOrderInput from "./WordOrderInput";
import type { ListeningSelectedAnswer, ListeningSessionQuestion } from "../../../types/listening";

export interface ListeningQuestionCardProps {
  question: ListeningSessionQuestion;
  value: ListeningSelectedAnswer | null;
  disabled: boolean;
  onChange: (value: ListeningSelectedAnswer) => void;
}

/** Wrapper chọn vùng nhập liệu theo dạng câu (BR-03: transcription | word-order | mcq) */
export default function ListeningQuestionCard({
  question,
  value,
  disabled,
  onChange,
}: ListeningQuestionCardProps) {
  if (question.type === "transcription") {
    return (
      <TranscriptionInput
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }
  if (question.type === "word-order") {
    return (
      <WordOrderInput
        wordOptions={question.wordOptions ?? []}
        selected={Array.isArray(value) ? value : []}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }
  return (
    <McqOptions
      options={question.options ?? []}
      value={typeof value === "string" ? value : null}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
