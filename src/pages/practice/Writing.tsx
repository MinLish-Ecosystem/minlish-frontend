import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, CheckCircle2, ChevronRight, RotateCcw, 
  Sparkles, Target, Trophy, BookOpen, PenTool, FileText, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import Loading from "../../components/common/Loading";
import { getErrorMessage } from "../../lib/formErrors";

// ─── Types ──────────────────────────────────────────────────────────────────

type ExamType = "ielts" | "toeic";
type WritingTask = "email" | "letter" | "essay" | "report" | "picture" | "sentence";

interface WritingQuestion {
  id: string;
  examType: ExamType;        // "ielts" | "toeic"
  taskType: WritingTask;     // Dạng bài cụ thể
  title: string;             // Tiêu đề bài tập
  prompt: string;            // Đề bài/ ситуация
  instructions: string;      // Yêu cầu cụ thể
  wordLimit: number;         // Số từ tối thiểu
  suggestedVocab?: string[]; // Từ vựng gợi ý
  sampleAnswer?: string;     // Đáp án mẫu (sau khi nộp)
}

interface UserAnswer {
  questionId: string;
  userText: string;
  wordCount: number;
  submittedAt: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Writing() {
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState<ExamType>("toeic"); // Mặc định TOEIC
  const [questions, setQuestions] = useState<WritingQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userText, setUserText] = useState("");
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [showSample, setShowSample] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Stats
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Fetch questions từ API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Gọi API với examType
        const response = await api.get(`/api/v1/practice/writing?examType=${examType}`);
        
