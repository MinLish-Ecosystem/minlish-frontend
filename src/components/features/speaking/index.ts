// Speaking Components
export { default as SpeakingCard } from "./SpeakingCard";
export type { SpeakingCardProps, SpeakingResult, SpeakingDifficulty, SpeakingStatus } from "./SpeakingCard";

// Keep the old component for backwards compatibility
export { default as SpeakingPrompt } from "./SpeakingPrompt";
export type { SpeakingPromptProps, SpeakingResult as SpeakingPromptResult, SpeakingDifficulty as SpeakingPromptDifficulty } from "./SpeakingPrompt";
