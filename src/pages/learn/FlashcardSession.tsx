import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchSetDetail, type Word as VocabWord } from "../../store/slices/vocabSlice";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "motion/react";
import {
  X,
  RotateCcw,
  Volume2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trophy,
  BookOpen,
  Zap,
  Timer,
  Shuffle,
  SkipForward,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type SRSRating = "again" | "hard" | "good" | "easy";

interface PendingReview {
  wordId: string;
  setId: string;
  rating: SRSRating;
  timeSpent: number;
  reviewedAt: string;
}

interface CardState {
  word: VocabWord;
  isFlipped: boolean;
  rating?: SRSRating;
}

interface SessionStats {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const speak = (text: string) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US";
    window.speechSynthesis.speak(utt);
  }
};

const playAudio = (audioUrl?: string, word?: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      if (word) speak(word);
    });
  } else if (word) {
    speak(word);
  }
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SRSButton({
  label,
  sublabel,
  color,
  onClick,
}: {
  label: string;
  sublabel: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-3 px-2 rounded-2xl font-bold transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm ${color}`}
    >
      <span className="text-sm font-bold">{label}</span>
      <span className="text-[10px] mt-0.5 opacity-70 font-medium">{sublabel}</span>
    </button>
  );
}

function CompletionScreen({
  stats,
  total,
  setName,
  onRestart,
  onExit,
}: {
  stats: SessionStats;
  total: number;
  setName: string;
  onRestart: () => void;
  onExit: () => void;
}) {
  const masteryPct = Math.round(((stats.good + stats.easy) / total) * 100);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-2xl shadow-orange-200">
          <Trophy className="w-14 h-14 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-slate-800 mb-2">Session Complete! 🎉</h2>
      <p className="text-slate-500 mb-8">
        You reviewed <span className="font-bold text-slate-700">{total} words</span> from{" "}
        <span className="font-semibold text-purple-600">"{setName}"</span>
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-md mb-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl py-4 px-2 text-center">
          <p className="text-2xl font-bold text-red-500">{stats.again}</p>
          <p className="text-[11px] font-semibold text-red-400 mt-1">Again</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl py-4 px-2 text-center">
          <p className="text-2xl font-bold text-orange-500">{stats.hard}</p>
          <p className="text-[11px] font-semibold text-orange-400 mt-1">Hard</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl py-4 px-2 text-center">
          <p className="text-2xl font-bold text-emerald-500">{stats.good}</p>
          <p className="text-[11px] font-semibold text-emerald-400 mt-1">Good</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl py-4 px-2 text-center">
          <p className="text-2xl font-bold text-blue-500">{stats.easy}</p>
          <p className="text-[11px] font-semibold text-blue-400 mt-1">Easy</p>
        </div>
      </div>

      {/* Mastery Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between text-sm font-semibold text-slate-500 mb-2">
          <span>Session Mastery</span>
          <span className="text-purple-600">{masteryPct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000"
            style={{ width: `${masteryPct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-3 w-full max-w-md">
        <button
          onClick={onExit}
          className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
        >
          Back to Set
        </button>
        <button
          onClick={onRestart}
          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Study Again
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FlashcardSession() {
  const { setId } = useParams<{ setId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const userId = user?.id || "guest";

  // words passed directly via navigation state (e.g. "all words" session)
  const stateWords: VocabWord[] | undefined = (location.state as any)?.words;
  const stateSetName: string | undefined = (location.state as any)?.setName;

  const { currentSet, currentSetWords, currentSetLoading } = useSelector(
    (state: RootState) => state.vocab
  );

  const [cards, setCards] = useState<CardState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0 });
  const [shuffled, setShuffled] = useState(false);
  const [startTime] = useState(Date.now());
  const cardRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [isCustomPractice, setIsCustomPractice] = useState(false);
  const cardStartTimeRef = useRef<number>(Date.now());

  // ─── Batch Syncing & Buffering Ref/States ──────────────────────────────────
  const pendingReviewsRef = useRef<PendingReview[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const getStorageKey = useCallback(() => `minlish_pending_reviews_${userId}`, [userId]);

  const savePendingToStorage = useCallback((reviews: PendingReview[]) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(reviews));
    } catch (err) {
      console.error("Failed to save pending reviews to storage", err);
    }
  }, [getStorageKey]);

  const getPendingFromStorage = useCallback((): PendingReview[] => {
    try {
      const raw = localStorage.getItem(getStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("Failed to get pending reviews from storage", err);
      return [];
    }
  }, [getStorageKey]);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (err) {
      console.error("Failed to clear pending reviews from storage", err);
    }
  }, [getStorageKey]);

  const syncPendingReviews = useCallback(async (forceReviews?: PendingReview[]) => {
    const reviewsToSync = forceReviews || pendingReviewsRef.current;
    if (reviewsToSync.length === 0) return;

    setIsSyncing(true);
    try {
      const res = await api.post("/api/v1/learning/sync", { reviews: reviewsToSync });
      if (res.data.success) {
        pendingReviewsRef.current = [];
        clearStorage();
      }
    } catch (err) {
      console.error("Failed to sync reviews with server", err);
    } finally {
      setIsSyncing(false);
    }
  }, [clearStorage]);

  // Load pending reviews from storage on userId change
  useEffect(() => {
    if (userId) {
      pendingReviewsRef.current = getPendingFromStorage();
    }
  }, [userId, getPendingFromStorage]);

  // Offline recovery: sync leftovers on mount
  useEffect(() => {
    if (userId && userId !== "guest") {
      const stored = getPendingFromStorage();
      if (stored.length > 0) {
        syncPendingReviews(stored);
      }
    }
  }, [userId, getPendingFromStorage, syncPendingReviews]);

  // Keepalive background sync on browser unload/pagehide
  useEffect(() => {
    const handleVisibilityOrUnload = () => {
      if (pendingReviewsRef.current.length > 0) {
        const body = JSON.stringify({ reviews: pendingReviewsRef.current });
        const token = localStorage.getItem("token") || "";
        // Modern keepalive fetch to ensure request completes after page exits
        fetch(`${api.defaults.baseURL || ""}/api/v1/learning/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
          },
          body,
          keepalive: true
        });
      }
    };

    window.addEventListener("pagehide", handleVisibilityOrUnload);
    return () => {
      window.removeEventListener("pagehide", handleVisibilityOrUnload);
    };
  }, []);

  // Track time spent per card
  useEffect(() => {
    cardStartTimeRef.current = Date.now();
  }, [currentIndex, sessionDone]);

  // Load session queue or fallback to custom practice
  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      if (stateWords && stateWords.length > 0) {
        setCards(stateWords.map((w) => ({ word: w, isFlipped: false })));
        setIsCustomPractice(true);
        setLoading(false);
        return;
      }

      if (setId) {
        // Fetch set-specific queue
        const res = await api.get(`/api/v1/learning/sets/${setId}/queue`);
        const { newCards, reviewCards } = res.data.data;
        const combined = [...reviewCards, ...newCards];

        if (combined.length > 0) {
          const vocabWords: VocabWord[] = combined.map((card: any) => ({
            id: card.id,
            setId: card.setContext?.setId || setId,
            word: card.word,
            pronunciation: card.pronunciation || "",
            partOfSpeech: card.partOfSpeech || "noun",
            meaning: card.meaning,
            examples: card.examples || [],
            audioUrl: card.audioUrl || "",
            imageUrl: card.imageUrl || "",
            descriptionEN: card.descriptionEN || "",
            synonyms: card.synonyms || [],
            antonyms: card.antonyms || [],
            collocations: card.collocations || [],
            note: card.note || ""
          }));
          setCards(vocabWords.map((w) => ({ word: w, isFlipped: false })));
          setIsCustomPractice(false);
        } else {
          // Fallback: Fetch all words in set for custom practice
          const detailRes = await dispatch(fetchSetDetail(setId)).unwrap();
          const allWords = detailRes.words || [];
          if (allWords.length > 0) {
            setCards(allWords.map((w: any) => ({ word: w, isFlipped: false })));
            setIsCustomPractice(true);
          } else {
            setCards([]);
          }
        }
      } else {
        // Fetch global queue
        const res = await api.get("/api/v1/learning/queue");
        const { newCards, reviewCards } = res.data.data;
        const combined = [...reviewCards, ...newCards];

        if (combined.length > 0) {
          const vocabWords: VocabWord[] = combined.map((card: any) => ({
            id: card.id,
            setId: card.setContext?.setId || "",
            word: card.word,
            pronunciation: card.pronunciation || "",
            partOfSpeech: card.partOfSpeech || "noun",
            meaning: card.meaning,
            examples: card.examples || [],
            audioUrl: card.audioUrl || "",
            imageUrl: card.imageUrl || "",
            descriptionEN: card.descriptionEN || "",
            synonyms: card.synonyms || [],
            antonyms: card.antonyms || [],
            collocations: card.collocations || [],
            note: card.note || ""
          }));
          setCards(vocabWords.map((w) => ({ word: w, isFlipped: false })));
          setIsCustomPractice(false);
        } else {
          // Fallback: Lấy tất cả từ vựng của tất cả các bộ từ trong thư viện cá nhân
          const setsRes = await api.get("/api/v1/vocab/sets?limit=100");
          const userSets = setsRes.data.data || [];
          if (userSets.length > 0) {
            const promises = userSets.map((s: any) => api.get(`/api/v1/vocab/sets/${s.id}/words`));
            const responses = await Promise.all(promises);
            const allWords = responses.flatMap((r) => r.data.data || []);

            if (allWords.length > 0) {
              // Loại bỏ trùng lặp từ vựng theo chữ thường
              const seen = new Set();
              const uniqueWords = allWords.filter((w: any) => {
                const lower = w.word.toLowerCase();
                if (seen.has(lower)) return false;
                seen.add(lower);
                return true;
              });

              const vocabWords: VocabWord[] = uniqueWords.map((w: any) => ({
                id: w.id || w._id,
                setId: w.setId || "",
                word: w.word,
                pronunciation: w.pronunciation || "",
                partOfSpeech: w.partOfSpeech || "noun",
                meaning: w.meaning,
                examples: w.examples || [],
                audioUrl: w.audioUrl || "",
                imageUrl: w.imageUrl || "",
                descriptionEN: w.descriptionEN || "",
                synonyms: w.synonyms || [],
                antonyms: w.antonyms || [],
                collocations: w.collocations || [],
                note: w.note || ""
              }));

              setCards(vocabWords.map((w) => ({ word: w, isFlipped: false })));
              setIsCustomPractice(true);
            } else {
              setCards([]);
            }
          } else {
            setCards([]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load learning queue", err);
      toast.error("Failed to load session details.");
    } finally {
      setLoading(false);
    }
  }, [setId, stateWords, dispatch]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const setName = stateSetName ?? currentSet?.name ?? "Vocabulary";

  // ── Flip ──
  const flipCard = useCallback(() => {
    if (isAnimating) return;
    setIsFlipped((f) => !f);
  }, [isAnimating]);

  // ── SRS Rating ──
  const handleRating = useCallback(
    async (rating: SRSRating) => {
      if (!currentCard || isAnimating) return;
      setIsAnimating(true);

      // Update stats
      setStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

      // Buffer review (always sync progress even in custom/practice mode)
      const word = currentCard.word;
      const timeSpent = Math.max(1, Math.round((Date.now() - cardStartTimeRef.current) / 1000));
      const newReview: PendingReview = {
        wordId: word.id,
        setId: word.setId || setId || "",
        rating,
        timeSpent,
        reviewedAt: new Date().toISOString()
      };

      pendingReviewsRef.current.push(newReview);
      savePendingToStorage(pendingReviewsRef.current);

      // Animate card exit
      setTimeout(async () => {
        if (currentIndex + 1 >= totalCards) {
          setSessionDone(true);
          // Sync all reviews on session completion
          await syncPendingReviews();
        } else {
          setCurrentIndex((i) => i + 1);
          setIsFlipped(false);
        }
        setIsAnimating(false);
      }, 320);
    },
    [currentCard, currentIndex, totalCards, isAnimating, isCustomPractice, setId, savePendingToStorage, syncPendingReviews]
  );

  // ── Shuffle ──
  const handleShuffle = () => {
    setCards((prev) => shuffle(prev));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShuffled(true);
    toast.success("Cards shuffled!");
  };

  // ── Restart ──
  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionDone(false);
    setStats({ again: 0, hard: 0, good: 0, easy: 0 });
    loadSession();
  };

  // ── Exit ──
  const handleExit = async () => {
    if (pendingReviewsRef.current.length > 0) {
      const toastId = toast.loading("Đang đồng bộ tiến độ học tập...");
      await syncPendingReviews();
      toast.dismiss(toastId);
    }
    if (setId) navigate(`/vocabulary/${setId}`);
    else navigate("/vocabulary");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sessionDone) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flipCard();
      }
      if (isFlipped) {
        if (e.key === "1") handleRating("again");
        if (e.key === "2") handleRating("hard");
        if (e.key === "3") handleRating("good");
        if (e.key === "4") handleRating("easy");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipCard, isFlipped, sessionDone, handleRating]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500 font-sans">Loading session…</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-[#4648d4] flex items-center justify-center mb-2">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Tuyệt vời! Bạn đã hoàn thành</h2>
        <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
          Bạn đã học hết toàn bộ từ vựng hiện có trong thư viện cá nhân! Hãy khám phá thêm các bộ từ mới từ mục Explore để tiếp tục hành trình học tập.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate("/explore")}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:scale-105 transition-all"
          >
            Khám phá bộ từ mới
          </button>
          <button
            onClick={handleExit}
            className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const elapsed = Math.round((Date.now() - startTime) / 60000);

  // ── Session Complete ──
  if (sessionDone) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <CompletionScreen
          stats={stats}
          total={totalCards}
          setName={setName}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      </div>
    );
  }

  const word = currentCard?.word;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleExit}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span className="truncate max-w-[200px] flex items-center gap-1.5">
              {setName}
              {isCustomPractice && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 text-[9px] font-bold rounded-full uppercase tracking-wider">
                  Practice Mode
                </span>
              )}
            </span>
            <span>
              {currentIndex + 1} / {totalCards}
            </span>
          </div>
          <ProgressBar current={currentIndex + 1} total={totalCards} />
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
          <Timer className="w-3.5 h-3.5" />
          <span>{elapsed}m</span>
        </div>
        <button
          onClick={handleShuffle}
          className={`p-2 rounded-xl hover:bg-slate-100 transition-colors ${shuffled ? "text-purple-500" : "text-slate-400"}`}
          title="Shuffle cards"
        >
          <Shuffle className="w-4 h-4" />
        </button>
      </div>

      {/* ── Custom Practice Banner ── */}
      {isCustomPractice && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/50 flex items-center gap-3 text-amber-800 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">Chế độ Luyện tập tự do</h4>
            <p className="text-[11px] text-amber-700/90 mt-0.5 font-medium">Bạn đã hoàn thành lịch học bắt buộc hôm nay. Phiên này giúp ôn tập tự do và vẫn tiếp tục cập nhật lịch trình SRS giúp củng cố trí nhớ!</p>
          </div>
        </motion.div>
      )}

      {/* ── SRS Legend ── */}
      <div className="flex justify-center gap-4 mb-4 text-[11px] text-slate-400 font-medium">
        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-purple-400"/>Space to flip</span>
        {isFlipped && <span className="flex items-center gap-1">Keys: <kbd className="bg-slate-100 px-1 rounded text-slate-600">1-4</kbd> to rate</span>}
      </div>

      {/* ── Flashcard ── */}
      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={flipCard}
        ref={cardRef}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "420px",
          }}
        >
          {/* ── Front Face ── */}
          <div
            className="absolute inset-0 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-100 flex flex-col items-center justify-center p-8 overflow-hidden"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-50 rounded-full blur-3xl opacity-60" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-60" />

            <div className="relative z-10 flex flex-col items-center gap-4 w-full">
              {/* Word image if exists */}
              {word?.imageUrl && (
                <img
                  src={word.imageUrl}
                  alt={word.word}
                  className="w-28 h-28 rounded-2xl object-cover shadow-md border border-slate-100"
                />
              )}

              {/* Part of Speech badge */}
              {word?.partOfSpeech && (
                <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-widest rounded-full">
                  {word.partOfSpeech}
                </span>
              )}

              {/* Word */}
              <h2 className="text-5xl font-bold text-slate-800 text-center leading-tight">
                {word?.word}
              </h2>

              {/* Pronunciation */}
              {word?.pronunciation && (
                <p className="text-xl text-slate-400 font-medium italic">{word.pronunciation}</p>
              )}

              {/* Audio Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(word?.audioUrl, word?.word);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all text-sm font-medium"
              >
                <Volume2 className="w-4 h-4" />
                Listen
              </button>

              {/* Hint */}
              <p className="text-xs text-slate-400 font-medium mt-4 animate-pulse">
                Tap to reveal meaning ↓
              </p>
            </div>
          </div>

          {/* ── Back Face ── */}
          <div
            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 shadow-xl shadow-purple-200 flex flex-col justify-between p-8 overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex-1 flex flex-col gap-4 overflow-y-auto">
              {/* Word header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">{word?.word}</h3>
                  {word?.pronunciation && (
                    <p className="text-purple-200 text-sm italic">{word.pronunciation}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(word?.audioUrl, word?.word);
                  }}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-white/20" />

              {/* Meaning */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">Meaning</p>
                <p className="text-white text-lg font-semibold leading-snug">{word?.meaning}</p>
              </div>

              {/* Description EN */}
              {word?.descriptionEN && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">Description</p>
                  <p className="text-purple-100 text-sm leading-relaxed">{word.descriptionEN}</p>
                </div>
              )}

              {/* Example */}
              {word?.examples && word.examples.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">Example</p>
                  <p className="text-purple-100 italic text-sm leading-relaxed">
                    "{word.examples[0]}"
                  </p>
                </div>
              )}

              {/* Synonyms & Antonyms */}
              {(word?.synonyms?.length || word?.antonyms?.length) ? (
                <div className="flex gap-6">
                  {word?.synonyms && word.synonyms.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">Synonyms</p>
                      <p className="text-purple-100 text-sm">{word.synonyms.slice(0, 3).join(", ")}</p>
                    </div>
                  )}
                  {word?.antonyms && word.antonyms.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">Antonyms</p>
                      <p className="text-purple-100 text-sm">{word.antonyms.slice(0, 3).join(", ")}</p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Note */}
              {word?.note && (
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">Note 💡</p>
                  <p className="text-purple-100 text-sm">{word.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation / SRS Rating ── */}
      <div className="mt-6">
        {!isFlipped ? (
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (currentIndex > 0) {
                  setCurrentIndex((i) => i - 1);
                  setIsFlipped(false);
                }
              }}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors text-sm font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <button
              onClick={flipCard}
              className="px-10 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              Reveal Answer
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (currentIndex + 1 < totalCards) {
                  setCurrentIndex((i) => i + 1);
                  setIsFlipped(false);
                }
              }}
              disabled={currentIndex + 1 >= totalCards}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors text-sm font-semibold"
            >
              Skip
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
              How well did you know this?
            </p>
            <div className="flex gap-2">
              <SRSButton
                label="Again"
                sublabel="< 1 min"
                color="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                onClick={() => handleRating("again")}
              />
              <SRSButton
                label="Hard"
                sublabel="< 10 min"
                color="bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100"
                onClick={() => handleRating("hard")}
              />
              <SRSButton
                label="Good"
                sublabel="1 day"
                color="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                onClick={() => handleRating("good")}
              />
              <SRSButton
                label="Easy"
                sublabel="4 days"
                color="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
                onClick={() => handleRating("easy")}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Card Counter Dots ── */}
      {totalCards <= 20 && (
        <div className="flex justify-center gap-1.5 mt-6 flex-wrap">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-purple-600 w-5"
                  : i < currentIndex
                  ? "bg-purple-200"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
