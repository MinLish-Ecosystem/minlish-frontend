import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  Mic, Square, 
  Wifi, WifiOff, Cpu, Zap, AlertCircle, CheckCircle2,
  Trash2, ChevronDown, Loader2, Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import api from "../../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────
export type GpuTier = "light" | "medium" | "high" | "ultra" | "extreme";
export type AiStatus = "idle" | "downloading" | "downloaded" | "running" | "error";

interface GpuConfig {
  tier: GpuTier;
  label: string;
  vram: string;
  description: string;
  modelSize: string;
  recommendedFor: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GPU_CONFIGS: GpuConfig[] = [
  { tier: "light", label: "Light", vram: "0.25GB", description: "RTX 3050 / M1 / Integrated", modelSize: "~300MB", recommendedFor: "Basic devices" },
  { tier: "medium", label: "Medium", vram: "0.5GB", description: "RTX 3060 / M2", modelSize: "~600MB", recommendedFor: "General laptops" },
  { tier: "high", label: "High", vram: "1GB", description: "RTX 4060 / M3 Pro", modelSize: "~1.2GB", recommendedFor: "Gaming laptops / workstation" },
  { tier: "ultra", label: "Ultra", vram: "2GB", description: "RTX 4070 / M3 Max", modelSize: "~2.5GB", recommendedFor: "Powerful desktop" },
  { tier: "extreme", label: "Extreme", vram: "4GB", description: "RTX 4090 / RTX 5090 / H100 / M4 Ultra", modelSize: "~5GB+", recommendedFor: "Professional AI" },
];

const DEFAULT_GPU_TIER: GpuTier = "medium";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).substring(2, 9);
const formatTime = (date: Date) => date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const speak = (text: string, lang = "en-US", rate = 1.0) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
};

const stopSpeaking = () => {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
};

