import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trophy,
  XCircle,
  RefreshCw,
  BookOpen,
  BarChart3,
  Clock,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import type {
  ReadingQuestion,
  QuestionResult,
  ReadingQuestionProps,
} from "./types";
import ReadingQuestion from "./ReadingQuestion";

// ─── Question Type Badge ────────────────────────────────────────────────────────
function QuestionTypeBadge({ type }: { type: ReadingQuestion["type"] }) {
  const config: Record<ReadingQuestion["type"], { label: string; color: string }> = {
    "short-sentence-mcq": { label: "Sentence Completion", color: "bg-purple-50 text-purple-600 border-purple-200" },
    "main-idea-mcq": { label: "Main Idea", color: "bg-blue-50 text-blue-600 border-blue-200" },
    "word-bank-fill": { label: "Word Bank", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  };
  const { label, color } = config[type];
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", color)}>
      {label}
    </span>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Question Navigator Pills ───────────────────────────────────────────────────
function QuestionNav({
  total,
  current,
  results,
  onNavigate,
}: {
  total: number;
  current: number;
  results: QuestionResult[];
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => {
        const result = results[i];
        let style = "border-slate-200 bg-white text-slate-600 hover:bg-purple-50 hover:border-purple-300";
        if (result) {
          style = result.isCorrect
            ? "border-emerald-400 bg-emerald-50 text-emerald-600"
            : "border-rose-400 bg-rose-50 text-rose-600";
        }
        if (i === current) {
          style = "border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-200";
        }

        return (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={cn(
              "w-9 h-9 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center",
              style
            )}
          >
            {result ? (
              result.isCorrect ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )
            ) : (
              i + 1
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Completion Screen ──────────────────────────────────────────────────────────
function CompletionScreen({
  results,
  total,
  onRestart,
  onExit,
}: {
  results: QuestionResult[];
  total: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const correct = results.filter(r => r.isCorrect).length;
  const incorrect = results.filter(r => !r.isCorrect).length;
  const masteryPct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalTime = results.reduce((acc, r) => acc + r.timeSpent, 0);
  const avgTimePerQ = total > 0 ? Math.round(totalTime / total / 1000) : 0;

  const getGrade = (pct: number) => {
    if (pct >= 90) return { emoji: "🏆", label: "Excellent!", color: "text-emerald-500" };
    if (pct >= 70) return { emoji: "🌟", label: "Good job!", color: "text-blue-500" };
    if (pct >= 50) return { emoji: "💪", label: "Keep practicing!", color: "text-amber-500" };
    return { emoji: "📚", label: "Need more practice", color: "text-rose-500" };
  };

  const grade = getGrade(masteryPct);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12">
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative mb-6"
      >
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-2xl shadow-orange-200">
          <Trophy className="w-14 h-14 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      {/* Grade */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-6xl mb-2">{grade.emoji}</p>
        <h2 className={cn("text-3xl font-black mb-1", grade.color)}>{grade.label}</h2>
        <p className="text-slate-500 text-sm mb-8">
          You answered <span className="font-bold text-slate-700">{correct}</span> out of{" "}
          <span className="font-bold text-slate-700">{total}</span> questions correctly
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-4 w-full max-w-md mb-8"
      >
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl py-4 px-3 text-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-emerald-600">{correct}</p>
          <p className="text-[11px] font-semibold text-emerald-400">Correct</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl py-4 px-3 text-center">
          <XCircle className="w-6 h-6 text-rose-500 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-rose-600">{incorrect}</p>
          <p className="text-[11px] font-semibold text-rose-400">Incorrect</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl py-4 px-3 text-center">
          <BarChart3 className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-purple-600">{masteryPct}%</p>
          <p className="text-[11px] font-semibold text-purple-400">Score</p>
        </div>
      </motion.div>

      {/* Mastery Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md mb-4"
      >
        <div className="flex justify-between text-sm font-semibold text-slate-500 mb-2">
          <span>Accuracy</span>
          <span className="text-purple-600 font-bold">{masteryPct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${masteryPct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Avg time */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 text-sm text-slate-400 mb-8"
      >
        <Clock className="w-4 h-4" />
        <span>Average <strong className="text-slate-600">{avgTimePerQ}s</strong> per question</span>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3 w-full max-w-md"
      >
        <button
          onClick={onExit}
          className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
        >
          Exit
        </button>
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    </div>
  );
}

// ─── Main ReadingPractice Component ────────────────────────────────────────────

interface ReadingPracticeProps {
  /** Danh sách câu hỏi */
  questions: ReadingQuestion[];
  /** Tiêu đề bài reading */
  title?: string;
  /** Mô tả */
  description?: string;
  /** Callback khi hoàn thành */
  onComplete?: (results: QuestionResult[]) => void;
  /** Callback khi exit */
  onExit?: () => void;
  /** ClassName override */
  className?: string;
}

export default function ReadingPractice({
  questions,
  title = "Reading Practice",
  description,
  onComplete,
  onExit,
  className,
}: ReadingPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submittedSet, setSubmittedSet] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [wordSelections, setWordSelections] = useState<Record<string, Record<string, string>>>({});
  const [isComplete, setIsComplete] = useState(false);
  const questionStartTimeRef = useRef<number>(Date.now());

  const total = questions.length;
  const currentQuestion = questions[currentIndex];

  // Reset timer when question changes
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isComplete) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (currentIndex < total - 1) {
          handleNext();
        }
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (currentIndex > 0) {
          handlePrev();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex, total, isComplete]);

  const handleSelectAnswer = useCallback((questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleSelectWord = useCallback((questionId: string, blankId: string, word: string) => {
    setWordSelections(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] ?? {}),
        [blankId]: word,
      },
    }));
  }, []);

  const handleSubmit = useCallback((questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const timeSpent = Date.now() - questionStartTimeRef.current;
    let selectedAnswer: string | null = selectedAnswers[questionId] ?? null;
    let isCorrect = false;

    if (question.type === "word-bank-fill") {
      const sel = wordSelections[questionId] ?? {};
      selectedAnswer = JSON.stringify(sel);
      isCorrect = Object.keys(question.correctMapping).every(
        blankId => sel[blankId] === question.correctMapping[blankId]
      );
    } else {
      isCorrect = selectedAnswer === question.correctAnswer;
    }

    const result: QuestionResult = {
      questionId,
      selectedAnswer,
      isCorrect,
      timeSpent,
    };

    setResults(prev => {
      const existing = prev.findIndex(r => r.questionId === questionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });

    setSubmittedSet(prev => new Set([...prev, questionId]));
  }, [questions, selectedAnswers, wordSelections]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      // Complete
      setIsComplete(true);
      if (onComplete) {
        const finalResults = questions.map(q => {
          const existing = results.find(r => r.questionId === q.id);
          if (existing) return existing;
          // Unanswered questions
          return {
            questionId: q.id,
            selectedAnswer: null,
            isCorrect: false,
            timeSpent: 0,
          };
        });
        onComplete(finalResults);
      }
    }
  }, [currentIndex, total, results, questions, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setSubmittedSet(new Set());
    setResults([]);
    setSelectedAnswers({});
    setWordSelections({});
    setIsComplete(false);
    questionStartTimeRef.current = Date.now();
  };

  const getIsCorrect = (questionId: string): boolean | undefined => {
    const result = results.find(r => r.questionId === questionId);
    return result?.isCorrect;
  };

  // ── Complete Screen ──
  if (isComplete) {
    return (
      <div className={cn("max-w-2xl mx-auto pb-12", className)}>
        <CompletionScreen
          results={results}
          total={total}
          onRestart={handleRestart}
          onExit={onExit ?? (() => {})}
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={cn("max-w-2xl mx-auto pb-12 flex items-center justify-center min-h-[300px]", className)}>
        <p className="text-slate-400 font-medium">No questions available.</p>
      </div>
    );
  }

  const isCurrentSubmitted = submittedSet.has(currentQuestion.id);

  return (
    <div className={cn("max-w-2xl mx-auto pb-12", className)}>
      {/* Header */}
      <div className="mb-6">
        {/* Title */}
        {(title || description) && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            </div>
            {description && (
              <p className="text-sm text-slate-500 ml-7">{description}</p>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-500">
            Question {currentIndex + 1} of {total}
          </span>
          <QuestionTypeBadge type={currentQuestion.type} />
        </div>
        <ProgressBar current={currentIndex + 1} total={total} />
      </div>

      {/* Question Navigator */}
      <div className="mb-6">
        <QuestionNav
          total={total}
          current={currentIndex}
          results={results}
          onNavigate={setCurrentIndex}
        />
      </div>

      {/* Question Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <ReadingQuestion
            question={currentQuestion}
            isSubmitted={isCurrentSubmitted}
            isCorrect={isCurrentSubmitted ? getIsCorrect(currentQuestion.id) : undefined}
            selectedAnswer={selectedAnswers[currentQuestion.id]}
            wordSelections={wordSelections[currentQuestion.id]}
            onSelectAnswer={handleSelectAnswer}
            onSelectWord={handleSelectWord}
            onSubmit={handleSubmit}
            onNext={handleNext}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
            currentIndex === 0
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!isCurrentSubmitted}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
            isCurrentSubmitted
              ? "bg-slate-800 text-white hover:bg-slate-700"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          {currentIndex === total - 1 ? "Finish" : "Next"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
