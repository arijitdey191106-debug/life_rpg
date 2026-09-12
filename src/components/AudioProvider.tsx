"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { getUserSettings } from "@/actions/settings"

type AudioContextType = {
  playClick: () => void
  playSuccess: () => void
  playLevelUp: () => void
  playAmbient: () => void
  stopAmbient: () => void
  updateVolume: (settings: {
    masterVolume: number
    uiVolume: number
    ambientVolume: number
    rewardVolume: number
    isMuted: boolean
    reducedMotion: boolean
  }) => void
  settings: {
    masterVolume: number
    uiVolume: number
    ambientVolume: number
    rewardVolume: number
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
          masterVolume: user.masterVolume,
          uiVolume: user.uiVolume,
          ambientVolume: user.ambientVolume,
          rewardVolume: user.rewardVolume,
          isMuted: user.isMuted,
          reducedMotion: user.reducedMotion,
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

  const playClick = () => {
    playOscillator(400, "sine", 0.1, 0.2, "ui")
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

  const playAmbient = () => {}
  const stopAmbient = () => {}

  return (
    <AudioContext.Provider value={{
      playClick, playSuccess, playLevelUp, playAmbient, stopAmbient, updateVolume, settings
    }}>
      {children}
    </AudioContext.Provider>
  )
}
