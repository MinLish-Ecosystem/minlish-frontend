import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Sparkles, BookOpen, RotateCcw, List } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SpeakingCard, SpeakingCardProps, SpeakingResult } from "../../components/features/speaking";
import { toast } from "react-hot-toast";

// ─── Types ──────────────────────────────────────────────────────────────────
interface SpeakingTopic {
  id: string;
  title: string;
  translation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  tips?: string[];
}

// ─── Sample Topics ───────────────────────────────────────────────────────────
const SAMPLE_TOPICS: SpeakingTopic[] = [
  {
    id: "1",
    title: "What is your favorite hobby and why do you enjoy it?",
    translation: "Sở thích yêu thích của bạn là gì và tại sao bạn thích nó?",
    difficulty: "beginner",
    category: "Personal",
    tips: ["Try to speak for at least 30 seconds", "Use simple sentences", "Mention at least one reason"]
  },
  {
    id: "2",
    title: "Describe your hometown to someone who has never visited.",
    translation: "Mô tả quê hương của bạn cho người chưa từng đến đó.",
    difficulty: "intermediate",
    category: "Description",
    tips: ["Include details about location, culture, and food", "Speak naturally at a moderate pace"]
  },
  {
    id: "3",
    title: "What are the advantages and disadvantages of working from home?",
    translation: "Những ưu điểm và nhược điểm của việc làm việc tại nhà là gì?",
    difficulty: "intermediate",
    category: "Opinion",
    tips: ["Give balanced viewpoints", "Use transitional phrases like 'On the other hand...'"]
  },
  {
    id: "4",
    title: "How has technology changed the way we communicate over the past decade?",
    translation: "Công nghệ đã thay đổi cách chúng ta giao tiếp như thế nào trong thập kỷ qua?",
    difficulty: "advanced",
    category: "Discussion",
    tips: ["Use advanced vocabulary", "Structure your answer with introduction, body, and conclusion"]
  },
  {
    id: "5",
    title: "If you could travel anywhere in the world, where would you go and why?",
    translation: "Nếu bạn có thể đi bất kỳ đâu trên thế giới, bạn sẽ đến đâu và tại sao?",
    difficulty: "intermediate",
    category: "Imagination",
    tips: ["Express your excitement", "Give specific reasons for your choice"]
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SpeakingTopicPage() {
  const navigate = useNavigate();
  
  const [topics] = useState<SpeakingTopic[]>(SAMPLE_TOPICS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTopics, setShowTopics] = useState(false);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [sessionResults, setSessionResults] = useState<Map<string, SpeakingResult>>(new Map());

  const currentTopic = topics[currentIndex];

  // ─── Handle Transcript ─────────────────────────────────────────────────────
  const handleTranscript = (transcript: string, result?: SpeakingResult) => {
    if (result) {
      setSessionResults(prev => new Map(prev).set(currentTopic.id, result));
      setCompletedTopics(prev => new Set(prev).add(currentTopic.id));
    }
  };

  // ─── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentIndex < topics.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast.success("Bạn đã hoàn thành tất cả các bài tập! 🎉");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSelectTopic = (index: number) => {
    setCurrentIndex(index);
    setShowTopics(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCompletedTopics(new Set());
    setSessionResults(new Map());
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const completedCount = completedTopics.size;
  const totalCount = topics.length;
  const progressPercent = (completedCount / totalCount) * 100;

  const avgScore = sessionResults.size > 0
    ? Math.round(
        Array.from(sessionResults.values())
          .reduce((sum, r) => sum + r.accuracy, 0) / sessionResults.size
      )
    : 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-cyan-50/30 pb-12">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-slate-100 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-800">Luyện nói theo chủ đề</h2>
                <p className="text-xs text-slate-500">Speaking Practice</p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500">Hoàn thành</p>
                <p className="text-sm font-black text-slate-700">
                  {completedCount} / {totalCount}
                </p>
              </div>
              <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
                />
              </div>
              <button
                onClick={() => setShowTopics(!showTopics)}
                className={`p-2.5 rounded-xl transition-all ${
                  showTopics 
                    ? "bg-violet-100 text-violet-600" 
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Topics List (Slide down) */}
      <AnimatePresence>
        {showTopics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-2xl mx-auto px-4 pt-4 overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <h4 className="font-bold text-slate-700 text-sm">Danh sách chủ đề</h4>
              </div>
              <div className="divide-y divide-slate-100">
                {topics.map((topic, index) => {
                  const isActive = index === currentIndex;
                  const isCompleted = completedTopics.has(topic.id);
                  const result = sessionResults.get(topic.id);
                  
                  return (
                    <button
                      key={topic.id}
                      onClick={() => handleSelectTopic(index)}
                      className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                        isActive ? "bg-violet-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Status Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted 
                            ? "bg-emerald-100 text-emerald-600"
                            : isActive
                            ? "bg-violet-100 text-violet-600"
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          {isCompleted ? (
                            <Sparkles className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isActive ? "text-violet-700" : "text-slate-700"
                          }`}>
                            {topic.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              topic.difficulty === "beginner" ? "bg-emerald-50 text-emerald-600" :
                              topic.difficulty === "intermediate" ? "bg-amber-50 text-amber-600" :
                              "bg-red-50 text-red-600"
                            }`}>
                              {topic.difficulty}
                            </span>
                            {isCompleted && result && (
                              <span className="text-[10px] font-bold text-emerald-600">
                                {result.accuracy}% ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Topic Counter & Category */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-violet-50 text-violet-600 text-xs font-bold rounded-full border border-violet-200">
              {currentTopic.category}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {currentIndex + 1} / {topics.length}
          </p>
        </div>

        {/* Speaking Card Component */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTopic.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <SpeakingCard
              topic={currentTopic.title}
              translation={currentTopic.translation}
              difficulty={currentTopic.difficulty}
              onTranscript={handleTranscript}
              onListen={() => toast.success("🔊 Đang phát đề bài...")}
              className="mb-6"
            />
          </motion.div>
        </AnimatePresence>

        {/* Tips (if any) */}
        {currentTopic.tips && currentTopic.tips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">💡 Gợi ý:</p>
                <ul className="space-y-1.5">
                  {currentTopic.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-violet-400 font-bold">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>

          {/* Progress Dots */}
          <div className="flex gap-1.5">
            {topics.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIndex
                    ? "bg-violet-600 w-6"
                    : completedTopics.has(topics[i].id)
                    ? "bg-emerald-400"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-violet-200 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {currentIndex + 1 >= topics.length ? "Finish" : "Skip"}
            →
          </button>
        </div>

        {/* Session Summary (if has results) */}
        {sessionResults.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-5 bg-white rounded-2xl border border-slate-200"
          >
            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              Kết quả phiên tập
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-violet-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-violet-600">{avgScore}%</p>
                <p className="text-xs font-semibold text-violet-400">Điểm TB</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
                <p className="text-xs font-semibold text-emerald-400">Đã hoàn thành</p>
              </div>
            </div>

            {/* Restart Button */}
            <button
              onClick={handleRestart}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Bắt đầu lại
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
