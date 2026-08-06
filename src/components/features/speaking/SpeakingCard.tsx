import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  Mic, Square, Volume2, Loader2, 
  CheckCircle2, XCircle, RotateCcw, 
  RefreshCw, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { speak, stopSpeaking } from "../../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────
export type SpeakingDifficulty = "beginner" | "intermediate" | "advanced";
export type SpeakingStatus = "idle" | "recording" | "processing" | "success" | "error";

export interface SpeakingResult {
  transcript: string;
  accuracy: number;
  pronunciationScore: number;
  feedback: string;
  suggestions: string[];
  isCorrect: boolean;
}

export interface SpeakingCardProps {
  /** Đề bài/chủ đề cho người dùng đọc */
  topic: string;
  /** Bản dịch/giải thích (optional) */
  translation?: string;
  /** Độ khó của bài */
  difficulty?: SpeakingDifficulty;
  /** Callback khi nhấn nút Listen */
  onListen?: () => void;
  /** Callback khi có transcript (sau khi ghi âm xong) */
  onTranscript?: (transcript: string, result?: SpeakingResult) => void;
  /** ClassName override */
  className?: string;
  /** Auto-focus mic button on mount */
  autoFocus?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

// ─── Difficulty Helpers ───────────────────────────────────────────────────
const getDifficultyConfig = (d: SpeakingDifficulty) => {
  switch (d) {
    case "beginner":
      return { 
        label: "Sơ cấp", 
        color: "bg-emerald-50 text-emerald-600 border-emerald-200",
        bgGradient: "from-emerald-50/50 to-teal-50/30"
      };
    case "intermediate":
      return { 
        label: "Trung cấp", 
        color: "bg-amber-50 text-amber-600 border-amber-200",
        bgGradient: "from-amber-50/50 to-orange-50/30"
      };
    case "advanced":
      return { 
        label: "Nâng cao", 
        color: "bg-red-50 text-red-600 border-red-200",
        bgGradient: "from-red-50/50 to-pink-50/30"
      };
  }
};

// ─── SpeakingCard Component ───────────────────────────────────────────────
export default function SpeakingCard({
  topic,
  translation,
  difficulty = "intermediate",
  onListen,
  onTranscript,
  className = "",
  autoFocus = false,
  disabled = false,
}: SpeakingCardProps) {
  // ─── State ─────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<SpeakingStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Visualizer refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const difficultyConfig = getDifficultyConfig(difficulty);

  // ─── Listen Handler ─────────────────────────────────────────────────────
  const handleListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(topic, "en-US", 0.85);
    onListen?.();
  };

