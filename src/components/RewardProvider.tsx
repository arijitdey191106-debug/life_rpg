"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

type RewardType = "XP" | "GOLD" | "ATTRIBUTE"

interface RewardEvent {
  id: string
  type: RewardType
  amount: number | string
  label?: string
  x: number
  y: number
}

interface RewardContextType {
  triggerReward: (type: RewardType, amount: number | string, x: number, y: number, label?: string) => void
}

const RewardContext = createContext<RewardContextType | null>(null)

export function useReward() {
  const ctx = useContext(RewardContext)
  if (!ctx) throw new Error("useReward must be used within RewardProvider")
  return ctx
}

export function RewardProvider({ children }: { children: React.ReactNode }) {
  const [rewards, setRewards] = useState<RewardEvent[]>([])

  const triggerReward = useCallback((type: RewardType, amount: number | string, x: number, y: number, label?: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setRewards(prev => [...prev, { id, type, amount, label, x, y }])
    
    // Remove after animation completes
    setTimeout(() => {
      setRewards(prev => prev.filter(r => r.id !== id))
    }, 2000)
  }, [])

  return (
    <RewardContext.Provider value={{ triggerReward }}>
      {children}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <AnimatePresence>
          {rewards.map(reward => (
            <motion.div
              key={reward.id}
              initial={{ 
                opacity: 0, 
                x: reward.x, 
                y: reward.y,
                scale: 0.5 
              }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                y: reward.y - 150,
                x: reward.x + (Math.random() * 40 - 20),
                scale: [0.5, 1.2, 1, 0.8]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`absolute font-bold font-mono text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] ${
                reward.type === "XP" ? "text-primary glow-text" : 
                reward.type === "GOLD" ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : 
                "text-white"
              }`}
            >
              +{reward.amount} {reward.type === "ATTRIBUTE" && reward.label ? reward.label : reward.type}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </RewardContext.Provider>
  )
}
