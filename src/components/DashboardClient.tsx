"use client"

import { motion } from "framer-motion"
import { Swords, Trophy, Flame, Coins, Star, ChevronRight, Target, Wind, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface DashboardProps {
  username: string
  level: number
  currentLevelXp: number
  nextLevelXp: number
  progressPercent: number
  totalXp: number
  gold: number
  currentStreak: number
  bestStreak: number
  totalCompletedQuests: number
  intellect: number
  strength: number
  discipline: number
  creativity: number
  focus: number
  activeQuests: {
    id: string
    title: string
    category: string
    difficulty: string
    xpReward: number
    goldReward: number
    dueDate: string | null
  }[]
  recentCompleted: {
    id: string
    title: string
    category: string
    xpReward: number
    goldReward: number
    completedAt: string | null
  }[]
  recentAchievements: {
    name: string
    icon: string
    rarity: string
    unlockedAt: string
  }[]
  locationOptIn: boolean
  nearbyPlayers: {
    id: string
    username: string
    level: number
    avatar: string
    approxDistance: number
  }[]
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  
  useEffect(() => {
    const start = Date.now()
    const startVal = display // Animate from current display value
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.floor(startVal + (value - startVal) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, duration])

  return <>{display.toLocaleString()}</>
}

const categoryColors: Record<string, string> = {
  INTELLECT: "var(--attr-intellect)",
  STRENGTH: "var(--attr-strength)",
  DISCIPLINE: "var(--attr-discipline)",
  CREATIVITY: "var(--attr-creativity)",
  FOCUS: "var(--attr-focus)",
}

const difficultyBadge: Record<string, string> = {
  EASY: "bg-green-500/20 text-green-400 border-green-500/30",
  MEDIUM: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  HARD: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  EPIC: "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } }
  }
}

export default function DashboardClient(props: DashboardProps) {
  const attributes = [
    { label: "INT", full: "Intellect", value: props.intellect, color: "var(--attr-intellect)" },
    { label: "STR", full: "Strength", value: props.strength, color: "var(--attr-strength)" },
    { label: "DIS", full: "Discipline", value: props.discipline, color: "var(--attr-discipline)" },
    { label: "CRE", full: "Creativity", value: props.creativity, color: "var(--attr-creativity)" },
    { label: "FOC", full: "Focus", value: props.focus, color: "var(--attr-focus)" },
  ]



  return (
    <motion.div 
      className="space-y-8 pb-4"
      variants={stagger.container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.header variants={stagger.item}>
        <h1 className="text-3xl font-bold tracking-tight glow-text mb-1">COMMAND CENTER</h1>
        <p className="text-gray-400">Welcome back, <span className="text-primary font-semibold">{props.username}</span>.</p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Character Summary (Main Focus - 2 cols) */}
        <motion.div variants={stagger.item} className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 md:p-8 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50" aria-hidden="true" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" aria-hidden="true" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              
              {/* Level Ring */}
              <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                <svg className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
                  <circle cx="88" cy="88" r="80" className="stroke-white/10" strokeWidth="6" fill="none" />
                  <motion.circle 
                    cx="88" cy="88" r="80" 
                    className="stroke-primary drop-shadow-[0_0_10px_rgba(138,43,226,0.8)]" 
                    strokeWidth="6" fill="none" 
                    strokeDasharray="502" 
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 502 }}
                    animate={{ strokeDashoffset: 502 - (502 * props.progressPercent) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                  />
                </svg>
                <div className="text-center">
                  <div className="text-[10px] text-gray-400 uppercase tracking-[0.3em] mb-1">Level</div>
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 font-mono">
                    {props.level}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5 w-full">
                <div>
                  <h2 className="text-2xl font-bold tracking-wide">{props.username}</h2>
                  <p className="text-sm text-gray-400 tracking-wider uppercase">Network Runner</p>
                </div>
                
                {/* XP Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Experience</span>
                    <span className="font-mono text-xs">{props.currentLevelXp.toLocaleString()} / {props.nextLevelXp.toLocaleString()} XP</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary to-secondary relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${props.progressPercent}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-[3px]" aria-hidden="true" />
                    </motion.div>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase mb-1">
                      <Star className="w-3.5 h-3.5 text-primary" />
                      <span>Total XP</span>
                    </div>
                    <div className="text-lg font-mono text-white"><AnimatedNumber value={props.totalXp} /></div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase mb-1">
                      <Coins className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Gold</span>
                    </div>
                    <div className="text-lg font-mono text-yellow-400"><AnimatedNumber value={props.gold} /></div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase mb-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>Streak</span>
                    </div>
                    <div className="text-lg font-mono text-orange-400"><AnimatedNumber value={props.currentStreak} /> <span className="text-xs text-gray-500">days</span></div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase mb-1">
                      <Swords className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Completed</span>
                    </div>
                    <div className="text-lg font-mono text-emerald-400"><AnimatedNumber value={props.totalCompletedQuests} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attributes Row */}
          <div className="grid grid-cols-5 gap-2 md:gap-3">
            {attributes.map((attr, i) => (
              <motion.div 
                key={attr.label} 
                variants={stagger.item}
              >
                <Link
                  href={`/quests?attribute=${attr.full.toUpperCase()}`}
                  className="glass-panel p-3 md:p-4 text-center relative overflow-hidden group block hover:scale-105 transition-transform duration-300 ring-0 hover:ring-2 hover:ring-white/20"
                >
                  <div className="absolute bottom-0 left-0 right-0 h-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: attr.color }} />
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-2xl md:text-3xl font-bold mb-0.5 font-mono group-hover:glow-text transition-all" style={{ color: attr.color }}>
                    <AnimatedNumber value={attr.value} duration={800 + i * 200} />
                  </div>
                  <div className="text-[10px] md:text-xs tracking-widest text-gray-500 group-hover:text-gray-300 uppercase transition-colors">{attr.label}</div>
                  <div className="hidden md:block text-[10px] text-gray-600 mt-0.5">{attr.full}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div variants={stagger.item} className="space-y-6">
          
          {/* Today's Journey */}
          <div className="glass-panel p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Today's Journey
              </h2>
              <Link href="/quests" className="text-xs text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="space-y-4 flex-1 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {props.recentCompleted.length === 0 && props.activeQuests.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-gray-500 py-8 relative z-10 bg-[#05050A]/80 backdrop-blur-sm rounded-xl border border-dashed border-white/10">
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center mb-3 text-lg bg-white/5">✨</div>
                  <p className="text-sm">Your journey hasn't started today.</p>
                  <Link href="/quests" className="text-primary text-xs mt-2 hover:underline">Accept a quest →</Link>
                </div>
              ) : (
                <div className="space-y-4 relative z-10">
                  {/* Completed Quests */}
                  {props.recentCompleted.map((quest, i) => (
                    <motion.div 
                      key={`completed-${quest.id}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 glass-panel p-3 bg-primary/5 border-primary/20">
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-sm font-semibold text-white/90 line-through opacity-80">{quest.title}</div>
                          <div className="text-[10px] text-primary uppercase font-bold tracking-wider">+{quest.xpReward} XP</div>
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{quest.category}</div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Active Quests */}
                  {props.activeQuests.slice(0, 3).map((quest, i) => (
                    <motion.div 
                      key={`active-${quest.id}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (props.recentCompleted.length + i) * 0.1 }}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center shrink-0 group-hover:border-white/50 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-white/50 group-hover:bg-white transition-colors" />
                      </div>
                      <Link href="/quests" className="flex-1 glass-panel p-3 hover:bg-white/10 transition-colors block">
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{quest.title}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">+{quest.xpReward} XP</div>
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{quest.category}</div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Achievements
              </h2>
              <Link href="/achievements" className="text-xs text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            {props.recentAchievements.length === 0 ? (
              <div className="text-center text-gray-500 py-6 border border-dashed border-white/10 rounded-xl">
                <p className="text-sm">No achievements yet.</p>
                <p className="text-xs mt-1">Complete quests to unlock them.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {props.recentAchievements.map((ach, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-2xl">{ach.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{ach.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{ach.rarity}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Streak Visualization */}
          <div className="glass-panel p-5">
            <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-orange-400" />
              Streak
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold font-mono text-orange-400">{props.currentStreak}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Current</div>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="text-right">
                <div className="text-3xl font-bold font-mono text-gray-400">{props.bestStreak}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Best</div>
              </div>
            </div>
            {props.currentStreak > 0 && (
              <div className="mt-3 flex gap-1">
                {Array.from({ length: Math.min(props.currentStreak, 14) }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 h-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
                    style={{ opacity: 0.4 + (i / Math.min(props.currentStreak, 14)) * 0.6 }}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/focus" className="glass-panel p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group">
              <Target className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs uppercase tracking-widest font-bold">Focus</span>
            </Link>
            <Link href="/meditate" className="glass-panel p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group">
              <Wind className="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs uppercase tracking-widest font-bold">Meditate</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
