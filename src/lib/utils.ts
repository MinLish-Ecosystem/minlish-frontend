import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Text-to-Speech helpers ─────────────────────────────────────────────────

/**
 * Speak text using Web Speech API
 * @param text Text to speak
 * @param lang BCP-47 language code (default: en-US)
 * @param rate Speech rate 0.1-10 (default: 1.0)
 */
export const speak = (text: string, lang = 'en-US', rate = 1.0): void => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = Math.max(0.1, Math.min(10, rate));
  utterance.pitch = 1.0;
  // Pick a natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith(lang.split('-')[0]) && !v.name.includes('Google')
  );
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
};

/** Cancel any ongoing speech */
export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/** Play an audio URL, fallback to TTS if fails */
export const playAudio = (
  audioUrl?: string,
  word?: string,
  lang = 'en-US'
): void => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      if (word) speak(word, lang);
    });
  } else if (word) {
    speak(word, lang);
  }
};