// ─── Components ──────────────────────────────────────────────────────────────
function GpuDropdown({ value, onChange, disabled }: { value: GpuTier; onChange: (tier: GpuTier) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = GPU_CONFIGS.find((c) => c.tier === value)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-semibold ${
          disabled ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed" : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"
        }`}
      >
        <Cpu className="w-4 h-4" />
        <span>{selected.label}</span>
        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{selected.vram} VRAM</span>
        {!disabled && <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select GPU Configuration</p>
            </div>
            {GPU_CONFIGS.map((config) => (
              <button
                key={config.tier}
                onClick={() => { onChange(config.tier); setOpen(false); }}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${value === config.tier ? "bg-purple-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-bold ${value === config.tier ? "text-purple-700" : "text-slate-800"}`}>
                      {config.label}
                      <span className="ml-2 text-xs font-normal text-slate-400">{config.vram} VRAM</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">Model: {config.modelSize}</p>
                  </div>
                  {value === config.tier && <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />}
                </div>
                <p className="text-[10px] text-purple-400 mt-1">✓ {config.recommendedFor}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status, progress }: { status: AiStatus; progress?: number }) {
  const config: Record<AiStatus, { label: string; color: string; icon: React.ReactNode }> = {
    idle: { label: "Not Ready", color: "bg-slate-100 text-slate-500", icon: <WifiOff className="w-3 h-3" /> },
    downloading: { label: `Downloading... ${progress ? `${progress}%` : ""}`, color: "bg-amber-100 text-amber-700", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    downloaded: { label: "Ready", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
    running: { label: "Running", color: "bg-purple-100 text-purple-700", icon: <Zap className="w-3 h-3" /> },
    error: { label: "Error", color: "bg-red-100 text-red-600", icon: <AlertCircle className="w-3 h-3" /> },
  };
  const { label, color, icon } = config[status];
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${color}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}



function RecordButton({ recording, onClick, disabled }: { recording: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.08 }}
      whileTap={{ scale: disabled ? 1 : 0.94 }}
      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
        disabled ? "bg-slate-200 cursor-not-allowed shadow-slate-200" : recording ? "bg-red-500 hover:bg-red-600 shadow-red-200" : "bg-gradient-to-br from-purple-600 to-indigo-600 hover:shadow-purple-300"
      }`}
    >
      {recording && (
        <>
          <motion.div className="absolute inset-0 rounded-full bg-red-500/20" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
          <motion.div className="absolute inset-0 rounded-full bg-red-500/15" animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
        </>
      )}
      <AnimatePresence mode="wait">
        {recording ? (
          <motion.div key="stop" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <Square className="w-4 h-4 text-red-500 fill-red-500" />
          </motion.div>
        ) : (
          <motion.div key="mic" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Mic className="w-6 h-6 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${isUser ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-md" : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"}`}>
        <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
        <div className={`flex items-center gap-1.5 mt-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
          {message.audioUrl && (
            <button onClick={() => new Audio(message.audioUrl).play()} className={`p-1 rounded-lg hover:bg-black/10 transition-colors ${isUser ? "text-white/60" : "text-slate-400"}`} title="Replay audio">
              <Volume2 className="w-3 h-3" />
            </button>
          )}
          <span className={`text-[10px] ${isUser ? "text-white/50" : "text-slate-400"}`}>{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VoiceAIChat() {
  const [gpuTier, setGpuTier] = useState<GpuTier>(DEFAULT_GPU_TIER);
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [webGpuSupported, setWebGpuSupported] = useState<boolean | null>(null);
  const [gpuName, setGpuName] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [processing, setProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // ─── WebGPU Detection ───────────────────────────────────────────────────────
  useEffect(() => {
    const detectWebGPU = async () => {
      if (!navigator.gpu) { setWebGpuSupported(false); return; }
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) { setWebGpuSupported(false); return; }
        const info = adapter.info;
        setGpuName(`${info.vendor} ${info.architecture || info.device || "GPU"}`);
        setWebGpuSupported(true);
      } catch { setWebGpuSupported(false); }
    };
    detectWebGPU();
  }, []);

  // ─── Cleanup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
      if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
    };
  }, []);

  // ─── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ─── Visualizer ──────────────────────────────────────────────────────────────
  const startVisualizer = useCallback(async (stream: MediaStream) => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
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
    const draw = () => {
      if (!analyserRef.current || !cctx || !canvas) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      cctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / data.length;
      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * canvas.height;
        const gradient = cctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, "#a855f7");
        gradient.addColorStop(1, "#6366f1");
        cctx.fillStyle = gradient;
        cctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const stopVisualizer = useCallback(() => {
    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
    if (canvasRef.current) { const ctx = canvasRef.current.getContext("2d"); ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }
  }, []);

  // ─── Download Model ─────────────────────────────────────────────────────────
  const downloadModel = async (): Promise<boolean> => {
    if (aiStatus === "downloading" || aiStatus === "downloaded" || aiStatus === "running") return true;
    try {
      const response = await fetch(`${api.defaults.baseURL}/api/v1/voice-ai/model/download?tier=${gpuTier}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("minlish_token") || ""}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Cannot read response stream");
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
      }
      const blob = new Blob(chunks);
      if ("caches" in window) {
        const cache = await caches.open(`voice-ai-model-${gpuTier}`);
        await cache.put(`${api.defaults.baseURL}/api/v1/voice-ai/model/download?tier=${gpuTier}`, new Response(blob, { headers: { "Content-Type": "application/octet-stream" } }));
      }
      localStorage.setItem(`voice_ai_model_${gpuTier}_downloaded`, "true");
      localStorage.setItem(`voice_ai_model_${gpuTier}_size`, String(total));
      setAiStatus("downloaded");
      return true;
    } catch (error: any) {
      console.error("Download model failed:", error);
      setAiStatus("error");
      toast.error("Failed to download model. Check your network connection.");
      return false;
    }
  };

  // ─── Recording ──────────────────────────────────────────────────────────────
  const handleStartRecording = async () => {
    if (processing || aiStatus === "error") return;

    // Auto-download model if not cached
    if (aiStatus === "idle") {
      const tier = GPU_CONFIGS.find((c) => c.tier === gpuTier)!;
      // Show info toast
      toast(
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
          <span>
            Auto-downloading {tier.label} model ({tier.modelSize})...
          </span>
        </div>,
        { id: "model-download-info", duration: Infinity }
      );
      setAiStatus("downloading");
      const success = await downloadModel();
      toast.dismiss("model-download-info");
      if (!success) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunks, { type: recorder.mimeType });
        const userMsg: ChatMessage = { id: generateId(), role: "user", text: "[Voice Message]", timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        await sendToAI(audioBlob);
      };
      setMediaRecorder(recorder);
      recorder.start(100);
      setRecording(true);
      startVisualizer(stream);
    } catch (err) {
      console.error("Failed to access microphone:", err);
      toast.error("Cannot access microphone. Please grant permission.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && recording) { mediaRecorder.stop(); setRecording(false); stopVisualizer(); }
  };

  // ─── Send to AI ─────────────────────────────────────────────────────────────
  const sendToAI = async (audioBlob: Blob) => {
    setProcessing(true);
    const userMsgId = generateId();
    const aiMsgId = generateId();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text: "", timestamp: new Date() }]);
    setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", text: "", timestamp: new Date() }]);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `recording_${userMsgId}.webm`);
      formData.append("gpuTier", gpuTier);
      const response = await api.post("/api/v1/voice-ai/chat", formData, { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 });
      const { transcript, response: aiText } = response.data.data;
      setMessages((prev) => prev.map((m) => m.id === userMsgId ? { ...m, text: transcript || "[Could not recognize speech]" } : m));
      setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, text: aiText } : m));
      speak(aiText, "en-US");
    } catch (error: any) {
      console.error("AI chat failed:", error);
      setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, text: "Sorry, I couldn't respond right now. Please try again." } : m));
      toast.error("AI connection failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleClearChat = () => { stopSpeaking(); setMessages([]); toast.success("Chat history cleared"); };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Voice AI Chat</h2>
          <p className="text-base text-slate-500 mt-1">Voice chat with AI — runs entirely on your device via WebGPU</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={aiStatus} />
          {webGpuSupported === false && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-600">
              <AlertCircle className="w-3 h-3" /> WebGPU not available
            </div>
          )}
          {webGpuSupported === true && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-600">
              <Wifi className="w-3 h-3" /> {gpuName || "WebGPU Ready"}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-200">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-800">MinLish Voice AI</h4>
              <p className="text-xs text-slate-400">
                {aiStatus === "running" ? "WebGPU Inference Active" : aiStatus === "downloaded" ? "Ready to chat" : "Model required"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GpuDropdown value={gpuTier} onChange={(t) => { setGpuTier(t); if (aiStatus === "downloaded") setAiStatus("idle"); }} disabled={aiStatus === "downloading" || aiStatus === "running"} />
            <button onClick={handleClearChat} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Clear history">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 mb-4">
                <Mic className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-700 mb-1">Start a conversation</h4>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">Press the mic button to record. AI will respond with voice.</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-5">
          <div className="flex justify-center mb-4">
            <canvas ref={canvasRef} width={320} height={60} className="rounded-xl bg-slate-50" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <RecordButton recording={recording} onClick={recording ? handleStopRecording : handleStartRecording} disabled={aiStatus === "downloading" || aiStatus === "error" || processing} />
            <p className="text-xs font-medium text-slate-400">
              {processing ? (
                <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Processing...</span>
              ) : recording ? (
                <span className="text-red-500 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> Recording — tap to stop</span>
              ) : aiStatus === "downloaded" || aiStatus === "running" ? (
                "Tap mic to start"
              ) : (
                <span className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-amber-500" /> Need to download model first</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}