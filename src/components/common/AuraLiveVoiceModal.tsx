import React, { useState, useEffect, useRef } from 'react';
import { AuraRobotCanvas } from './AuraRobotCanvas';
import { useAuraRobotController } from '../../hooks/useAuraRobotController';

interface AuraLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuraLiveVoiceModal: React.FC<AuraLiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const { RiveComponent, currentState, setRobotState, getGlowToken } = useAuraRobotController();
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [subtitleMode, setSubtitleMode] = useState<'EN' | 'EN_VI' | 'OFF'>('EN_VI');
  
  // Interactive Text & Translation State
  const [currentEnText, setCurrentEnText] = useState<string>("Hello there! I'm Aura. Tap the microphone and say something in English!");
  const [currentViText, setCurrentViText] = useState<string>("Xin chào! Tôi là Aura. Bấm mic và nói gì đó bằng Tiếng Anh nhé!");
  
  // Click-to-lookup Word Popup State
  const [selectedWord, setSelectedWord] = useState<{ word: string; translation: string; ipa: string; position: { x: number; y: number } } | null>(null);

  // Show Hint Dock State
  const [showHintDock, setShowHintDock] = useState<boolean>(false);

  // Real Web Speech Recognition & Audio Spectrum State
  const [isListeningRec, setIsListeningRec] = useState<boolean>(false);
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sound FX Helper (Micro-interaction Sounds)
  const playSoundEffect = (type: 'pop' | 'success' | 'fail') => {
    if (isMuted || !('AudioContext' in window || 'webkitAudioContext' in window)) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'pop') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'fail') {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      // Ignore audio autoplay restrictions
    }
  };

  // Web SpeechSynthesis TTS Function (Robot Speaking)
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechSpeed;
    utterance.lang = 'en-US';

    setRobotState('TALKING');
    utterance.onend = () => setRobotState('IDLE');
    utterance.onerror = () => setRobotState('IDLE');

    window.speechSynthesis.speak(utterance);
  };

  // Real Audio Spectrum Microphone Analyzer (Web Audio API)
  const startAudioSpectrum = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setLiveVolume(Math.min(100, Math.round(avg * 1.5)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.warn("Audio spectrum permission or context failed:", e);
    }
  };

  const stopAudioSpectrum = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setLiveVolume(0);
  };

  // Initialize Web Speech Recognition (Real Voice Recording)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn chưa hỗ trợ Web Speech API. Hãy sử dụng Chrome hoặc Edge!");
      return;
    }

    if (isListeningRec) {
      if (recognitionRef.current) recognitionRef.current.stop();
      stopAudioSpectrum();
      setIsListeningRec(false);
      setRobotState('IDLE');
    } else {
      playSoundEffect('pop');
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListeningRec(true);
        setRobotState('LISTENING');
        startAudioSpectrum();
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setCurrentEnText(transcript);
        setCurrentViText("Đang nhận diện giọng nói của bạn...");
      };

      recognition.onend = () => {
        stopAudioSpectrum();
        setIsListeningRec(false);
        setRobotState('THINKING');

        // Mock AI Dispatcher Response Generator (Ready for Backend API Swap)
        setTimeout(() => {
          playSoundEffect('success');
          setRobotState('CELEBRATE');
          const mockResponses = [
            { en: "Fantastic pronunciation! That sounded very natural!", vi: "Phát âm tuyệt vời! Nghe rất tự nhiên!" },
            { en: "Great effort! I really like how clear your speech was!", vi: "Nỗ lực tuyệt vời! Tôi rất thích cách bạn nói rõ ràng!" },
            { en: "Spot on! Your English speaking skills are improving fast!", vi: "Chính xác! Kỹ năng nói Tiếng Anh của bạn đang tiến bộ rất nhanh!" },
          ];
          const randomRes = mockResponses[Math.floor(Math.random() * mockResponses.length)];
          setCurrentEnText(randomRes.en);
          setCurrentViText(randomRes.vi);
          speakText(randomRes.en);
        }, 1200);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // Fill Hint text into user prompt and start real recording!
  const selectHintQuestion = (questionText: string) => {
    setShowHintDock(false);
    setCurrentEnText(questionText);
    setCurrentViText("Hãy tự mình phát âm câu gợi ý này nhé!");
    playSoundEffect('pop');
    toggleSpeechRecognition();
  };

  // Click-to-Lookup Dictionary Handler (Mocking UI, Ready for Backend Lookup Endpoint)
  const lookupWord = (rawWord: string, e: React.MouseEvent) => {
    const clean = rawWord.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (!clean) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    
    const dict: Record<string, { vi: string; ipa: string }> = {
      hello: { vi: 'Xin chào', ipa: '/həˈloʊ/' },
      aura: { vi: 'Hào quang / Tên Trợ lý AI Aura', ipa: '/ˈɔːrə/' },
      speak: { vi: 'Nói chuyện / Phát âm', ipa: '/spiːk/' },
      english: { vi: 'Tiếng Anh', ipa: '/ˈɪŋɡlɪʃ/' },
      pronunciation: { vi: 'Sự phát âm chuẩn', ipa: '/prəˌnʌn.siˈeɪ.ʃən/' },
      awesome: { vi: 'Tuyệt vời / Xuất sắc', ipa: '/ˈɔː.səm/' },
      fantastic: { vi: 'Tuyệt diệu / Tuyệt vời', ipa: '/fænˈtæs.tɪk/' },
    };

    const info = dict[clean] || { vi: `Nghĩa của từ "${clean}"`, ipa: `/${clean}/` };

    setSelectedWord({
      word: clean,
      translation: info.vi,
      ipa: info.ipa,
      position: { x: rect.left + rect.width / 2, y: rect.top - 10 },
    });
  };

  if (!isOpen) return null;

  const hintQuestions = [
    "Can you explain that topic again in simpler words?",
    "I think this topic is very interesting! What do you think?",
    "Could you give me an example sentence for this word?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      {/* Click-to-Lookup Popup (GlotDojo / eJOY Style) */}
      {selectedWord && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full bg-slate-900 text-white border border-purple-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-fade-in min-w-[170px]"
          style={{ left: selectedWord.position.x, top: selectedWord.position.y }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1">
            <span className="font-bold text-purple-300 capitalize">{selectedWord.word}</span>
            <span className="text-[10px] text-slate-400 font-mono">{selectedWord.ipa}</span>
            <button
              onClick={() => speakText(selectedWord.word)}
              className="text-xs hover:scale-110 transition-transform"
              title="Phát âm từ này"
            >
              🔊
            </button>
          </div>
          <p className="text-xs text-slate-200 font-medium">{selectedWord.translation}</p>
          <button
            onClick={() => setSelectedWord(null)}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-xs flex items-center justify-center border border-slate-700 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <div className="relative w-full max-w-[540px] bg-slate-900/95 border border-slate-800/90 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between min-h-[540px]">
        
        {/* Tier 1: Top Bar */}
        <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4">
          {/* Speed Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Speed:</span>
            {[0.8, 1.0, 1.2].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeechSpeed(spd)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                  speechSpeed === spd
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Subtitle Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-full border border-slate-700/50">
            {(['EN', 'EN_VI', 'OFF'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSubtitleMode(mode)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  subtitleMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'EN_VI' ? 'EN+VI' : mode}
              </button>
            ))}
          </div>

          {/* Mute & Close Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tier 2: Center Stage (Robot + Real Audio Spectrum + Interactive Subtitle) */}
        <div className="flex flex-col items-center my-4 w-full relative">
          
          {/* Real Audio Volume Wave Rings Overlay */}
          {isListeningRec && liveVolume > 0 && (
            <div
              className="absolute top-10 rounded-full border-2 border-cyan-400/60 animate-ping pointer-events-none transition-all duration-100"
              style={{
                width: `${200 + liveVolume * 1.2}px`,
                height: `${200 + liveVolume * 1.2}px`,
              }}
            />
          )}

          <AuraRobotCanvas
            RiveComponent={RiveComponent}
            glowColor={getGlowToken()}
            size={240}
          />

          {/* Interactive Subtitle Speech Bubble (GlotDojo/eJOY Style) */}
          {subtitleMode !== 'OFF' && (
            <div className="mt-3 w-full bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 text-center shadow-lg backdrop-blur-md">
              {/* English Tokens */}
              <div className="flex flex-wrap justify-center gap-1.5 text-sm font-semibold text-slate-100">
                {currentEnText.split(' ').map((word, idx) => (
                  <span
                    key={idx}
                    onClick={(e) => lookupWord(word, e)}
                    className="cursor-pointer hover:text-purple-400 hover:underline transition-colors px-0.5 rounded hover:bg-purple-950/50"
                  >
                    {word}
                  </span>
                ))}
              </div>

              {/* Vietnamese Translation (if EN_VI enabled) */}
              {subtitleMode === 'EN_VI' && (
                <p className="mt-2 text-xs font-medium text-slate-400 border-t border-slate-700/40 pt-2">
                  {currentViText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Corrected Prompt Hint Cards Dock (No "Tap to say" nonsense!) */}
        {showHintDock && (
          <div className="w-full mb-3 space-y-1.5 animate-fade-in border-t border-slate-800 pt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">💡 Suggested Prompt Ideas (Tap to fill &amp; speak):</span>
            {hintQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => selectHintQuestion(q)}
                className="w-full text-left text-xs bg-purple-950/40 border border-purple-500/30 text-purple-200 p-2.5 rounded-xl hover:bg-purple-900/60 transition-all font-medium flex items-center justify-between group"
              >
                <span>🔹 &quot;{q}&quot;</span>
                <span className="text-[10px] text-purple-400 group-hover:text-purple-200">Tap to record 🎙️</span>
              </button>
            ))}
          </div>
        )}

        {/* Tier 3: Bottom Dock (Action Bar) */}
        <div className="w-full flex items-center justify-between border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setShowHintDock(!showHintDock)}
            className={`text-xs font-bold px-3.5 py-2 rounded-full transition-colors flex items-center gap-1 ${
              showHintDock
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-purple-400 hover:bg-slate-700'
            }`}
          >
            💡 Show Hint
          </button>

          {/* Real Web Speech Recognition Mic Button */}
          <button
            onClick={toggleSpeechRecognition}
            className={`px-6 py-3 rounded-full font-bold text-sm shadow-xl transition-all flex items-center gap-2 ${
              isListeningRec
                ? 'bg-cyan-400 text-slate-950 animate-pulse scale-105 shadow-cyan-500/30'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
            }`}
          >
            {isListeningRec ? '🎙️ Listening... (Speak now)' : '🎤 Tap to Speak'}
          </button>
        </div>

      </div>
    </div>
  );
};
