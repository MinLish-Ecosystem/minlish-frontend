import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Headphones,
  Mic,
  Type,
  FileText,
  ListMusic,
  Shuffle,
  Trophy,
  Zap,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

// Exercise Types for Listening Practice
type ExerciseType = "sentence" | "fill-blank" | "listen-fill";

// Mode types for session
type SessionMode = "mixed" | "sentence" | "fill-blank" | "listen-fill";
type Difficulty = "easy" | "medium" | "hard";

interface ListeningItem {
  id: string;
  audioUrl?: string;
  text: string; // Full sentence or paragraph
  blankWord?: string; // Word to be blanked (for fill-blank mode)
  blankIndex?: number; // Index of word to blank
  translation?: string;
  hint?: string;
  difficulty: Difficulty;
  _exerciseType?: ExerciseType; // For mixed mode
}

interface SessionResult {
  itemId: string;
  userAnswer: string;
  correct: boolean;
  timeSpent: number;
}

// ─── Sample Data (Sẽ thay bằng API call sau) ────────────────────────────────
const SAMPLE_LISTENING_ITEMS: ListeningItem[] = [
  {
    id: "1",
    text: "The quick brown fox jumps over the lazy dog.",
    blankWord: "fox",
    blankIndex: 3,
    translation: "Con cáo nâu nhanh nhẹn nhảy qua con chó lười.",
    hint: "A wild animal",
    difficulty: "easy",
  },
  {
    id: "2",
    text: "She sells seashells by the seashore.",
    blankWord: "seashells",
    blankIndex: 2,
    translation: "Cô ấy bán vỏ sò ở bờ biển.",
    hint: "Things found on the beach",
    difficulty: "medium",
  },
  {
    id: "3",
    text: "Peter Piper picked a peck of pickled peppers.",
    blankWord: "Piper",
    blankIndex: 1,
    translation: "Peter Piper hái một góc ớt ngâm giấm.",
    hint: "A person's last name",
    difficulty: "hard",
  },
  {
    id: "4",
    text: "The sun rises in the east every morning.",
    blankWord: "east",
    blankIndex: 4,
    translation: "Mặt trời mọc ở phía đông mỗi buổi sáng.",
    hint: "Direction",
    difficulty: "easy",
  },
  {
    id: "5",
    text: "Learning a new language requires patience and practice.",
    blankWord: "patience",
    blankIndex: 3,
    translation: "Học một ngôn ngữ mới đòi hỏi sự kiên nhẫn và thực hành.",
    hint: "Not rushing",
    difficulty: "medium",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const normalizeAnswer = (answer: string): string => {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"()-]/g, "")
    .replace(/\s+/g, " ");
};

const checkAnswer = (userAnswer: string, correctAnswer: string): boolean => {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
};

// Get exercise type for an item (used in mixed mode)
const getExerciseType = (item: ListeningItem, forceType?: ExerciseType): ExerciseType => {
  if (forceType) return forceType;
  // Default: use blankWord if available, otherwise sentence
  return item.blankWord ? "fill-blank" : "sentence";
};

// Get correct answer based on exercise type
const getCorrectAnswer = (item: ListeningItem, exerciseType: ExerciseType): string => {
  if (exerciseType === "sentence") return item.text;
  return item.blankWord || item.text;
};

// Get placeholder text based on exercise type
const getPlaceholder = (exerciseType: ExerciseType): string => {
  switch (exerciseType) {
    case "sentence":
      return "Type the sentence you heard...";
    case "fill-blank":
      return "Type the missing word...";
    case "listen-fill":
      return "Type the word you heard...";
    default:
      return "Your answer...";
  }
};

// Get mode label based on exercise type
const getModeLabel = (exerciseType: ExerciseType): string => {
  switch (exerciseType) {
    case "sentence":
      return "Sentence Dictation";
    case "fill-blank":
      return "Fill in the Blank";
    case "listen-fill":
      return "Listen & Fill";
    default:
      return "Practice";
  }
};

const speakText = (text: string, onEnd?: () => void) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  }
};

const playAudio = (audioUrl: string, onError?: () => void): HTMLAudioElement | null => {
  const audio = new Audio(audioUrl);
  audio.play().catch(() => {
    if (onError) onError();
  });
  return audio;
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
      />
    </div>
  );
}

