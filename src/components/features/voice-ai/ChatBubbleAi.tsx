/**
 * UC-13 Voice AI — Chat bubble AI (CAP-07, BR-02: tiếng Anh thuần) + nút replay TTS (OQ-06).
 */
import { memo } from 'react';
import { Volume2 } from 'lucide-react';

interface ChatBubbleAiProps {
  text: string;
  onReplay: () => void;
  speaking?: boolean;
}

export const ChatBubbleAi = memo(function ChatBubbleAi({ text, onReplay, speaking }: ChatBubbleAiProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-slate-200 text-slate-800 shadow-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <button
            type="button"
            onClick={onReplay}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Nghe lại câu trả lời"
            title="Replay TTS"
          >
            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          {speaking && (
            <span className="text-[10px] font-medium text-purple-500" role="status">
              Đang nói…
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