  // ─── Visualizer ─────────────────────────────────────────────────────────
  const startVisualizer = useCallback(async (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    source.connect(analyser);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cctx = canvas.getContext("2d");
    if (!cctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    cctx.scale(dpr, dpr);

    const draw = () => {
      if (!analyserRef.current || !cctx || !canvas) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      cctx.clearRect(0, 0, rect.width, rect.height);

      const barWidth = rect.width / data.length;
      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * rect.height;
        const gradient = cctx.createLinearGradient(0, rect.height, 0, rect.height - barHeight);
        gradient.addColorStop(0, "#8b5cf6"); // violet-500
        gradient.addColorStop(1, "#06b6d4"); // cyan-500
        cctx.fillStyle = gradient;
        cctx.fillRect(i * barWidth, rect.height - barHeight, barWidth - 1, barHeight);
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const stopVisualizer = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // ─── Recording ─────────────────────────────────────────────────────────
  const handleStartRecording = async () => {
    if (status === "recording" || status === "processing" || disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType });
        await processRecording(blob);
      };

      setMediaRecorder(recorder);
      recorder.start(100);
      setStatus("recording");
      setTranscript("");
      setResult(null);
      startVisualizer(stream);
    } catch (err) {
      console.error("Microphone access failed:", err);
      toast.error("Không thể truy cập microphone. Vui lòng cấp quyền.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && status === "recording") {
      mediaRecorder.stop();
      setStatus("processing");
      stopVisualizer();
    }
  };

  // ─── Process Recording ──────────────────────────────────────────────────
  const processRecording = async (_blob: Blob) => {
    setStatus("processing");
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock result (TODO: Connect to backend API)
    const mockResult: SpeakingResult = {
      transcript: "",
      accuracy: Math.round(75 + Math.random() * 25),
      pronunciationScore: Math.round(70 + Math.random() * 30),
      feedback: "Great effort! Keep practicing to improve your pronunciation.",
      suggestions: [
        "Focus on speaking at a steady pace",
        "Try to pronounce each word clearly",
      ],
      isCorrect: true,
    };
    
    setResult(mockResult);
    setStatus("success");
    onTranscript?.("", mockResult);
  };

  // ─── Manual Submit ───────────────────────────────────────────────────────
  const handleManualSubmit = () => {
    if (!transcript.trim()) {
      toast.error("Vui lòng nhập nội dung bạn đã nói.");
      return;
    }
    
    const mockResult: SpeakingResult = {
      transcript,
      accuracy: Math.round(70 + Math.random() * 30),
      pronunciationScore: Math.round(65 + Math.random() * 35),
      feedback: "Good attempt! Your pronunciation is improving.",
      suggestions: ["Keep practicing!"],
      isCorrect: true,
    };
    
    setResult(mockResult);
    setStatus("success");
    onTranscript?.(transcript, mockResult);
  };

  // ─── Retry ───────────────────────────────────────────────────────────────
  const handleRetry = () => {
    stopSpeaking();
    setTranscript("");
    setResult(null);
    setStatus("idle");
  };

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopVisualizer();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      stopSpeaking();
    };
  }, [stopVisualizer]);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header with Listen Button */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mic Icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-200">
            <Mic className="w-6 h-6 text-white" />
          </div>
          
          <div>
            <h4 className="font-bold text-slate-800 text-lg">Luyện nói</h4>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${difficultyConfig.color}`}>
              {difficultyConfig.label}
            </span>
          </div>
        </div>
        
        {/* Listen Button */}
        <button
          onClick={handleListen}
          disabled={disabled || status === "recording"}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 border border-violet-200 text-violet-600 hover:from-violet-100 hover:to-cyan-100 hover:border-violet-300 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          title="Nghe đề bài"
        >
          <Volume2 className="w-5 h-5" />
          <span>Nghe</span>
        </button>
      </div>

      {/* Topic Display */}
      <div className={`px-6 py-8 bg-gradient-to-br ${difficultyConfig.bgGradient}`}>
        <p className="text-2xl font-bold text-slate-800 text-center leading-relaxed mb-3">
          "{topic}"
        </p>
        {translation && (
          <p className="text-sm text-slate-500 text-center italic">
            {translation}
          </p>
        )}
      </div>

      {/* Visualizer */}
      <AnimatePresence>
        {status === "recording" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 64 }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6"
          >
            <canvas 
              ref={canvasRef} 
              className="w-full h-16 rounded-xl bg-slate-50 border border-slate-100"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display */}
      <AnimatePresence>
        {status === "success" && result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-violet-50/50 to-cyan-50/50"
          >
            {/* Transcript if available */}
            {transcript && (
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Bạn đã nói:
                </p>
                <p className="text-slate-700 font-medium">"{transcript}"</p>
              </div>
            )}

            {/* Score Bar */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-500">Độ chính xác</span>
                  <span className="text-violet-600 font-bold">{result.accuracy}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.accuracy}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
                  />
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-violet-200 flex items-center justify-center shadow-sm">
                <Sparkles className="w-7 h-7 text-violet-500" />
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-xl p-4 border border-slate-100 mb-3">
              <p className="text-sm font-semibold text-slate-700 mb-1.5">📝 Nhận xét:</p>
              <p className="text-sm text-slate-600 leading-relaxed">{result.feedback}</p>
            </div>

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-sm font-semibold text-amber-700 mb-2">💡 Gợi ý cải thiện:</p>
                <ul className="space-y-1">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-amber-600 flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="px-6 py-5 border-t border-slate-100">
        <div className="flex items-center justify-center gap-4">
          {status === "success" ? (
            <>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Thử lại
              </button>
              <button
                onClick={onTranscript ? () => onTranscript(transcript, result!) : handleRetry}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-sm shadow-lg shadow-violet-200 hover:scale-[1.02] transition-all"
              >
                Tiếp tục
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          ) : status === "recording" ? (
            <button
              onClick={handleStopRecording}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white flex items-center justify-center shadow-xl shadow-red-200 transition-all hover:scale-105 active:scale-95"
            >
              <Square className="w-8 h-8 fill-white" />
            </button>
          ) : status === "processing" ? (
            <div className="flex items-center gap-3 text-slate-500 py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-semibold">Đang xử lý...</span>
            </div>
          ) : (
            <button
              onClick={handleStartRecording}
              autoFocus={autoFocus}
              disabled={disabled}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-violet-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-9 h-9" />
            </button>
          )}
        </div>

        {/* Status hint */}
        <p className="text-xs text-slate-400 text-center mt-3">
          {status === "idle" && "Nhấn mic để bắt đầu nói"}
          {status === "recording" && "Đang ghi âm... Nhấn để dừng"}
          {status === "processing" && "Đang phân tích giọng nói của bạn..."}
          {status === "success" && "Hoàn thành! Bạn làm tốt lắm! 🌟"}
        </p>
      </div>
    </div>
  );
}