        if (response.data.data && response.data.data.length > 0) {
          setQuestions(response.data.data);
        } else {
          // Fallback: Tạo mock questions nếu API chưa có
          setQuestions(generateMockQuestions(examType));
        }
      } catch (error) {
        console.error("Failed to fetch writing questions:", error);
        // Fallback: Tạo mock questions
        setQuestions(generateMockQuestions(examType));
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [examType]);

  // Reset when exam type changes
  useEffect(() => {
    setCurrentIdx(0);
    setUserText("");
    setAnswers([]);
    setShowSample(false);
    setTotalAnswered(0);
  }, [examType]);

  // Reset when question changes
  useEffect(() => {
    setUserText("");
    setShowSample(false);
  }, [currentIdx]);

  // Generate mock questions for demo
  const generateMockQuestions = (type: ExamType): WritingQuestion[] => {
    if (type === "toeic") {
      return [
        {
          id: "toeic-email-1",
          examType: "toeic",
          taskType: "email",
          title: "Email Response - Work Scenario",
          prompt: "Your colleague has sent you an email asking for help with a project deadline. They are worried about completing the work on time and have requested your assistance.",
          instructions: "Write a response email (40-50 words) addressing your colleague's concerns and offering help.",
          wordLimit: 50,
          suggestedVocab: ["deadline", "assistance", "support", "priority", "schedule", "deadline", "complete", "task"],
          sampleAnswer: "Dear Sarah,\n\nThank you for reaching out. I understand your concerns about the deadline. I would be happy to help you prioritize the tasks. Let's meet tomorrow to discuss how I can assist.\n\nBest regards,\n[Your Name]"
        },
        {
          id: "toeic-email-2",
          examType: "toeic",
          taskType: "email",
          title: "Email Response - Customer Complaint",
          prompt: "A customer has emailed your company complaining about a delayed order and poor customer service.",
          instructions: "Write a response email (40-50 words) apologizing and explaining the steps you will take to resolve the issue.",
          wordLimit: 50,
          suggestedVocab: ["apologize", "delay", "inconvenience", "resolve", "refund", "shipment", "customer service"],
          sampleAnswer: "Dear Mr. Johnson,\n\nWe sincerely apologize for the delay and the poor service you received. We are processing your refund immediately and will ship a replacement within 24 hours. Please accept our sincere apologies.\n\nSincerely,\nCustomer Service Team"
        },
        {
          id: "toeic-email-3",
          examType: "toeic",
          taskType: "email",
          title: "Email Response - Meeting Request",
          prompt: "Your manager has requested a meeting to discuss the upcoming project changes and your new responsibilities.",
          instructions: "Write a response email (40-50 words) confirming your availability and expressing your enthusiasm for the changes.",
          wordLimit: 50,
          suggestedVocab: ["meeting", "schedule", "available", "enthusiastic", "project", "responsibilities", "discuss"],
          sampleAnswer: "Dear Manager,\n\nThank you for informing me about the meeting. I am available Thursday at 2 PM and look forward to discussing the new project responsibilities.\n\nBest regards,\n[Your Name]"
        }
      ];
    } else {
      return [
        {
          id: "ielts-essay-1",
          examType: "ielts",
          taskType: "essay",
          title: "IELTS Task 2 - Opinion Essay",
          prompt: "Some people believe that universities should focus on providing academic knowledge, while others think they should also teach practical skills for employment.",
          instructions: "Discuss both views and give your own opinion. Write at least 250 words.",
          wordLimit: 250,
          suggestedVocab: ["academic", "practical skills", "employment", "curriculum", "graduate", "career", "theoretical", "hands-on"],
          sampleAnswer: "In contemporary education, there is an ongoing debate about whether universities should prioritize academic knowledge or practical skills for employment.\n\nOn one hand, proponents of academic education argue that universities should maintain their traditional focus on theoretical knowledge..."
        },
        {
          id: "ielts-essay-2",
          examType: "ielts",
          taskType: "essay",
          title: "IELTS Task 2 - Advantages & Disadvantages",
          prompt: "Technology has made it easier for people to work from home. Do the advantages outweigh the disadvantages?",
          instructions: "Discuss the advantages and disadvantages and give your opinion. Write at least 250 words.",
          wordLimit: 250,
          suggestedVocab: ["remote work", "technology", "flexibility", "isolation", "productivity", "work-life balance", "communication"],
          sampleAnswer: "The rise of technology has revolutionized the way people work, with an increasing number of employees choosing to work from home..."
        },
        {
          id: "ielts-report-1",
          examType: "ielts",
          taskType: "report",
          title: "IELTS Task 1 - Graph Description",
          prompt: "The graph below shows the number of students enrolling in different university courses between 2010 and 2020. Summarize the information by selecting and reporting the main features.",
          instructions: "Write at least 150 words describing the trends shown in the graph.",
          wordLimit: 150,
          suggestedVocab: ["increased", "decreased", "fluctuated", "significant", "gradual", "dramatic", "trend", "statistics"],
          sampleAnswer: "The graph illustrates the enrollment patterns across various university courses over a ten-year period from 2010 to 2020..."
        },
        {
          id: "ielts-letter-1",
          examType: "ielts",
          taskType: "letter",
          title: "IELTS General Training - Formal Letter",
          prompt: "You recently stayed at a hotel and left an item of importance in your room. Write a letter to the hotel manager requesting them to locate and return your item.",
          instructions: "Write a formal letter of at least 150 words. Include: what item you left, when you stayed, and what you would like the hotel to do.",
          wordLimit: 150,
          suggestedVocab: ["accommodation", "residence", "luggage", "valuables", "grateful", "compensation", "contact details"],
          sampleAnswer: "Dear Hotel Manager,\n\nI am writing to request your assistance in locating a valuable item I believe I left in my room during my recent stay at your hotel..."
        }
      ];
    }
  };

  // Word count
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!userText.trim()) {
      toast.error("Vui lòng viết bài trước khi nộp!");
      return;
    }

    const wordCount = getWordCount(userText);
    const currentQuestion = questions[currentIdx];

    if (wordCount < currentQuestion.wordLimit * 0.5) {
      toast.error(`Bài viết quá ngắn! Cần ít nhất ${Math.floor(currentQuestion.wordLimit * 0.5)} từ.`);
      return;
    }

    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      userText: userText.trim(),
      wordCount,
      submittedAt: new Date().toISOString(),
    };

    setAnswers((prev) => [...prev, answer]);
    setTotalAnswered((prev) => prev + 1);
    setShowSample(true);
    toast.success("Bài đã được nộp!");
  };

  // Next question
  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      toast.success("Bạn đã hoàn thành tất cả bài tập!");
    }
  };

  // Reset all
  const handleReset = () => {
    setCurrentIdx(0);
    setUserText("");
    setAnswers([]);
    setTotalAnswered(0);
    setShowSample(false);
  };

  // Change exam type
  const handleExamTypeChange = (type: ExamType) => {
    if (type !== examType) {
      setExamType(type);
      setLoading(true);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto py-24 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <div className="max-w-[900px] mx-auto py-24 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Không có câu hỏi</h2>
        <p className="text-slate-500 mb-6">Vui lòng thử lại sau!</p>
        <button
          onClick={() => navigate("/practice")}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
        >
          Quay về Practice
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const wordCount = getWordCount(userText);
  const isLastQuestion = currentIdx === questions.length - 1;
  const progress = ((currentIdx + 1) / questions.length) * 100;
  const isUnderLimit = wordCount < currentQuestion.wordLimit;

  return (
    <div className="max-w-[900px] mx-auto pb-12 pt-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/practice")}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full">
            Bài {currentIdx + 1} / {questions.length}
          </span>
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <Target className="w-4 h-4 text-emerald-500" />
            Đã nộp: {totalAnswered}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full mb-8 overflow-hidden border border-slate-200/40">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md min-h-[600px] flex flex-col">
        
        {/* Exam Type Selector */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => handleExamTypeChange("toeic")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              examType === "toeic"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            TOEIC
          </button>
          <button
            onClick={() => handleExamTypeChange("ielts")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              examType === "ielts"
                ? "bg-amber-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            IELTS
          </button>
        </div>

        {/* ── PHẦN TRÊN: CÂU HỎI/ĐỀ BÀI ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg ${
              examType === "ielts" 
                ? "bg-amber-50 text-amber-700 border border-amber-100"
                : "bg-blue-50 text-blue-700 border border-blue-100"
            }`}>
              {examType.toUpperCase()} Writing
            </span>
            <span className="px-3 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-600 uppercase">
              {currentQuestion.taskType === "email" ? "📧 Email" :
               currentQuestion.taskType === "essay" ? "📝 Essay" :
               currentQuestion.taskType === "report" ? "📊 Report" :
               currentQuestion.taskType === "letter" ? "✉️ Letter" :
               "📝 Writing"}
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-3">
            {currentQuestion.title}
          </h3>
        </div>

        {/* Prompt Box */}
        <div className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-2xl p-6 mb-4 border border-slate-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {currentQuestion.prompt}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block mb-1">
            📋 Yêu cầu
          </span>
          <p className="text-sm text-blue-800 font-medium">
            {currentQuestion.instructions}
          </p>
        </div>

        {/* Suggested Vocabulary */}
        {currentQuestion.suggestedVocab && currentQuestion.suggestedVocab.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-2">
              💡 Từ vựng gợi ý
            </span>
            <div className="flex flex-wrap gap-2">
              {currentQuestion.suggestedVocab.map((word, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── PHẦN DƯỚI: Ô VIẾT BÀI ── */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Viết bài của bạn:
            </label>
            <div className={`text-sm font-bold ${
              isUnderLimit ? "text-amber-600" : "text-emerald-600"
            }`}>
              Số từ: {wordCount} / {currentQuestion.wordLimit}
            </div>
          </div>

          <textarea
            value={userText}
            onChange={(e) => !showSample && setUserText(e.target.value)}
            disabled={showSample}
            placeholder={`Bắt đầu viết bài ${examType.toUpperCase()} của bạn ở đây...`}
            className={`flex-1 w-full p-5 rounded-2xl border-2 outline-none transition-all resize-none min-h-[250px] ${
              showSample
                ? "bg-slate-50 border-slate-200 text-slate-600"
                : "border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-slate-800 font-medium leading-relaxed"
            }`}
          />

          {/* Sample Answer */}
          {showSample && currentQuestion.sampleAnswer && (
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">Đáp án mẫu (tham khảo)</span>
              </div>
              <p className="text-sm text-emerald-800 whitespace-pre-line leading-relaxed">
                {currentQuestion.sampleAnswer}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 pt-6 mt-6">
          {!showSample ? (
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!userText.trim()}
                className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-extrabold rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Sparkles className="w-5 h-5" />
                Nộp bài
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              {isLastQuestion ? (
                <>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Làm lại từ đầu
                  </button>
                  <button
                    onClick={() => navigate("/practice")}
                    className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trophy className="w-5 h-5" />
                    Hoàn thành
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Bài tiếp theo
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Completion Banner */}
      {totalAnswered === questions.length && (
        <div className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 text-white text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-300" />
          <h3 className="text-2xl font-black mb-2">Hoàn thành bài luyện tập!</h3>
          <p className="text-purple-200 mb-4">
            Bạn đã nộp {totalAnswered}/{questions.length} bài
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-white/20 hover:bg-white/30 font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Làm lại tất cả
          </button>
        </div>
      )}
    </div>
  );
}