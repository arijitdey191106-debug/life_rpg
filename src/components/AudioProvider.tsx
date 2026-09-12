"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { getUserSettings } from "@/actions/settings"

type AudioContextType = {
  playClick: () => void
  playHover: () => void
  playQuestAccepted: () => void
  playSuccess: () => void
  playLevelUp: () => void
  playAmbient: () => void
  stopAmbient: () => void
  updateVolume: (settings: {
    masterVolume: number
    uiVolume: number
    ambientVolume: number
    rewardVolume: number
    meditationVolume: number
    isMuted: boolean
    reducedMotion: boolean
  }) => void
  playMeditationTrack: (trackName: string) => void
  stopMeditationTrack: () => void
  settings: {
    masterVolume: number
    uiVolume: number
    ambientVolume: number
    rewardVolume: number
    meditationVolume: number
    isMuted: boolean
    reducedMotion: boolean
  }
}

const AudioContext = createContext<AudioContextType | null>(null)

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error("useAudio must be used within an AudioProvider")
  return ctx
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState({
    masterVolume: 100,
    uiVolume: 100,
    ambientVolume: 100,
    rewardVolume: 100,
    meditationVolume: 100,
    isMuted: false,
    reducedMotion: false,
  })

  // We lazily create AudioContext upon first user interaction to avoid autoplay policies
  const audioCtxRef = useRef<AudioContext | null>(null)

  const initAudio = () => {
    if (typeof window !== "undefined" && !audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass()
      }
    }
  }

  useEffect(() => {
    getUserSettings().then((user) => {
      if (user) {
        setSettings({
          masterVolume: user.masterVolume ?? 100,
          uiVolume: user.uiVolume ?? 100,
          ambientVolume: user.ambientVolume ?? 100,
          rewardVolume: user.rewardVolume ?? 100,
          meditationVolume: (user as any).meditationVolume ?? 100,
          isMuted: user.isMuted ?? false,
          reducedMotion: user.reducedMotion ?? false,
        })
      }
    })

    const handleInteraction = () => initAudio()
    window.addEventListener("click", handleInteraction, { once: true })
    window.addEventListener("keydown", handleInteraction, { once: true })
    return () => {
      window.removeEventListener("click", handleInteraction)
      window.removeEventListener("keydown", handleInteraction)
    }
  }, [])

  const updateVolume = (newSettings: typeof settings) => {
    setSettings(newSettings)
  }

  const playOscillator = (freq: number, type: OscillatorType, duration: number, volMultiplier: number, category: "ui" | "reward") => {
    if (settings.isMuted) return
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return

    const baseVol = settings.masterVolume / 100
    const catVol = category === "ui" ? settings.uiVolume / 100 : settings.rewardVolume / 100
    const finalVol = baseVol * catVol * volMultiplier

    if (finalVol <= 0) return

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(finalVol, ctx.currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  const playHover = () => {
    playOscillator(800, "sine", 0.05, 0.05, "ui")
  }

  const playClick = () => {
    playOscillator(400, "sine", 0.1, 0.2, "ui")
  }

  const playQuestAccepted = () => {
    if (settings.isMuted) return
    playOscillator(330, "triangle", 0.2, 0.15, "ui")
    setTimeout(() => playOscillator(440, "triangle", 0.3, 0.15, "ui"), 100)
  }

  const playSuccess = () => {
    if (settings.isMuted) return
    playOscillator(440, "sine", 0.4, 0.2, "reward")
    setTimeout(() => playOscillator(554.37, "sine", 0.4, 0.2, "reward"), 100)
    setTimeout(() => playOscillator(659.25, "sine", 0.6, 0.2, "reward"), 200)
  }

  const playLevelUp = () => {
    if (settings.isMuted) return
    playOscillator(523.25, "square", 0.5, 0.1, "reward")
    setTimeout(() => playOscillator(659.25, "square", 0.5, 0.1, "reward"), 150)
    setTimeout(() => playOscillator(783.99, "square", 0.8, 0.1, "reward"), 300)
    setTimeout(() => playOscillator(1046.50, "square", 1.0, 0.1, "reward"), 450)
  }

  const ambientOscillators = useRef<{osc1: OscillatorNode, osc2: OscillatorNode, gain: GainNode} | null>(null)

  const playAmbient = () => {
    if (settings.isMuted || settings.ambientVolume === 0) return
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx || ambientOscillators.current) return

    const baseVol = settings.masterVolume / 100
    const catVol = settings.ambientVolume / 100
    const finalVol = baseVol * catVol * 0.05 // low volume for ambient

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc1.type = "sine"
    osc1.frequency.value = 55 // low A
    osc2.type = "triangle"
    osc2.frequency.value = 55.5 // slight detune

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(finalVol, ctx.currentTime + 2) // fade in

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc1.start()
    osc2.start()

    ambientOscillators.current = { osc1, osc2, gain: gainNode }
  }

  const stopAmbient = () => {
    const ctx = audioCtxRef.current
    const ambient = ambientOscillators.current
    if (!ctx || !ambient) return

    ambient.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2) // fade out
    setTimeout(() => {
      ambient.osc1.stop()
      ambient.osc2.stop()
      ambient.osc1.disconnect()
      ambient.osc2.disconnect()
      ambient.gain.disconnect()
      ambientOscillators.current = null
    }, 2100)
  }

  const currentMeditationAudio = useRef<HTMLAudioElement | null>(null);

  const playMeditationTrack = (trackName: string) => {
    if (settings.isMuted || settings.meditationVolume === 0) return;
    const baseVol = (settings.masterVolume / 100) * (settings.meditationVolume / 100);
    
    // Convert generic mode names to file names, e.g. "DEEP SPACE" to "deep-space"
    const fileName = trackName.toLowerCase().replace(/ /g, '-');
    const nextAudio = new Audio(`/audio/meditation/${fileName}.mp3`);
    nextAudio.loop = true;
    nextAudio.volume = 0; // Start silent for fade in
    
    nextAudio.play().catch(e => console.error("Audio play failed", e));
    
    // Crossfade
    const fadeDuration = 2000;
    const steps = 20;
    const stepTime = fadeDuration / steps;
    const volStep = baseVol / steps;

    if (currentMeditationAudio.current) {
      const prevAudio = currentMeditationAudio.current;
      let prevVol = prevAudio.volume;
      const prevVolStep = prevVol / steps;
      
      let step = 0;
      const fadeInterval = setInterval(() => {
        step++;
        if (prevAudio) {
          prevVol = Math.max(0, prevVol - prevVolStep);
          prevAudio.volume = prevVol;
        }
        if (nextAudio) {
          nextAudio.volume = Math.min(baseVol, nextAudio.volume + volStep);
        }
        
        if (step >= steps) {
          clearInterval(fadeInterval);
          prevAudio.pause();
          prevAudio.currentTime = 0;
        }
      }, stepTime);
    } else {
      let step = 0;
      const fadeInterval = setInterval(() => {
        step++;
        if (nextAudio) {
          nextAudio.volume = Math.min(baseVol, nextAudio.volume + volStep);
        }
        if (step >= steps) {
          clearInterval(fadeInterval);
        }
      }, stepTime);
    }
    
    currentMeditationAudio.current = nextAudio;
  };

  const stopMeditationTrack = () => {
    if (currentMeditationAudio.current) {
      const audio = currentMeditationAudio.current;
      const fadeDuration = 2000;
      const steps = 20;
      const stepTime = fadeDuration / steps;
      let currentVol = audio.volume;
      const volStep = currentVol / steps;
      
      let step = 0;
      const fadeInterval = setInterval(() => {
        step++;
        currentVol = Math.max(0, currentVol - volStep);
        audio.volume = currentVol;
        if (step >= steps) {
          clearInterval(fadeInterval);
          audio.pause();
          audio.currentTime = 0;
          currentMeditationAudio.current = null;
        }
      }, stepTime);
    }
  };

  return (
    <AudioContext.Provider value={{
      playClick, playHover, playQuestAccepted, playSuccess, playLevelUp, playAmbient, stopAmbient, playMeditationTrack, stopMeditationTrack, updateVolume, settings
    }}>
      {children}
    </AudioContext.Provider>
  )
}
