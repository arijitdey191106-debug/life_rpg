"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startFocusSession, endFocusSession } from "@/app/actions/focus";
import { useRouter } from "next/navigation";
import { useAudio } from "@/components/AudioProvider";

export default function FocusClient({ equippedEffects }: { equippedEffects: string[] }) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [plannedDuration, setPlannedDuration] = useState(25); // minutes
  const [interruptions, setInterruptions] = useState(0);
  const [rewardData, setRewardData] = useState<{xp: number, gold: number} | null>(null);
  const [loading, setLoading] = useState(false);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showEndEarlyModal, setShowEndEarlyModal] = useState(false);

  const router = useRouter();
  const audio = useAudio();

  // Visibility tracking
  useEffect(() => {
    if (!isActive) return;

    const handleInterruption = () => {
      if (document.hidden || !document.hasFocus()) {
        if (!showWarningModal && !showEndEarlyModal) {
          setInterruptions((prev) => prev + 1);
          setIsPaused(true);
          setShowWarningModal(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleInterruption);
    window.addEventListener("blur", handleInterruption);
    return () => {
      document.removeEventListener("visibilitychange", handleInterruption);
      window.removeEventListener("blur", handleInterruption);
    };
  }, [isActive, showWarningModal, showEndEarlyModal]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isPaused && !showWarningModal && !showEndEarlyModal) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, showWarningModal, showEndEarlyModal]);

  // Auto end when time is up
  useEffect(() => {
     const totalSeconds = plannedDuration * 60;
     if (isActive && secondsElapsed >= totalSeconds && !loading) {
         handleEnd("COMPLETED", false);
     }
  }, [isActive, secondsElapsed, plannedDuration, loading]);

  const handleStart = async () => {
    audio.playClick();
    setLoading(true);
    try {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      const res = await startFocusSession(plannedDuration);
      if (res.success) {
        setSessionId(res.sessionId);
        setIsActive(true);
        setSecondsElapsed(0);
        setInterruptions(0);
        setRewardData(null);
        setIsPaused(false);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleEnd = async (status: "COMPLETED" | "ABORTED", abandoned: boolean = false) => {
    if (!sessionId) return;
    audio.playClick();
    setLoading(true);
    try {
      const res = await endFocusSession(sessionId, secondsElapsed, interruptions, status, abandoned);
      if (res.success) {
        setIsActive(false);
        setSessionId(null);
        setShowWarningModal(false);
        setShowEndEarlyModal(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.error(err));
        }
        if (status === "COMPLETED" && !res.penaltyApplied) {
          audio.playSuccess();
          setRewardData({ xp: res.xpReward, gold: res.goldReward });
        } else {
          setRewardData(null);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const totalSeconds = plannedDuration * 60;
  const timeLeft = Math.max(0, totalSeconds - secondsElapsed);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isStarfield = equippedEffects.includes("STARFIELD");

  return (
    <div className={`relative flex flex-col items-center justify-center flex-1 w-full overflow-hidden ${isStarfield ? 'bg-black' : ''}`}>
      {isStarfield && (
        <div className="absolute inset-0 z-0 opacity-50 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0))',
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px'
        }} />
      )}
      
      <div className="z-10 w-full max-w-md p-8 glass-panel rounded-2xl flex flex-col items-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold glow-text text-primary mb-2"
        >
          FOCUS MODE
        </motion.h1>
        <p className="text-gray-400 mb-8 uppercase tracking-widest text-sm">Deep Work</p>

        {!isActive && !rewardData && (
          <div className="flex flex-col items-center w-full space-y-6">
            <div className="flex flex-col items-center w-full">
              <label htmlFor="duration" className="text-sm text-gray-300 mb-2">Duration (Minutes)</label>
              <input 
                id="duration"
                type="number" 
                value={plannedDuration}
                onChange={(e) => setPlannedDuration(Number(e.target.value))}
                min={5}
                max={120}
                className="bg-[#0f0f16] border border-[#2a2a35] rounded-md px-4 py-2 text-center text-xl text-white w-32 focus:outline-none focus:border-primary transition-colors"
                aria-label="Focus Duration in Minutes"
              />
            </div>
            
            <button 
              onClick={handleStart}
              disabled={loading}
              className="w-full bg-primary hover:bg-opacity-80 text-white font-bold py-3 px-6 rounded-lg transition-all glow-border"
            >
              {loading ? "Starting..." : "INITIATE FOCUS"}
            </button>
          </div>
        )}

        {isActive && !showWarningModal && !showEndEarlyModal && (
          <div className="flex flex-col items-center w-full space-y-8">
            <div className="text-7xl font-light text-white tabular-nums tracking-tight">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex flex-col items-center text-sm text-gray-400">
              <p>Interruptions: {interruptions}</p>
            </div>

            <div className="flex w-full space-x-4">
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="flex-1 bg-surface border border-gray-700 hover:border-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isPaused ? "RESUME" : "PAUSE"}
              </button>
            </div>
            
            <button 
              onClick={() => {
                setIsPaused(true);
                setShowEndEarlyModal(true);
              }}
              className="text-red-400 hover:text-red-300 text-sm mt-4 transition-colors"
            >
              END EARLY
            </button>
          </div>
        )}

        {showWarningModal && (
          <div className="flex flex-col items-center w-full space-y-6 text-center">
            <h2 className="text-xl font-bold text-red-500">FOCUS INTERRUPTED</h2>
            <p className="text-gray-300">Leaving will end your session and apply an early-exit penalty.</p>
            <div className="flex w-full space-x-4">
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  setIsPaused(false);
                }}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-opacity-80 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                RETURN TO FOCUS
              </button>
              <button 
                onClick={() => handleEnd("ABORTED", true)}
                disabled={loading}
                className="flex-1 bg-surface border border-red-500 text-red-500 hover:bg-red-500/10 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                END FOCUS
              </button>
            </div>
          </div>
        )}

        {showEndEarlyModal && (
          <div className="flex flex-col items-center w-full space-y-6 text-center">
            <h2 className="text-xl font-bold text-red-500">END EARLY?</h2>
            <p className="text-gray-300">Ending now will apply an XP penalty and you will lose any completion rewards.</p>
            <div className="flex w-full space-x-4">
              <button 
                onClick={() => {
                  setShowEndEarlyModal(false);
                  setIsPaused(false);
                }}
                disabled={loading}
                className="flex-1 bg-surface border border-gray-700 hover:border-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={() => handleEnd("ABORTED", true)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                CONFIRM END EARLY
              </button>
            </div>
          </div>
        )}

        {rewardData && !isActive && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center w-full space-y-4"
          >
            <h2 className="text-2xl font-bold text-green-400">SESSION COMPLETE</h2>
            <div className="flex space-x-6 text-xl">
              <p className="text-primary">+{rewardData.xp} XP</p>
              <p className="text-yellow-400">+{rewardData.gold} Gold</p>
            </div>
            <button 
              onClick={() => setRewardData(null)}
              className="mt-6 w-full bg-surface border border-primary text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-primary/20"
            >
              CONTINUE
            </button>
          </motion.div>
        )}

      </div>
      
      <button 
        onClick={toggleFullScreen}
        className="absolute bottom-6 right-6 text-gray-500 hover:text-white transition-colors"
        aria-label="Toggle Fullscreen"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  );
}
