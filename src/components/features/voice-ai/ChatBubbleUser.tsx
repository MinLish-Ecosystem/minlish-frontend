/**
 * UC-13 Voice AI — Chat bubble user (text STT) + ScoreChip + feedback (CAP-10, AF-09).
 */
import { memo } from 'react';
import type { ChatMessage } from './types';

interface ChatBubbleUserProps {
  message: ChatMessage;
}

export const ChatBubbleUser = memo(function ChatBubbleUser({ message }: ChatBubbleUserProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm">
        {message.pending ? (
          <span className="inline-flex items-center gap-1.5 text-sm" role="status" aria-label="AI đang suy nghĩ">
            <span className="flex gap-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-white/80 text-xs">AI đang nghĩ…</span>
          </span>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        )}
        <div className="mt-1.5 text-right">
          {message.scoringFailed ? (
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
              chưa đánh giá
            </span>
          ) : message.score != null ? (
            <div className="inline-flex flex-col items-end gap-0.5">
              <span
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20"
                aria-label={`Điểm câu nói: ${message.score} trên 100`}
              >
                Score: {message.score}/100
                {message.scoreBreakdown
                  ? ` · keyword ${message.scoreBreakdown.keyword} · grammar ${message.scoreBreakdown.grammar}${
                      (message.scoreBreakdown.vocab ?? 0) > 0 ? ` · +${message.scoreBreakdown.vocab} từ vựng` : ''
                    }`
                  : ''}
              </span>
              {message.feedback && <span className="text-[10px] text-white/70">{message.feedback}</span>}
            </div>
          ) : (
            <span className="text-[10px] text-white/60">…</span>
          )}
        </div>
      </div>
    </div>
  );
});
