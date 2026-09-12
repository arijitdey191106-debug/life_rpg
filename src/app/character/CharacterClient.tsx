"use client"

import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Flame, Coins, Star, Swords, Trophy, Calendar, TrendingUp, X } from "lucide-react"
import { equipAvatar } from "@/actions/character"
import { useAudio } from "@/components/AudioProvider"
import AvatarSprite from "@/components/AvatarSprite"

interface CharacterProps {
  username: string
  level: number
  currentLevelXp: number
  nextLevelXp: number
  progressPercent: number
  totalXp: number
  gold: number
  goldSpent: number
  currentStreak: number
  bestStreak: number
  totalCompleted: number
  intellect: number
  strength: number
  discipline: number
  creativity: number
  focus: number
  categoryBreakdown: Record<string, number>
  equippedItems: { name: string; type: string; icon: string; rarity: string }[]
  achievementCount: number
  daysSinceJoined: number
  
  avatars: { id: string; name: string; rarity: string; imageUrl: string; unlockLevel: number }[]
  currentAvatar: string
  userAvatars: (string | null)[]
  skillNodes: { id: string; attribute: string; name: string; description: string; requiredAttrLevel: number }[]
  unlockedSkills: string[]
}

const stagger = {
  container: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
}

export default function CharacterClient(props: CharacterProps) {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
  const [isEquipping, setIsEquipping] = useState(false)
  const audio = useAudio()

  const attributes = [
    { name: "Intellect", abbr: "INT", value: props.intellect, color: "var(--attr-intellect)", desc: "Coding, studying, research" },
    { name: "Strength", abbr: "STR", value: props.strength, color: "var(--attr-strength)", desc: "Exercise, physical challenges" },
    { name: "Discipline", abbr: "DIS", value: props.discipline, color: "var(--attr-discipline)", desc: "Habits, consistency, routines" },
    { name: "Creativity", abbr: "CRE", value: props.creativity, color: "var(--attr-creativity)", desc: "Writing, design, art" },
    { name: "Focus", abbr: "FOC", value: props.focus, color: "var(--attr-focus)", desc: "Deep work, concentration" },
  ]

  const maxAttr = Math.max(...attributes.map(a => a.value), 10)
  const totalAttrPoints = attributes.reduce((sum, a) => sum + a.value, 0)
  const daysSinceJoined = props.daysSinceJoined

  const handleEquip = async (avatarId: string) => {
    setIsEquipping(true)
    audio.playClick()
    try {
      await equipAvatar(avatarId)
      audio.playSuccess()
      setIsAvatarModalOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsEquipping(false)
    }
  }

  // Find cosmetic frame if equipped
  const equippedFrame = props.equippedItems.find(item => item.type === "FRAME")
  
  return (
    <motion.div 
      className="space-y-8 pb-4 p-4 lg:p-8"
      variants={stagger.container}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={stagger.item}>
        <h1 className="text-3xl font-bold tracking-tight glow-text mb-1">CHARACTER SHEET</h1>
        <p className="text-gray-400">Your complete profile and power analysis.</p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Player Character */}
        <motion.div variants={stagger.item} className="glass-panel p-8 relative overflow-hidden flex flex-col items-center justify-center lg:col-span-8 min-h-[420px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(138,43,226,0.15)_0%,transparent_70%)]" aria-hidden="true" />
          <h3 className="absolute top-4 left-4 text-xs font-bold tracking-widest text-white/50 uppercase">Player Character</h3>
          
          <div className="relative mb-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
              className={`relative flex items-center justify-center z-10`}
            >
              <AvatarSprite equippedItems={props.equippedItems} size={200} className="z-10 drop-shadow-[0_0_15px_rgba(138,43,226,0.3)]" />
            </motion.div>
          </div>
          
          <h2 className="text-3xl font-bold tracking-widest">{props.username}</h2>
          <div className="text-primary font-mono mt-1 uppercase tracking-[0.3em] text-sm">Level {props.level} Operator</div>
          
          <div className="mt-4 z-10">
            <Link href="/outfits" className="px-6 py-2 bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/50 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)] flex items-center gap-2">
              <span>OUTFITS</span>
            </Link>
          </div>
          
          {/* XP Progress */}
          <div className="w-full max-w-md mt-6 space-y-1.5 z-10">
            <div className="flex justify-between text-xs text-gray-400">
              <span>XP Progress</span>
              <span className="font-mono">{props.currentLevelXp} / {props.nextLevelXp}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary absolute top-0 left-0"
                initial={{ width: 0 }}
                animate={{ width: `${props.progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Social Profile */}
          <motion.div variants={stagger.item} className="glass-panel p-6 flex flex-col items-center text-center relative">
            <h3 className="absolute top-4 left-4 text-xs font-bold tracking-widest text-white/50 uppercase">Social Profile</h3>
            
            <div className="mt-4 relative" onMouseEnter={() => audio.playHover()}>
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                className={`relative w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center bg-black/50 overflow-hidden ${equippedFrame ? '' : 'pulse-glow'} transition-colors z-10`}
              >
                <span className="text-5xl">{props.avatars.find(a => a.id === props.currentAvatar)?.imageUrl || '👱‍♂️'}</span>
              </motion.div>
              
              {/* Render Frame if equipped */}
              {equippedFrame && equippedFrame.name.includes("VOID") && (
                <svg className="absolute -inset-4 w-[115%] h-[115%] -left-[7.5%] -top-[7.5%] pointer-events-none animate-[spin_10s_linear_infinite] z-20" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" className="opacity-50" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--secondary)" strokeWidth="0.5" strokeDasharray="10 5" />
                </svg>
              )}
              {equippedFrame && !equippedFrame.name.includes("VOID") && (
                 <div className="absolute -inset-2 rounded-full border-4 border-yellow-500/50 pointer-events-none z-20 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
              )}

              {/* Level badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/50 shadow-lg shadow-primary/20 z-10">
                LVL {props.level}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 w-full text-center border-t border-white/10 pt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 uppercase text-xs flex items-center gap-1"><Star className="w-3 h-3"/> Total XP</span>
                <span className="font-mono text-white">{props.totalXp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 uppercase text-xs flex items-center gap-1"><Coins className="w-3 h-3"/> Gold</span>
                <span className="font-mono text-yellow-400">{props.gold.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 uppercase text-xs flex items-center gap-1"><Flame className="w-3 h-3"/> Streak</span>
                <span className="font-mono text-orange-400">{props.currentStreak}</span>
              </div>
            </div>
          </motion.div>

          {/* Attribute Visualizer */}
          <motion.div variants={stagger.item} className="glass-panel p-6 flex-1">
            <h3 className="text-lg font-bold tracking-widest mb-2 text-center flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              ATTRIBUTES
            </h3>
            <p className="text-xs text-gray-500 text-center mb-6 tracking-wider">
              TOTAL POWER: <span className="text-white font-mono">{totalAttrPoints}</span>
            </p>
            
            <div className="space-y-4">
              {attributes.map((attr, i) => {
                const percentage = Math.min(100, Math.max(3, (attr.value / maxAttr) * 100))
                return (
                  <motion.div 
                    key={attr.name} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                  >
                    <div className="flex justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold tracking-wider uppercase" style={{ color: attr.color }}>{attr.name}</span>
                      </div>
                      <span className="font-mono font-bold text-sm" style={{ color: attr.color }}>{attr.value}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-sm overflow-hidden">
                      <motion.div 
                        className="h-full relative"
                        style={{ backgroundColor: attr.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 + i * 0.1 }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-[pulse_3s_ease-in-out_infinite]" aria-hidden="true" />
                      </motion.div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Skill Tree Visualizer */}
      <motion.div variants={stagger.item} className="glass-panel p-8">
        <h3 className="text-xl font-bold tracking-widest mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          SKILL TREE
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {attributes.map(attr => {
            const nodes = props.skillNodes.filter(n => n.attribute === attr.name.toUpperCase()).sort((a,b) => a.requiredAttrLevel - b.requiredAttrLevel)
            return (
              <div key={attr.name} className="flex flex-col items-center">
                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: attr.color }}>{attr.name}</div>
                <div className="space-y-4 relative w-full flex flex-col items-center">
                  {/* Connecting Line */}
                  <div className="absolute top-4 bottom-4 w-px bg-white/10 -z-10" />
                  
                  {nodes.map((node) => {
                    const isUnlocked = attr.value >= node.requiredAttrLevel || props.unlockedSkills.includes(node.id)
                    return (
                      <div 
                        key={node.id} 
                        className={`w-full max-w-[140px] p-3 rounded-lg border text-center transition-all ${
                          isUnlocked 
                            ? 'bg-white/10 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                            : 'bg-black/50 border-white/5 opacity-50 grayscale'
                        }`}
                      >
                        <div className="text-xs font-bold text-white mb-1">{node.name}</div>
                        <div className="text-[9px] text-gray-400 leading-tight">{node.description}</div>
                        {!isUnlocked && (
                          <div className="text-[8px] text-red-400 mt-2 font-mono uppercase tracking-widest">
                            REQ: {node.requiredAttrLevel} {attr.abbr}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Bottom Stats Grid */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 text-center">
          <Swords className="w-5 h-5 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono">{props.totalCompleted}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Quests Done</div>
        </div>
        <div className="glass-panel p-5 text-center">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono">{props.achievementCount}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Achievements</div>
        </div>
        <div className="glass-panel p-5 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono">{props.bestStreak}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Best Streak</div>
        </div>
        <div className="glass-panel p-5 text-center">
          <Calendar className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono">{daysSinceJoined}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Days Active</div>
        </div>
      </motion.div>

    </motion.div>
  )
}
