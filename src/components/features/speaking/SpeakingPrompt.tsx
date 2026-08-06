import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  Mic, Square, Volume2, Loader2, 
  CheckCircle2, XCircle, RotateCcw, 
  Lightbulb, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { speak, stopSpeaking } from "../../../lib/utils";

export type SpeakingDifficulty = "beginner" | "intermediate" | "advanced";
export type SpeakingStatus = "idle" | "recording" | "processing" | "success" | "error";

export interface SpeakingPromptProps {
  /** Text prompt cho người dùng đọc */
  prompt: string;
  /** Translation/meaning của prompt (hiển thị hint) */
  translation?: string;
  /** Độ khó của bài */
  difficulty?: SpeakingDifficulty;
  /** Callback khi có transcript */
  onTranscript?: (transcript: string, prompt: string) => void;
  /** Callback khi hoàn thành bài (sau khi AI scoring) */
  onComplete?: (result: SpeakingResult) => void;
  /** ClassName override */
  className?: string;
  /** Auto-focus mic button on mount */
  autoFocus?: boolean;
}

export interface SpeakingResult {
  transcript: string;
  prompt: string;
  accuracy: number;        // 0-100
  pronunciationScore: number;  // 0-100
  feedback: string;
  suggestions: string[];
  isCorrect: boolean;
}

