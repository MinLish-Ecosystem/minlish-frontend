import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, ChevronRight, CheckCircle2, Clock, XCircle, ArrowLeft, RotateCcw, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import Loading from "../../components/common/Loading";
import { getErrorMessage } from "../../lib/formErrors";

interface Question {
  type: "DICTATION" | "MULTIPLE_CHOICE" | "SCRAMBLE";
  word: string;
  questionText: string;
  options?: string[];
  correctAnswerIndex?: number;
  scrambledTokens?: string[];
  correctSentence?: string;
  audioUrl?: string;
  explanation: string;
}

interface Answer {
  questionIndex: number;
  userSpelling?: string;
  userChoice?: number;
  userSentence?: string;
}

export default function PracticeSession() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Timer state
  const [timeTaken, setTimeTaken] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // User input states
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [spellingInput, setSpellingInput] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [scrambleBuilt, setScrambleBuilt] = useState<string[]>([]);

  // Completion results state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [resultSummary, setResultSummary] = useState<{
    correctAnswers: number;
    totalQuestions: number;
    score: number;
    timeTaken: number;
  } | null>(null);

  // Modal confirm exit
  const [showExitModal, setShowExitModal] = useState(false);

  // Fetch challenge questions
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
        const response = await api.get(`/api/v1/practice/daily?timezone=${encodeURIComponent(timezone)}`);
        
        if (response.data.data.completed) {
          toast.error("You have already completed today's challenge!");
          navigate("/practice");
          return;
        }

        setQuestions(response.data.data.challenge.questions || []);
      } catch (error) {
        console.error("Failed to load challenge:", error);
        toast.error("Failed to load today's challenge. Please try again.");
        navigate("/practice");
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, [navigate]);

  // Start timer when questions are loaded and result is not shown
  useEffect(() => {
    if (questions.length > 0 && !resultSummary) {
      timerRef.current = setInterval(() => {
        setTimeTaken((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions, resultSummary]);

  // Reset inputs when question index changes
  useEffect(() => {
    setSpellingInput("");
    setSelectedChoice(null);
    setScrambleBuilt([]);
  }, [currentIdx]);

  const playAudio = (word: string, url?: string) => {
    if (window.speechSynthesis) {
      // Use client-side Web Speech API for 100% reliability and zero network latency
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } else if (url) {
      const audio = new Audio(url);
      audio.play().catch((err) => {
        console.error("Audio playback failed:", err);
        toast.error("Failed to play audio. Check your browser settings.");
      });
    }
  };

  const handleNext = () => {
    const currentQuestion = questions[currentIdx];
    let answerObj: Answer = { questionIndex: currentIdx };

    if (currentQuestion.type === "DICTATION") {
      answerObj.userSpelling = spellingInput;
    } else if (currentQuestion.type === "MULTIPLE_CHOICE") {
      if (selectedChoice === null) {
        toast.error("Please select an answer first.");
        return;
      }
      answerObj.userChoice = selectedChoice;
    } else if (currentQuestion.type === "SCRAMBLE") {
      if (scrambleBuilt.length === 0) {
        toast.error("Please click on tokens to build the sentence.");
        return;
      }
      answerObj.userSentence = scrambleBuilt.join(" ");
    }

    // Save answer
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionIndex !== currentIdx);
      return [...filtered, answerObj];
    });

    // Advance index or finish
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      handleSubmit([...answers.filter((a) => a.questionIndex !== currentIdx), answerObj]);
    }
  };

  const handleSubmit = async (finalAnswers: Answer[]) => {
    setSubmitLoading(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
      const payload = {
        timezone,
        timeTaken,
        answers: finalAnswers,
      };

      const response = await api.post("/api/v1/practice/submit", payload);
      setResultSummary(response.data.data);
      toast.success("Practice submitted successfully!");
    } catch (error) {
      console.error("Failed to submit score:", error);
      toast.error(getErrorMessage(error, "Failed to submit answers"));
      // Restart timer if submission failed so they can try again
      timerRef.current = setInterval(() => {
        setTimeTaken((prev) => prev + 1);
      }, 1000);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Scramble word helpers
  const handleTokenClick = (token: string, idx: number) => {
    setScrambleBuilt((prev) => [...prev, token]);
  };

  const handleBuiltTokenClick = (indexToRemove: number) => {
    setScrambleBuilt((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Get unused scramble tokens
  const getAvailableTokens = (tokens: string[]) => {
    const counts: Record<string, number> = {};
    scrambleBuilt.forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    });

    return tokens.filter((t) => {
      if (counts[t] && counts[t] > 0) {
        counts[t]--;
        return false;
      }
      return true;
    });
  };

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto py-24 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  // RENDER: Completion Score Screen
  if (resultSummary) {
    return (
      <div className="max-w-[600px] mx-auto pb-12 pt-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-2">Challenge Completed!</h2>
          <p className="text-slate-500 text-sm mb-8">
            Your results have been locked into today's leaderboard.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 w-full mb-8">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-2xl font-black text-purple-600 block">
                {resultSummary.correctAnswers}/{resultSummary.totalQuestions}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">
                Correct
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-2xl font-black text-purple-600 block">
                {formatTimer(resultSummary.timeTaken)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">
                Time
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 col-span-1">
              <span className="text-2xl font-black text-purple-600 block">
                {resultSummary.score.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">
                Score
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/practice")}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-extrabold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Go to Leaderboard
          </button>
        </div>
      </div>
    );
  }

  // RENDER: Daily Quiz Questions
  const currentQuestion = questions[currentIdx];
  if (!currentQuestion) return null;

  return (
    <div className="max-w-[720px] mx-auto pb-12 pt-4">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowExitModal(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <Clock className="w-4 h-4 text-slate-400" />
            {formatTimer(timeTaken)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full mb-8 overflow-hidden border border-slate-200/40">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300 rounded-full"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* RENDER QUESTION CARD */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md min-h-[380px] flex flex-col justify-between">
        
        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center mb-8">
          
          {/* Question Type Badge */}
          <div className="mb-4">
            <span className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
              {currentQuestion.type === "DICTATION"
                ? "🎙 Dictation Test"
                : currentQuestion.type === "MULTIPLE_CHOICE"
                ? "☑ Multiple Choice"
                : "🔀 Scrambled Sentence"}
            </span>
          </div>

          {/* Dạng 1: DICTATION */}
          {currentQuestion.type === "DICTATION" && (
            <div className="space-y-6 text-center">
              <p className="text-slate-500 text-sm italic">
                Listen to the spelling clue and fill in the missing word.
              </p>
              
              <button
                onClick={() => playAudio(currentQuestion.word, currentQuestion.audioUrl)}
                className="w-16 h-16 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 flex items-center justify-center mx-auto transition-colors cursor-pointer border border-purple-200 shadow-sm"
                title="Play spelling"
              >
                <Volume2 className="w-8 h-8" />
              </button>

              <h4 className="text-xl font-bold text-slate-800 tracking-wide mt-4">
                {currentQuestion.questionText}
              </h4>

              <input
                type="text"
                value={spellingInput}
                onChange={(e) => setSpellingInput(e.target.value)}
                placeholder="Type spelling here..."
                autoFocus
                className="max-w-xs w-full text-center py-3.5 px-4 rounded-2xl border-2 border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg font-bold"
              />
            </div>
          )}

          {/* Dạng 2: MULTIPLE_CHOICE */}
          {currentQuestion.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-slate-800 leading-relaxed">
                {currentQuestion.questionText}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {currentQuestion.options?.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedChoice(idx)}
                    className={`p-4 rounded-2xl border-2 text-left text-sm font-semibold transition-all cursor-pointer ${
                      selectedChoice === idx
                        ? "border-purple-600 bg-purple-50 text-purple-950 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="inline-block w-6 h-6 rounded-lg bg-slate-100 text-slate-500 font-extrabold text-center leading-6 text-xs mr-3">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dạng 3: SCRAMBLE */}
          {currentQuestion.type === "SCRAMBLE" && (
            <div className="space-y-6">
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 text-center">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider block mb-1">Vietnamese Clue</span>
                <span className="text-base font-bold text-purple-950">{currentQuestion.questionText}</span>
              </div>

              {/* built sentence preview */}
              <div className="min-h-[70px] border-2 border-slate-100 rounded-2xl p-4 flex flex-wrap gap-2.5 items-center bg-slate-50/30">
                {scrambleBuilt.length === 0 ? (
                  <span className="text-slate-400 text-sm font-medium italic mx-auto">
                    Click word blocks below to construct the sentence...
                  </span>
                ) : (
                  scrambleBuilt.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleBuiltTokenClick(idx)}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {word}
                      <XCircle className="w-3.5 h-3.5 text-purple-200" />
                    </button>
                  ))
                )}
              </div>

              {/* scrambled tokens pool */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2.5">
                {getAvailableTokens(currentQuestion.scrambledTokens || []).map((token, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTokenClick(token, idx)}
                    className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    {token}
                  </button>
                ))}
              </div>

              {scrambleBuilt.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setScrambleBuilt([])}
                    className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear Sentence
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Next Button */}
        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <button
            onClick={handleNext}
            disabled={submitLoading}
            className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-extrabold rounded-2xl shadow-md transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {currentIdx === questions.length - 1 ? (submitLoading ? "Submitting..." : "Finish Challenge") : "Next Question"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-100">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-1">Exit Practice Quiz?</h4>
            <p className="text-slate-500 text-sm mb-6">
              You will lose your progress and won't be able to submit today's score if you exit now.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate("/practice")}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Exit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
