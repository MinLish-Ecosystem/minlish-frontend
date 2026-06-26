import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Clock, CheckCircle, Zap, RefreshCw, Play, BrainCircuit, Lock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import Loading from "../../components/common/Loading";

interface Particle {
  id: number;
  text: string;
  angle: number;
  radius: number;
  speed: number;
  rotSpeed: number;
  size: number;
  opacity: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isMe: boolean;
  correctAnswers: number;
  timeTaken: number;
}

interface MyScore {
  rank: number;
  score: number;
  correctAnswers: number;
  timeTaken: number;
}

export default function Practice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myScore, setMyScore] = useState<MyScore | null>(null);
  
  // Ref for HTML5 Canvas particle vortex
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Fetch status and leaderboard
  const fetchData = async () => {
    try {
      setLoading(true);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
      
      const [challengeRes, leaderboardRes] = await Promise.all([
        api.get(`/api/v1/practice/daily?timezone=${encodeURIComponent(timezone)}`),
        api.get(`/api/v1/practice/leaderboard?timezone=${encodeURIComponent(timezone)}`)
      ]);

      setCompleted(challengeRes.data.data.completed);
      setLeaderboard(leaderboardRes.data.data.leaderboard);
      setMyScore(leaderboardRes.data.data.myScore);
    } catch (error) {
      console.error("Failed to fetch daily practice details:", error);
      toast.error("Failed to load today's practice data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 60FPS Spiral Particle Loop for Accretion Disk Simulation (Canvas-based)
  useEffect(() => {
    if (loading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI (Retina) screens for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const wordPool = ["vocabulary", "learning", "achieve", "success", "mastery", "knowledge", "intelligence", "practice", "memory", "brain", "gemini", "level", "pronounce", "spelling"];
    
    // Accretion disk text particles (larger, multi-colored HSL)
    const textParticles = Array.from({ length: 18 }).map((_, i) => ({
      text: wordPool[i % wordPool.length],
      angle: Math.random() * Math.PI * 2,
      radius: 80 + Math.random() * 140,
      speed: 0.15 + Math.random() * 0.25,
      rotSpeed: 0.003 + Math.random() * 0.005,
      size: 11 + Math.random() * 6, // 11px to 17px
      hue: Math.floor(Math.random() * 60) + 260, // Purple to Pink (260 to 320)
      opacity: 0.3 + Math.random() * 0.7,
    }));

    // Micro-particle star dust
    const stars = Array.from({ length: 60 }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      radius: 40 + Math.random() * 180,
      speed: 0.3 + Math.random() * 0.6,
      rotSpeed: 0.006 + Math.random() * 0.012,
      size: 0.8 + Math.random() * 1.5,
      hue: Math.floor(Math.random() * 80) + 220, // Blue to Purple
      opacity: 0.2 + Math.random() * 0.8,
    }));

    let active = true;

    const update = () => {
      if (!active) return;

      const currentRect = canvas.getBoundingClientRect();
      const expectedWidth = currentRect.width * dpr;
      const expectedHeight = currentRect.height * dpr;
      if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
        canvas.width = expectedWidth;
        canvas.height = expectedHeight;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, currentRect.width, currentRect.height);

      const drawCx = currentRect.width / 2;
      const drawCy = currentRect.height / 2;

      // 1. Draw Star Dust
      stars.forEach((s) => {
        s.radius -= s.speed;
        s.angle += s.rotSpeed;

        if (s.radius < 25) {
          s.radius = 180 + Math.random() * 50;
          s.angle = Math.random() * Math.PI * 2;
          s.opacity = 0.4 + Math.random() * 0.6;
        }

        let op = s.opacity;
        if (s.radius < 50) {
          op = Math.max(0, ((s.radius - 25) / 25) * s.opacity);
        }

        const sx = Math.cos(s.angle) * s.radius;
        const sy = Math.sin(s.angle) * s.radius;

        ctx.beginPath();
        ctx.arc(drawCx + sx, drawCy + sy, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 100%, 80%, ${op})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = `hsla(${s.hue}, 100%, 60%, 0.5)`;
        ctx.fill();
      });

      // 2. Draw Text Particles
      textParticles.forEach((p) => {
        p.radius -= p.speed;
        p.angle += p.rotSpeed;

        if (p.radius < 25) {
          p.radius = 180 + Math.random() * 50;
          p.angle = Math.random() * Math.PI * 2;
          p.opacity = 0.6 + Math.random() * 0.4;
        }

        let op = p.opacity;
        if (p.radius < 50) {
          op = Math.max(0, ((p.radius - 25) / 25) * p.opacity);
        }

        const x = Math.cos(p.angle) * p.radius;
        const y = Math.sin(p.angle) * p.radius;
        const scale = p.radius / 220;

        ctx.save();
        ctx.translate(drawCx + x, drawCy + y);
        ctx.scale(scale, scale);

        ctx.font = `bold ${p.size}px Inter, system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = `hsla(${p.hue}, 95%, 75%, ${op})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${p.hue}, 95%, 60%, 0.45)`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.text, 0, 0);

        ctx.restore();
      });

      requestAnimationFrame(update);
    };

    const animId = requestAnimationFrame(update);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [loading]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto py-24 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Gamified Black Hole UI (occupies 2/3) */}
      <div className="lg:col-span-2 bg-slate-950 rounded-3xl p-8 border border-purple-950/40 relative overflow-hidden h-[500px] md:h-[600px] flex flex-col items-center justify-between text-white shadow-xl shadow-purple-950/10">
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(88,28,135,0.15),transparent_60%)] pointer-events-none" />
        
        {/* Top Info */}
        <div className="text-center z-10">
          <h2 className="text-3xl font-extrabold flex items-center justify-center gap-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
            <Zap className="w-7 h-7 text-purple-400 fill-purple-400" />
            DAILY CHALLENGE
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            15 Questions • Random Vocab • Dictation, MCQ & Scramble
          </p>
        </div>

        {/* Center Black Hole Particle Container */}
        <div className="relative w-full h-[320px] flex items-center justify-center select-none">
          
          {/* Pulsating Accretion Outer Aura */}
          <div className="absolute w-[200px] h-[200px] rounded-full bg-purple-900/10 blur-2xl animate-pulse" />

          {/* Accretion Disk Rings */}
          <div className="absolute w-[160px] h-[160px] rounded-full border border-purple-500/20 border-dashed animate-[spin_12s_linear_infinite]" />
          <div className="absolute w-[120px] h-[120px] rounded-full border-2 border-indigo-500/10 border-dotted animate-[spin_8s_linear_infinite_reverse]" />

          {/* HTML5 Canvas for Accretion Disk Particles & Star Dust (60 FPS) */}
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none z-10" 
          />

          {/* Event Horizon (Black Hole Center) */}
          <div className="absolute w-[90px] h-[90px] rounded-full bg-black shadow-[0_0_35px_rgba(139,92,246,0.6)] flex items-center justify-center z-20 transition-transform duration-300 hover:scale-105 border border-purple-500/40">
            {completed ? (
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-bold mt-1 uppercase tracking-wider">Done</span>
              </div>
            ) : (
              <button
                onClick={() => navigate("/practice/session")}
                className="w-full h-full rounded-full flex flex-col items-center justify-center cursor-pointer group"
              >
                <Play className="w-7 h-7 text-white fill-white translate-x-0.5 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-[9px] text-purple-300 font-bold uppercase tracking-widest mt-1 opacity-80 group-hover:opacity-100">Ready</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom CTA / Status */}
        <div className="w-full max-w-sm z-10 text-center pb-2">
          {completed ? (
            <div className="bg-slate-900/60 border border-emerald-950/60 rounded-2xl p-4 text-slate-300 text-sm">
              <span className="text-emerald-400 font-bold">✓ Completed!</span> You have completed today's challenge. Your score has been submitted to the leaderboard. Come back tomorrow!
            </div>
          ) : (
            <button
              onClick={() => navigate("/practice/session")}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-extrabold shadow-lg shadow-purple-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 text-base border border-purple-500/20"
            >
              <BrainCircuit className="w-5 h-5" />
              START DAILY CHALLENGE
            </button>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Daily Leaderboard (occupies 1/3) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-[500px] md:h-[600px]">
        <div>
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Leaderboard
            </h3>
            <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-full">
              Today
            </span>
          </div>

          <div className="space-y-3.5 overflow-y-auto max-h-[340px] md:max-h-[420px] pr-1 hide-scrollbar">
            {leaderboard.length > 0 ? (
              leaderboard.map((user) => (
                <div
                  key={user.rank}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    user.isMe
                      ? "bg-purple-50 border-purple-300 shadow-sm ring-1 ring-purple-300/40"
                      : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                        user.rank === 1
                          ? "bg-amber-100 text-amber-600 border border-amber-200"
                          : user.rank === 2
                          ? "bg-slate-200 text-slate-600 border border-slate-300"
                          : user.rank === 3
                          ? "bg-orange-100 text-orange-600 border border-orange-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {user.rank}
                    </div>
                    <div>
                      <span className={`text-sm font-bold block ${user.isMe ? "text-purple-900" : "text-slate-700"}`}>
                        {user.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Score: {user.score.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-emerald-600 font-bold block flex items-center gap-0.5 justify-end">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      {user.correctAnswers}/15
                    </span>
                    <span className="text-slate-400 font-medium flex items-center gap-0.5 justify-end mt-0.5">
                      <Clock className="w-3 h-3 text-slate-300" />
                      {formatTime(user.timeTaken)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                No scores submitted yet. Be the first!
              </div>
            )}
          </div>
        </div>

        {/* Bottom Current User Section */}
        <div className="border-t border-slate-100 pt-4 mt-4">
          {myScore ? (
            <div className="bg-purple-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-base font-black">
                  #{myScore.rank}
                </div>
                <div>
                  <span className="text-xs text-purple-200 font-bold block uppercase tracking-wider">Your Ranking</span>
                  <span className="text-base font-black">Score: {myScore.score.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right text-sm">
                <span className="font-extrabold block">{myScore.correctAnswers}/15 Correct</span>
                <span className="text-xs text-purple-200 font-medium">{formatTime(myScore.timeTaken)}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-500">Play to unlock your rank</span>
              </div>
              <button
                onClick={() => navigate("/practice/session")}
                className="text-xs bg-purple-600 text-white font-extrabold px-3.5 py-2 rounded-xl hover:bg-purple-700 transition-colors shadow-sm cursor-pointer"
              >
                Play Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
