import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, Volume2, Zap, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SpeakingPrompt, { SpeakingResult, SpeakingDifficulty } from "../../components/features/speaking/SpeakingPrompt";
import { toast } from "react-hot-toast";
import api from "../../lib/api";

// ─── Speaking Prompt Data ─────────────────────────────────────────────────────
interface SpeakingItem {
  id: string;
  prompt: string;
  translation: string;
  difficulty: SpeakingDifficulty;
  category: string;
}

// Sample prompts — in production these come from API
const SAMPLE_PROMPTS: SpeakingItem[] = [
  {
    id: "1",
    prompt: "The quick brown fox jumps over the lazy dog.",
    translation: "Con cáo nâu nhanh nhẹn nhảy qua con chó lười biếng.",
    difficulty: "beginner",
    category: "Pronunciation",
  },
  {
    id: "2",
    prompt: "She sells seashells by the seashore.",
    translation: "Cô ấy bán vỏ sò ở bãi biển.",
    difficulty: "beginner",
    category: "Pronunciation",
  },
  {
    id: "3",
    prompt: "How would you describe your hometown to someone who has never visited?",
    translation: "Bạn sẽ mô tả quê hương mình như thế nào cho người chưa từng đến đó?",
    difficulty: "intermediate",
    category: "Conversation",
  },
  {
    id: "4",
    prompt: "What are the advantages and disadvantages of working from home?",
    translation: "Những ưu điểm và nhược điểm của việc làm việc tại nhà là gì?",
    difficulty: "intermediate",
    category: "Discussion",
  },
  {
    id: "5",
    prompt: "In what ways has technology transformed the education sector over the past decade?",
    translation: "Công nghệ đã thay đổi ngành giáo dục như thế nào trong thập kỷ qua?",
    difficulty: "advanced",
    category: "Opinion",
  },
  {
    id: "6",
    prompt: "The weather today is absolutely wonderful, isn't it?",
    translation: "Thời tiết hôm nay thật tuyệt vời, phải không?",
    difficulty: "beginner",
    category: "Small Talk",
  },
  {
    id: "7",
    prompt: "If you could travel anywhere in the world, where would you go and why?",
    translation: "Nếu bạn có thể đi bất kỳ đâu trên thế giới, bạn sẽ đến đâu và tại sao?",
    difficulty: "intermediate",
    category: "Imagination",
  },
  {
    id: "8",
    prompt: "To what extent do you believe artificial intelligence will reshape professional environments in the next twenty years?",
    translation: "Bạn tin rằng trí tuệ nhân tạo sẽ thay đổi môi trường chuyên nghiệp trong hai mươi năm tới ở mức độ nào?",
    difficulty: "advanced",
    category: "Future",
  },
];

// ─── Session Stats ─────────────────────────────────────────────────────────────
interface SessionStats {
  total: number;
  completed: number;
  scores: number[];
  accuracies: number[];
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function SpeakingPage() {
  const navigate = useNavigate();
  
  const [prompts, setPrompts] = useState<SpeakingItem[]>(SAMPLE_PROMPTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: SAMPLE_PROMPTS.length,
    completed: 0,
    scores: [],
    accuracies: [],
  });
  const [sessionDone, setSessionDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPrompt = prompts[currentIndex];

  // ─── Load prompts from API (future) ─────────────────────────────────────────
  useEffect(() => {
    // TODO: fetch from /api/v1/speaking/prompts
    // const fetchPrompts = async () => {
    //   try {
    //     const res = await api.get("/api/v1/speaking/prompts");
    //     if (res.data.success) {
    //       setPrompts(res.data.data);
    //     }
    //   } catch (err) {
    //     console.error("Failed to load prompts", err);
    //   }
    // };
    // fetchPrompts();
  }, []);

  // ─── Handle completion ───────────────────────────────────────────────────────
  const handleComplete = (result: SpeakingResult) => {
    setSessionStats((prev) => ({
      total: prev.total,
      completed: prev.completed + 1,
      scores: [...prev.scores, result.pronunciationScore],
      accuracies: [...prev.accuracies, result.accuracy],
    }));
  };

  // ─── Navigation ──────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentIndex + 1 >= prompts.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSessionStats({
      total: prompts.length,
      completed: 0,
      scores: [],
      accuracies: [],
    });
    setSessionDone(false);
  };

  // ─── Session Completion Screen ───────────────────────────────────────────────
  if (sessionDone) {
    const avgScore = sessionStats.scores.length > 0
      ? Math.round(sessionStats.scores.reduce((a, b) => a + b, 0) / sessionStats.scores.length)
      : 0;
    const avgAccuracy = sessionStats.accuracies.length > 0
      ? Math.round(sessionStats.accuracies.reduce((a, b) => a + b, 0) / sessionStats.accuracies.length)
      : 0;
    const maxScore = Math.max(...sessionStats.scores, 0);

    return (
      <div className="max-w-2xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800">Speaking Practice</h2>
            <p className="text-base text-slate-500">Session Complete!</p>
          </div>
        </div>

        {/* Completion Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          {/* Trophy */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full blur-xl opacity-30" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-orange-200">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>

          <h3 className="text-3xl font-black text-slate-800 mb-2">
            Great job! 🎉
          </h3>
          <p className="text-slate-500 mb-8">
            You completed {sessionStats.completed} / {sessionStats.total} speaking exercises
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <p className="text-3xl font-black text-purple-600">{avgScore}%</p>
              <p className="text-xs font-semibold text-purple-400 mt-1">Avg Score</p>
            </div>
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <p className="text-3xl font-black text-indigo-600">{avgAccuracy}%</p>
              <p className="text-xs font-semibold text-indigo-400 mt-1">Accuracy</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-3xl font-black text-emerald-600">{maxScore}%</p>
              <p className="text-xs font-semibold text-emerald-400 mt-1">Best Score</p>
            </div>
          </div>

          {/* Score History */}
          <div className="flex justify-center gap-2 mb-8">
            {sessionStats.scores.map((score, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm"
              >
                {score}%
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/practice")}
              className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
            >
              Back to Practice
            </button>
            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Practice Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Practice View ─────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800">Speaking Practice</h2>
            <p className="text-base text-slate-500">Luyện nói với AI</p>
          </div>
        </div>

        {/* Session Progress */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500">Progress</p>
            <p className="text-sm font-black text-slate-700">
              {sessionStats.completed} / {sessionStats.total}
            </p>
          </div>
          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${(sessionStats.completed / sessionStats.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category & Counter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded-full border border-purple-200">
            {currentPrompt.category}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-500">
          {currentIndex + 1} / {prompts.length}
        </p>
      </div>

      {/* Speaking Prompt Component */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPrompt.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <SpeakingPrompt
            prompt={currentPrompt.prompt}
            translation={currentPrompt.translation}
            difficulty={currentPrompt.difficulty}
            onComplete={handleComplete}
            autoFocus
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Score dots */}
        <div className="flex gap-1.5">
          {prompts.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-purple-600 w-6"
                  : i < currentIndex
                  ? "bg-purple-300"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-md shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {currentIndex + 1 >= prompts.length ? "Finish" : "Skip"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tip */}
      <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700 mb-1">Pro Tip</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhấn "Listen" để nghe câu prompt trước. Sau đó nhấn mic và thử nói theo. 
              Bạn có thể nhấn "Try Again" để làm lại nếu chưa hài lòng với kết quả.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