function AudioButton({
  onClick,
  isPlaying,
  disabled,
}: {
  onClick: () => void;
  isPlaying: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl",
        isPlaying
          ? "bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-300"
          : "bg-gradient-to-br from-purple-500 to-indigo-500 shadow-purple-200 hover:shadow-purple-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {isPlaying ? (
        <div className="flex gap-1 items-end h-6">
          {[0.5, 1, 1.5, 1, 0.5].map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: [h * 12, 24, h * 12] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-1.5 bg-white rounded-full"
            />
          ))}
        </div>
      ) : (
        <Volume2 className="w-10 h-10 text-white" />
      )}
    </motion.button>
  );
}

function CompletionScreen({
  results,
  totalItems,
  onRestart,
  onExit,
}: {
  results: SessionResult[];
  totalItems: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = Math.round((correctCount / totalItems) * 100);
  const avgTime = Math.round(
    results.reduce((acc, r) => acc + r.timeSpent, 0) / results.length
  );

  const getGrade = () => {
    if (accuracy >= 90) return { emoji: "🌟", text: "Excellent!", color: "text-emerald-500" };
    if (accuracy >= 70) return { emoji: "👏", text: "Great Job!", color: "text-blue-500" };
    if (accuracy >= 50) return { emoji: "💪", text: "Good Effort!", color: "text-amber-500" };
    return { emoji: "📚", text: "Keep Practicing!", color: "text-rose-500" };
  };

  const grade = getGrade();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
    >
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-2xl shadow-orange-200">
          <Trophy className="w-14 h-14 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center">
          <span className="text-2xl">{grade.emoji}</span>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-slate-800 mb-2">{grade.text}</h2>
      <p className="text-slate-500 mb-8">
        You completed <span className="font-bold text-slate-700">{totalItems}</span> listening exercises
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl py-4 px-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{correctCount}</p>
          <p className="text-[11px] font-semibold text-emerald-500 mt-1">Correct</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl py-4 px-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{accuracy}%</p>
          <p className="text-[11px] font-semibold text-purple-500 mt-1">Accuracy</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl py-4 px-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{avgTime}s</p>
          <p className="text-[11px] font-semibold text-blue-500 mt-1">Avg Time</p>
        </div>
      </div>

      {/* Results List */}
      <div className="w-full max-w-sm mb-8 space-y-2 max-h-[200px] overflow-y-auto">
        {results.map((result, i) => (
          <div
            key={result.itemId}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl border",
              result.correct
                ? "bg-emerald-50 border-emerald-100"
                : "bg-rose-50 border-rose-100"
            )}
          >
            <span className="text-sm font-medium text-slate-700">
              Question {i + 1}
            </span>
            {result.correct ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500" />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={onExit}
          className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onRestart}
          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Practice Again
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Listening() {
  const navigate = useNavigate();

  // Session State
  const [sessionMode, setSessionMode] = useState<SessionMode>("mixed");
  const [items, setItems] = useState<ListeningItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentExerciseType, setCurrentExerciseType] = useState<ExerciseType>("fill-blank");
  const [userAnswer, setUserAnswer] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentItem = items[currentIndex];
  const totalItems = items.length;

  // ─── Initialize Session ───────────────────────────────────────────────
  useEffect(() => {
    let shuffled = shuffleArray(SAMPLE_LISTENING_ITEMS);

    // If not mixed mode, assign same type to all items
    if (sessionMode !== "mixed") {
      shuffled = shuffled.map(item => ({ ...item }));
    }

    // For mixed mode, randomly assign exercise type to each item
    if (sessionMode === "mixed") {
      shuffled = shuffled.map(item => {
        // Randomly choose between "fill-blank" and "listen-fill"
        const type = Math.random() > 0.5 ? "fill-blank" : "listen-fill";
        return { ...item, _exerciseType: type };
      });
    }

    setItems(shuffled);
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());

    // Set first exercise type
    if (shuffled.length > 0) {
      const firstType = shuffled[0]._exerciseType || 
        (sessionMode !== "mixed" ? sessionMode as ExerciseType : "fill-blank");
      setCurrentExerciseType(firstType);
    }
  }, [sessionMode]);

  // Focus input when question changes
  useEffect(() => {
    if (!showResult && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, showResult]);

  // ─── Audio Functions ──────────────────────────────────────────────────
  const handlePlayAudio = useCallback(() => {
    if (!currentItem) return;

    setIsPlaying(true);
    setPlayCount((prev) => prev + 1);

    // If has audio file, play it
    if (currentItem.audioUrl) {
      audioRef.current = playAudio(currentItem.audioUrl, () => {
        setIsPlaying(false);
        speakText(getDisplayText());
      });
      if (audioRef.current) {
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    } else {
      // Use Web Speech API
      speakText(getDisplayText(), () => {
        setIsPlaying(false);
      });
    }
  }, [currentItem]);

  const getDisplayText = (): string => {
    if (!currentItem) return "";
    // Always speak the full sentence for listening
    return currentItem.text;
  };

  // ─── Answer Handling ────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!userAnswer.trim() || !currentItem) return;

    const exerciseType = currentItem._exerciseType || currentExerciseType;
    const correctAnswer = getCorrectAnswer(currentItem, exerciseType);
    const correct = checkAnswer(userAnswer, correctAnswer);
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

    setIsCorrect(correct);
    setShowResult(true);

    setResults((prev) => [
      ...prev,
      {
        itemId: currentItem.id,
        userAnswer: userAnswer.trim(),
        correct,
        timeSpent,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalItems) {
      setSessionDone(true);
    } else {
      const nextIndex = currentIndex + 1;
      const nextItem = items[nextIndex];
      const nextType = nextItem._exerciseType || currentExerciseType;

      setCurrentIndex(nextIndex);
      setCurrentExerciseType(nextType);
      setUserAnswer("");
      setShowResult(false);
      setIsCorrect(false);
      setPlayCount(0);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setUserAnswer("");
      setShowResult(false);
      setIsCorrect(false);
      setPlayCount(0);
      setQuestionStartTime(Date.now());
    }
  };

  const handleRestart = () => {
    let shuffled = shuffleArray(SAMPLE_LISTENING_ITEMS);

    // For mixed mode, randomly assign exercise type to each item
    if (sessionMode === "mixed") {
      shuffled = shuffled.map(item => {
        const type = Math.random() > 0.5 ? "fill-blank" : "listen-fill";
        return { ...item, _exerciseType: type };
      });
    }

    setItems(shuffled);
    setCurrentIndex(0);
    setCurrentExerciseType(shuffled[0]?._exerciseType || (sessionMode !== "mixed" ? sessionMode as ExerciseType : "fill-blank"));
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setSessionDone(false);
    setResults([]);
    setPlayCount(0);
    setQuestionStartTime(Date.now());
    setStartTime(Date.now());
  };

  const handleSkip = () => {
    if (currentIndex + 1 < totalItems) {
      // Mark as incorrect if skipped without answer
      if (userAnswer.trim()) {
        const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
        setResults((prev) => [
          ...prev,
          {
            itemId: currentItem.id,
            userAnswer: "[Skipped]",
            correct: false,
            timeSpent,
          },
        ]);
      }
      setCurrentIndex((i) => i + 1);
      setUserAnswer("");
      setShowResult(false);
      setIsCorrect(false);
      setPlayCount(0);
      setQuestionStartTime(Date.now());
    } else {
      setSessionDone(true);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionDone) return;

      // Space to play audio (when not in input)
      if (e.key === " " && document.activeElement !== inputRef.current) {
        e.preventDefault();
        handlePlayAudio();
      }

      // Enter to submit or next
      if (e.key === "Enter") {
        if (showResult) {
          handleNext();
        } else {
          handleSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionDone, showResult, handlePlayAudio]);

  // ─── Render ─────────────────────────────────────────────────────────────

  // Mode Selection Screen
  if (items.length === 0 && !sessionDone) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-200">
            <Headphones className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Listening Practice
          </h2>
          <p className="text-slate-500">
            Choose your practice mode and improve your listening skills
          </p>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSessionMode("mixed")}
            className="w-full p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-purple-400 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center group-hover:from-purple-200 group-hover:to-indigo-200 transition-all">
                <Shuffle className="w-7 h-7 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  Mixed Practice
                </h3>
                <p className="text-sm text-slate-500">
                  Challenge yourself with both fill-in-the-blank and listen & fill exercises randomly.
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs font-bold rounded-full">
                    Mixed
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                    All types
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 self-center" />
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSessionMode("sentence")}
            className="w-full p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-cyan-200 transition-all">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  Sentence Dictation
                </h3>
                <p className="text-sm text-slate-500">
                  Listen to full sentences and type them exactly as you hear them.
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                    Full sentences
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                    Beginner friendly
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 self-center" />
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  // Session Complete Screen
  if (sessionDone) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <CompletionScreen
          results={results}
          totalItems={totalItems}
          onRestart={handleRestart}
          onExit={() => navigate("/practice")}
        />
      </div>
    );
  }

  // ─── Main Practice Screen ───────────────────────────────────────────────

  const renderBlankText = () => {
    if (!currentItem || (currentExerciseType !== "fill-blank" && currentExerciseType !== "listen-fill")) return null;

    const words = currentItem.text.split(" ");
    const blankIdx = currentItem.blankIndex!;

    return (
      <p className="text-xl md:text-2xl text-slate-700 leading-relaxed">
        {words.map((word, i) => {
          if (i === blankIdx) {
            return (
              <span key={i} className="inline-block mx-1">
                <span className="inline-block min-w-[120px] px-3 py-1 bg-purple-100 border-b-2 border-purple-400 text-purple-600 font-bold text-center">
                  {showResult ? currentItem.blankWord : currentExerciseType === "listen-fill" ? "______" : "???"}
                </span>
              </span>
            );
          }
          return (
            <span key={i} className="inline-block mx-0.5">
              {word}
            </span>
          );
        })}
      </p>
    );
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => {
            setItems([]);
            setResults([]);
            setSessionDone(false);
          }}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" />
              {getModeLabel(currentExerciseType)}
            </span>
            <span>
              {currentIndex + 1} / {totalItems}
            </span>
          </div>
          <ProgressBar current={currentIndex + 1} total={totalItems} />
        </div>
        <button
          onClick={handleRestart}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Hint Card (Fill-blank only) ── */}
      {currentExerciseType === "fill-blank" && currentItem?.hint && !showResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3"
        >
          <Zap className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase text-amber-700 tracking-wide">
              Hint
            </p>
            <p className="text-sm font-medium text-amber-800">
              {currentItem.hint}
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Audio Player Card ── */}
      <motion.div
        key={currentItem?.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 mb-8"
      >
        {/* Mode Label */}
        <div className="text-center mb-6">
          <span
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-full",
              currentExerciseType === "sentence"
                ? "bg-blue-50 text-blue-600"
                : currentExerciseType === "fill-blank"
                ? "bg-amber-50 text-amber-600"
                : "bg-rose-50 text-rose-600"
            )}
          >
            {currentExerciseType === "sentence" ? "Type the full sentence" : currentExerciseType === "fill-blank" ? "Fill in the missing word (hint provided)" : "Listen and fill in the blank"}
          </span>
        </div>

        {/* Audio Button */}
        <div className="flex flex-col items-center">
          <AudioButton
            onClick={handlePlayAudio}
            isPlaying={isPlaying}
            disabled={loading}
          />
          <p className="text-sm text-slate-500 mt-4 font-medium">
            {isPlaying
              ? "🔊 Playing..."
              : playCount > 0
              ? `${playCount}× played`
              : "Press to listen"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            or press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Space</kbd>
          </p>
        </div>

        {/* Text Display (Fill-blank & Listen-fill, shown after answer) */}
        <AnimatePresence>
          {showResult && (currentExerciseType === "fill-blank" || currentExerciseType === "listen-fill") && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-slate-50 rounded-xl"
            >
              <p className="text-sm text-slate-500 mb-2 font-semibold">Full sentence:</p>
              <p className="text-lg text-slate-700 leading-relaxed">
                {currentItem.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Translation (shown after answer) */}
        <AnimatePresence>
          {showResult && currentItem?.translation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100"
            >
              <p className="text-sm text-green-600 font-semibold mb-1">Translation</p>
              <p className="text-slate-600">{currentItem.translation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Input Area ── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {(currentExerciseType === "fill-blank" || currentExerciseType === "listen-fill") && !showResult && (
          <div className="text-center mb-4">
            {renderBlankText()}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !showResult) {
                  handleSubmit();
                }
              }}
              disabled={showResult}
              placeholder={getPlaceholder(currentExerciseType)}
              className={cn(
                "w-full px-4 py-4 text-lg rounded-xl border-2 transition-all",
                "focus:outline-none focus:ring-4 focus:ring-purple-100",
                showResult
                  ? isCorrect
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-rose-300 bg-rose-50"
                  : "border-slate-200 bg-slate-50 focus:border-purple-400",
                showResult && "cursor-not-allowed"
              )}
            />

            {/* Result Icon */}
            {showResult && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isCorrect ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-8 h-8 text-rose-500" />
                    <span className="text-sm text-rose-600 font-semibold">
                      {currentItem?.blankWord}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-sm font-semibold"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>

            {!showResult ? (
              <button
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold text-white transition-all",
                  userAnswer.trim()
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:scale-[1.02]"
                    : "bg-slate-300 cursor-not-allowed"
                )}
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                {currentIndex + 1 >= totalItems ? "Finish" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Keyboard Shortcuts Hint ── */}
      <div className="mt-6 flex justify-center gap-6 text-xs text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-100 rounded font-mono">Space</kbd> Play audio
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-100 rounded font-mono">Enter</kbd>{" "}
          {showResult ? "Next" : "Check"}
        </span>
      </div>
    </div>
  );
}