"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

type Location = {
  id: string
  name: string
  description: string
  unlockLevel: number
  attribute: string | null
  visualType: string
  x: number
  y: number
  color: string
}

const LOCATIONS: Location[] = [
  { id: "city", name: "The Capital City", description: "The bustling center of everything. All quests available here.", unlockLevel: 1, attribute: null, visualType: "CITY", x: 50, y: 50, color: "var(--primary)" },
  { id: "gym", name: "Iron Gym", description: "Train your strength and endurance.", unlockLevel: 5, attribute: "STRENGTH", visualType: "GYM", x: 30, y: 70, color: "var(--strength)" },
  { id: "academy", name: "Arcane Academy", description: "Expand your mind and intellect.", unlockLevel: 10, attribute: "INTELLECT", visualType: "ACADEMY", x: 70, y: 30, color: "var(--intellect)" },
  { id: "arena", name: "Gladiator Arena", description: "Forge your discipline in the fires of combat.", unlockLevel: 15, attribute: "DISCIPLINE", visualType: "ARENA", x: 20, y: 30, color: "var(--discipline)" },
  { id: "forest", name: "Whispering Forest", description: "Unleash your creativity in nature.", unlockLevel: 20, attribute: "CREATIVITY", visualType: "FOREST", x: 80, y: 70, color: "var(--creativity)" },
  { id: "temple", name: "Zen Temple", description: "Master your focus and inner peace.", unlockLevel: 25, attribute: "FOCUS", visualType: "TEMPLE", x: 50, y: 15, color: "var(--focus)" },
]

import AvatarSprite from "@/components/AvatarSprite"

export default function WorldMap({ userLevel, equippedItems = [] }: { userLevel: number, equippedItems?: any[] }) {
  const router = useRouter()
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  const handleLocationClick = (loc: Location) => {
    if (userLevel >= loc.unlockLevel) {
      if (selectedLocation?.id === loc.id) {
        // Go to quests page with filter
        const query = loc.attribute ? `?attribute=${loc.attribute}` : ""
        router.push(`/quests${query}`)
      } else {
        setSelectedLocation(loc)
      }
    }
  }

  return (
    <div className="relative w-full max-w-4xl aspect-video rounded-xl border border-[rgba(255,255,255,0.1)] bg-[var(--background)] overflow-hidden shadow-[0_0_50px_rgba(138,43,226,0.1)]">
      {/* Background grid/map feel */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      
      {LOCATIONS.map((loc) => {
        const isUnlocked = userLevel >= loc.unlockLevel
        const isSelected = selectedLocation?.id === loc.id

        return (
          <motion.div
            key={loc.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10"
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
            onClick={() => handleLocationClick(loc)}
            whileHover={isUnlocked ? { scale: 1.1 } : {}}
            whileTap={isUnlocked ? { scale: 0.95 } : {}}
          >
            <div 
              className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-lg shadow-lg relative ${isUnlocked ? 'glass-panel-hover' : 'bg-gray-900 border border-gray-800'}`}
              style={{
                boxShadow: isUnlocked ? `0 0 20px ${loc.color}40, inset 0 0 20px ${loc.color}20` : 'none',
                borderColor: isUnlocked ? loc.color : '#333',
                backgroundColor: isUnlocked ? `${loc.color}10` : '#111'
              }}
            >
              <div 
                className="absolute inset-0 rounded-lg opacity-50"
                style={{
                  background: isUnlocked ? `radial-gradient(circle at center, ${loc.color}50 0%, transparent 70%)` : 'none'
                }}
              />
              
              {/* Isometric building representation */}
              <div className="relative z-10 text-3xl md:text-4xl filter drop-shadow-md">
                {!isUnlocked ? "🔒" :
                  loc.visualType === "CITY" ? "🏰" :
                  loc.visualType === "GYM" ? "🏋️" :
                  loc.visualType === "ACADEMY" ? "🎓" :
                  loc.visualType === "ARENA" ? "⚔️" :
                  loc.visualType === "FOREST" ? "🌲" :
                  "⛩️"
                }
              </div>
            </div>

            <div className={`mt-2 text-sm font-bold text-center whitespace-nowrap px-2 py-1 rounded bg-black/60 backdrop-blur-sm border ${isUnlocked ? 'text-white border-white/20' : 'text-gray-500 border-gray-800'}`}>
              {loc.name}
            </div>
            
            {!isUnlocked && (
              <div className="text-xs text-red-400 mt-1 bg-black/80 px-2 py-0.5 rounded font-mono">
                Lvl {loc.unlockLevel} required
              </div>
            )}
          </motion.div>
        )
      })}

      {/* Player Character */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-[80%] z-30 pointer-events-none"
        animate={{
          left: `${selectedLocation ? selectedLocation.x : 50}%`,
          top: `${selectedLocation ? selectedLocation.y : 50}%`,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 15 }}
      >
        <AvatarSprite equippedItems={equippedItems} size={80} className="drop-shadow-2xl" />
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/40 rounded-full blur-sm" />
      </motion.div>

      {/* Info Panel for Selected Location */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="absolute bottom-6 left-1/2 glass-panel p-4 md:p-6 rounded-xl border border-[rgba(255,255,255,0.2)] w-11/12 max-w-md z-20 flex flex-col items-center text-center backdrop-blur-md bg-black/80 shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-2" style={{ color: selectedLocation.color }}>
              {selectedLocation.name}
            </h3>
            <p className="text-sm text-gray-300 mb-4">{selectedLocation.description}</p>
            {selectedLocation.attribute && (
              <div className="mb-4 text-xs font-mono px-3 py-1 rounded-full border" style={{ borderColor: selectedLocation.color, color: selectedLocation.color, backgroundColor: `${selectedLocation.color}15` }}>
                FOCUSED ON: {selectedLocation.attribute}
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                className="px-6 py-2 rounded font-bold bg-white/10 hover:bg-white/20 transition-colors text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedLocation(null)
                }}
              >
                Close
              </button>
              <button
                className="px-6 py-2 rounded font-bold text-white transition-all shadow-lg"
                style={{ backgroundColor: selectedLocation.color, boxShadow: `0 0 15px ${selectedLocation.color}60` }}
                onClick={(e) => {
                  e.stopPropagation()
                  const query = selectedLocation.attribute ? `?attribute=${selectedLocation.attribute}` : ""
                  router.push(`/quests${query}`)
                }}
              >
                Enter Area
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
