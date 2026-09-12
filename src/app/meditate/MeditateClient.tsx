"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startMeditationSession, endMeditationSession } from "@/app/actions/meditate";
import { useAudio } from "@/components/AudioProvider";
import DeepSpaceEnv from "./environments/DeepSpaceEnv";
import RainEnv from "./environments/RainEnv";
import ForestEnv from "./environments/ForestEnv";
import EmberEnv from "./environments/EmberEnv";
import OceanEnv from "./environments/OceanEnv";
import NightEnv from "./environments/NightEnv";

const SOUNDSCAPES = ["DEEP SPACE", "RAIN", "FOREST", "EMBER", "OCEAN", "NIGHT"];
const DURATIONS = [3, 5, 10, 15, 20, 30];



export default function MeditateClient({ equippedEffects }: { equippedEffects: string[] }) {
  const [selectedMode, setSelectedMode] = useState(SOUNDSCAPES[0]);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1]); // minutes
  
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [rewardData, setRewardData] = useState<{xp: number, gold: number} | null>(null);
  const [loading, setLoading] = useState(false);
  
  const audio = useAudio();

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
    if (isActive) {
      audio.playMeditationTrack(selectedMode);
    } else {
      audio.stopMeditationTrack();
    }
  }, [isActive, selectedMode, audio]);

  const handleStart = async () => {
    audio.playClick();
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
    audio.playClick();
    setLoading(true);
    try {
      const res = await endMeditationSession(sessionId, completed);
      if (res.success) {
        setIsActive(false);
        setSessionId(null);
        if (completed && res.xpReward > 0) {
          audio.playSuccess();
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

      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatePresence>
          {selectedMode === "DEEP SPACE" && (
            <motion.div key="deepspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
              <DeepSpaceEnv />
            </motion.div>
          )}
          {selectedMode === "RAIN" && (
            <motion.div key="rain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
              <RainEnv />
            </motion.div>
          )}
          {selectedMode === "FOREST" && (
            <motion.div key="forest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
              <ForestEnv />
            </motion.div>
          )}
          {selectedMode === "EMBER" && (
            <motion.div key="ember" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
              <EmberEnv />
            </motion.div>
          )}
          {selectedMode === "OCEAN" && (
            <motion.div key="ocean" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
              <OceanEnv />
            </motion.div>
          )}
          {selectedMode === "NIGHT" && (
            <motion.div key="night" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
              <NightEnv />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="z-10 w-full max-w-lg p-8 glass-panel bg-black/40 backdrop-blur-xl rounded-3xl flex flex-col items-center shadow-2xl">
        
        {!isActive && !rewardData && (
          <>
            <h1 className="text-3xl font-light text-white mb-8 tracking-widest">SANCTUARY</h1>
            
            <div className="w-full space-y-6">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Meditation Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {SOUNDSCAPES.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        selectedMode === mode 
                          ? 'bg-primary/30 border-primary text-primary glow-border' 
                          : 'bg-surface border-transparent text-gray-400 hover:bg-surface/80 border'
                      }`}
                    >
                      {mode}
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

        {isActive && !rewardData && (
          <div className="flex flex-col items-center w-full space-y-12">
            
            {/* Breathing Animation */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <motion.div
                animate={{
                  scale: [1, 1.5, 1.5, 1],
                  opacity: [0.3, 0.7, 0.7, 0.3],
                }}
                transition={{
                  duration: 14, // 4s in, 4s hold, 6s out
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.285, 0.571, 1] // 0s, 4s, 8s, 14s
                }}
                className="absolute inset-0 rounded-full border border-primary/50"
              />
              {/* Inner glowing circle */}
              <motion.div
                animate={{
                  scale: [0.5, 1.2, 1.2, 0.5],
                  backgroundColor: ['rgba(138,43,226,0.1)', 'rgba(138,43,226,0.4)', 'rgba(138,43,226,0.4)', 'rgba(138,43,226,0.1)'],
                }}
                transition={{
                  duration: 14,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.285, 0.571, 1]
                }}
                className="w-full h-full rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(138,43,226,0.3)] backdrop-blur-sm"
              >
                <motion.div
                  animate={{ opacity: [1, 0, 1, 0, 1, 0] }}
                  transition={{ duration: 14, repeat: Infinity, times: [0, 0.1, 0.285, 0.385, 0.571, 0.671] }}
                  className="text-white/80 font-mono tracking-widest uppercase text-sm font-bold"
                >
                  Breathe
                </motion.div>
              </motion.div>
            </div>

            <div className="text-6xl font-light text-white tabular-nums tracking-tight">
              {formatTime(timeLeft)}
            </div>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / (selectedDuration * 60)) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>

            <button 
              onClick={() => handleEnd(false)}
              disabled={loading}
              className="px-6 py-2 rounded-full border border-white/20 text-white/50 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold"
            >
              {loading ? "Ending..." : "END EARLY"}
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
