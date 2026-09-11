import { useEffect } from "react";
import { AlertTriangle, Loader2, RotateCcw, Volume2 } from "lucide-react";
import Button from "../../common/Button";
import Card from "../../common/Card";
import { useListeningAudio } from "../../../hooks/useListeningAudio";
import { cn } from "../../../lib/utils";
import type { ListeningAudioPlayState } from "../../../types/listening";

export interface ListeningAudioPlayerProps {
  questionId: string;
  /** Khoá thao tác khi đang gửi kết quả phiên (FINISHING) */
  disabled?: boolean;
  onPlayStateChange?: (state: ListeningAudioPlayState) => void;
}

/** Vùng phát audio: nút loa + nghe lại; chỉ phát theo hành động learner, không auto-play (D-1) */
export default function ListeningAudioPlayer({
  questionId,
  disabled = false,
  onPlayStateChange,
}: ListeningAudioPlayerProps) {
  const { playState, isFetchingAudio, audioErrorMessage, play, retry } =
    useListeningAudio(questionId);

  useEffect(() => {
    onPlayStateChange?.(playState);
  }, [onPlayStateChange, playState]);

  const isBusy = playState === "playing" || isFetchingAudio;
  const hasPlayed = playState === "played";

  return (
    <Card className="mb-6 p-6">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={play}
          disabled={disabled || isBusy}
          aria-label="Phát audio"
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200 transition-all",
            "hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60",
            "motion-reduce:transition-none",
          )}
        >
          {isFetchingAudio ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Volume2 className={cn("h-8 w-8", playState === "playing" && "motion-safe:animate-pulse")} />
          )}
        </button>

        <p aria-live="polite" className="text-sm font-medium text-slate-500">
          {playState === "playing"
            ? "Đang phát audio…"
            : isFetchingAudio
              ? "Đang tải audio…"
              : hasPlayed
                ? "Đã phát xong — có thể nghe lại không giới hạn."
                : "Bấm để nghe audio của câu này."}
        </p>

        {audioErrorMessage ? (
          <div
            role="alert"
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-center"
          >
            <p className="flex items-center gap-1.5 text-sm font-semibold text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              {audioErrorMessage}
            </p>
            <Button variant="outline" size="sm" onClick={retry} disabled={disabled}>
              Thử lại
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={play}
            disabled={disabled || !hasPlayed || isBusy}
          >
            Nghe lại
          </Button>
        )}
      </div>
    </Card>
  );
}