export default function SpeakingPrompt({
  prompt,
  translation,
  difficulty = "intermediate",
  onTranscript,
  onComplete,
  className = "",
  autoFocus = false,
}: SpeakingPromptProps) {
  // ─── State ───────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<SpeakingStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Visualizer refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const getDifficultyColor = (d: SpeakingDifficulty) => {
    switch (d) {
      case "beginner": return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "intermediate": return "bg-amber-50 text-amber-600 border-amber-200";
      case "advanced": return "bg-red-50 text-red-600 border-red-200";
    }
  };

  const getDifficultyLabel = (d: SpeakingDifficulty) => {
    switch (d) {
      case "beginner": return "Beginner";
      case "intermediate": return "Intermediate";
      case "advanced": return "Advanced";
    }
  };

  // ─── Visualizer ──────────────────────────────────────────────────────────
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

    // Handle high DPI
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
        gradient.addColorStop(0, "#a855f7"); // purple-500
        gradient.addColorStop(1, "#6366f1"); // indigo-500
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

  // ─── Speak Prompt (TTS) ──────────────────────────────────────────────────
  const handleSpeakPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(prompt, "en-US", 0.85); // slightly slower for learners
  };

  // ─── Recording ──────────────────────────────────────────────────────────
  const handleStartRecording = async () => {
    if (status === "recording" || status === "processing") return;

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
        setAudioBlob(blob);
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

  // ─── Process Recording ───────────────────────────────────────────────────
  const processRecording = async (blob: Blob) => {
    setStatus("processing");
    
    // Speech-to-text via Web Speech API (fallback)
    // TODO: Replace with backend API for production
    const useWebSpeech = true;
    
    if (useWebSpeech) {
      try {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        // Use Web Speech API for transcription
        const speechRecognition = (window as any).SpeechRecognition || 
                                  (window as any).webkitSpeechRecognition;
        
        if (speechRecognition) {
          const recognition = new speechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = "en-US";
          
          recognition.onresult = (event: any) => {
            const transcriptResult = Array.from(event.results)
              .map((result: any) => result[0].transcript)
              .join("");
            setTranscript(transcriptResult);
          };
          
          recognition.onerror = () => {
            // Fallback: show manual input
            setTranscript("");
          };
          
          recognition.start();
          
          recognition.onend = () => {
            if (!transcript) {
              toast.error("Không nhận diện được giọng nói. Bạn có thể nhập tay.");
            }
            setStatus(transcript ? "success" : "idle");
          };
        } else {
          setStatus("idle");
          toast.error("Trình duyệt không hỗ trợ nhận diện giọng nói.");
        }
      } catch {
        setStatus("idle");
      }
    } else {
      // TODO: Send to backend API
      // const formData = new FormData();
      // formData.append("audio", blob, "recording.webm");
      // formData.append("prompt", prompt);
      // const res = await api.post("/api/v1/speaking/evaluate", formData);
      setStatus("idle");
    }
  };

  // ─── Manual Transcript Input ─────────────────────────────────────────────
  const handleManualSubmit = async () => {
    if (!transcript.trim()) {
      toast.error("Vui lòng nhập nội dung bạn đã nói.");
      return;
    }
    
    // Mock scoring (TODO: connect to backend API)
    const mockResult: SpeakingResult = {
      transcript,
      prompt,
      accuracy: Math.round(70 + Math.random() * 30),
      pronunciationScore: Math.round(65 + Math.random() * 35),
      feedback: "Good attempt! Your pronunciation is improving.",
      suggestions: [
        "Focus on the vowel sounds",
        "Try to speak more naturally",
      ],
      isCorrect: true,
    };
    
    setResult(mockResult);
    setStatus("success");
    onComplete?.(mockResult);
    onTranscript?.(transcript, prompt);
  };

  // ─── Retry ───────────────────────────────────────────────────────────────
  const handleRetry = () => {
    stopSpeaking();
    setTranscript("");
    setResult(null);
    setStatus("idle");
    setAudioBlob(null);
  };

  // ─── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopVisualizer();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      stopSpeaking();
    };
  }, [stopVisualizer]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-200">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Speaking Practice</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(difficulty)}`}>
              {getDifficultyLabel(difficulty)}
            </span>
          </div>
        </div>
        
        {/* Speak Prompt Button */}
        <button
          onClick={handleSpeakPrompt}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all text-sm font-semibold"
          title="Listen to prompt"
        >
          <Volume2 className="w-4 h-4" />
          Listen
        </button>
      </div>

      {/* Prompt Text */}
      <div className="px-6 py-8 bg-gradient-to-br from-slate-50 to-purple-50/30">
        <p className="text-2xl font-bold text-slate-800 text-center leading-relaxed">
          "{prompt}"
        </p>
        {translation && (
          <p className="text-sm text-slate-500 text-center mt-3 italic">
            {translation}
          </p>
        )}
      </div>

      {/* Visualizer */}
      <AnimatePresence>
        {status === "recording" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 60 }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6"
          >
            <canvas 
              ref={canvasRef} 
              className="w-full h-[60px] rounded-xl bg-slate-50"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Display */}
      <AnimatePresence>
        {status === "success" && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-4 border-t border-slate-100"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Bạn đã nói:
            </p>
            <p className="text-slate-700 font-medium">"{transcript}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display */}
      <AnimatePresence>
        {status === "success" && result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-purple-50/50 to-indigo-50/50"
          >
            {/* Score Bar */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">Accuracy</span>
                  <span className="text-purple-600">{result.accuracy}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.accuracy}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  />
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-white border-2 border-purple-200 flex items-center justify-center shadow-sm">
                {result.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-xl p-4 border border-slate-100 mb-3">
              <p className="text-sm font-semibold text-slate-700 mb-1">AI Feedback:</p>
              <p className="text-sm text-slate-600">{result.feedback}</p>
            </div>

            {result.suggestions.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 rounded-xl p-3 border border-amber-100">
                <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Gợi ý cải thiện:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    {result.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-center gap-4">
        {status === "success" ? (
          <>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={onComplete ? () => onComplete(result!) : handleRetry}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        ) : status === "recording" ? (
          <button
            onClick={handleStopRecording}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200 transition-all"
          >
            <Square className="w-7 h-7 fill-white" />
          </button>
        ) : status === "processing" ? (
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Processing...</span>
          </div>
        ) : (
          <button
            onClick={handleStartRecording}
            autoFocus={autoFocus}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-all"
          >
            <Mic className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* Status hint */}
      <div className="px-6 pb-4 text-center">
        <p className="text-xs text-slate-400">
          {status === "idle" && "Nhấn mic để bắt đầu nói"}
          {status === "recording" && "Đang ghi âm... Nhấn để dừng"}
          {status === "processing" && "Đang xử lý giọng nói của bạn..."}
          {status === "success" && "Hoàn thành! Nhấn Next để tiếp tục"}
        </p>
      </div>
    </div>
  );
}