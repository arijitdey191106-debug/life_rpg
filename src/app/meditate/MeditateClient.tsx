"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startMeditationSession, endMeditationSession } from "@/app/actions/meditate";

const MODES = ["BREATHING", "MINDFULNESS", "DEEP_CALM", "SLEEP"];
const DURATIONS = [5, 10, 15, 20, 30];

// Ambient audio mapping
const AUDIO_SOURCES: Record<string, string> = {
  BREATHING: "https://cdn.pixabay.com/download/audio/2022/11/22/audio_d1718ab025.mp3?filename=ambient-piano-amp-strings-10711.mp3",
  MINDFULNESS: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_965005b63b.mp3?filename=relaxing-mountains-rivers-streams-10667.mp3",
  DEEP_CALM: "https://cdn.pixabay.com/download/audio/2022/05/16/audio_29cc040c77.mp3?filename=ambient-classical-guitar-11116.mp3",
  SLEEP: "https://cdn.pixabay.com/download/audio/2021/11/24/audio_34b3e64fc5.mp3?filename=night-ambience-17064.mp3"
};

export default function MeditateClient({ equippedEffects }: { equippedEffects: string[] }) {
  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]); // minutes
  
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [rewardData, setRewardData] = useState<{xp: number, gold: number} | null>(null);
  const [loading, setLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft <= 0) {
      handleEnd(true);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Audio control
  useEffect(() => {
    if (isActive && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    } else if (!isActive && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isActive, selectedMode]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await startMeditationSession(selectedMode, selectedDuration);
      if (res.success) {
        setSessionId(res.sessionId);
        setTimeLeft(selectedDuration * 60);
        setIsActive(true);
        setRewardData(null);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleEnd = async (completed: boolean) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await endMeditationSession(sessionId, completed);
      if (res.success) {
        setIsActive(false);
        setSessionId(null);
        if (completed && res.xpReward > 0) {
          setRewardData({ xp: res.xpReward, gold: res.goldReward });
        }
      }
    } catch (error) {
      console.error(error);
      setIsActive(false); // abort anyway on error
    }
    setLoading(false);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const hasZenAura = equippedEffects.includes("ZEN AURA");

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 w-full overflow-hidden bg-[#020205]">
      
      {hasZenAura && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full bg-indigo-500 blur-3xl opacity-20"
          />
        </div>
      )}

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={AUDIO_SOURCES[selectedMode]} 
        loop 
        className="hidden" 
      />

      <div className="z-10 w-full max-w-lg p-8 glass-panel rounded-3xl flex flex-col items-center">
        
        {!isActive && !rewardData && (
          <>
            <h1 className="text-3xl font-light text-white mb-8 tracking-widest">SANCTUARY</h1>
            
            <div className="w-full space-y-6">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Meditation Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {MODES.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        selectedMode === mode 
                          ? 'bg-primary/30 border-primary text-primary glow-border' 
                          : 'bg-surface border-transparent text-gray-400 hover:bg-surface/80 border'
                      }`}
                    >
                      {mode.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Duration</label>
                <div className="flex space-x-2">
                  {DURATIONS.map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setSelectedDuration(dur)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedDuration === dur
                          ? 'bg-secondary/30 border-secondary text-secondary glow-border'
                          : 'bg-surface border-transparent text-gray-400 hover:bg-surface/80 border'
                      }`}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={handleStart}
                disabled={loading}
                className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-light tracking-widest py-4 px-6 rounded-xl transition-all border border-white/10 hover:border-white/30"
              >
                {loading ? "PREPARING..." : "BEGIN"}
              </button>
            </div>
          </>
        )}

        {isActive && (
          <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: selectedMode === "BREATHING" ? 8 : 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-32 h-32 rounded-full border border-primary/50 shadow-[0_0_30px_rgba(138,43,226,0.3)] flex items-center justify-center mb-12"
            >
              <div className="w-24 h-24 rounded-full bg-primary/20 blur-md" />
            </motion.div>
            
            <div className="text-5xl font-extralight text-white/90 tabular-nums mb-8 tracking-widest">
              {formatTime(timeLeft)}
            </div>
            
            <button 
              onClick={() => handleEnd(false)}
              className="text-gray-500 hover:text-white/80 text-sm tracking-widest uppercase transition-colors"
            >
              End Early
            </button>
          </div>
        )}

        {rewardData && !isActive && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center w-full space-y-6 py-8"
          >
            <h2 className="text-2xl font-light text-white tracking-widest">SESSION COMPLETE</h2>
            <div className="flex space-x-8 text-lg font-light">
              <p className="text-primary">+{rewardData.xp} XP</p>
              <p className="text-yellow-400">+{rewardData.gold} Gold</p>
            </div>
            <button 
              onClick={() => setRewardData(null)}
              className="mt-8 w-full bg-surface border border-white/20 text-white font-light py-3 px-6 rounded-xl transition-colors hover:bg-white/10"
            >
              RETURN
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
