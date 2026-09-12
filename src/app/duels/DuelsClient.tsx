"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { challengeFriend, acceptDuel, declineDuel } from "@/app/actions/duels"
import { useRouter } from "next/navigation"

type UserBasic = {
  id: string
  username: string
  level?: number
}

type Duel = {
  id: string
  challengerId: string
  defenderId: string
  objectiveType: string
  wager: number
  status: string
  createdAt: Date
  challenger: UserBasic
  defender: UserBasic
  winner?: UserBasic | null
}

type DuelsClientProps = {
  initialDuels: {
    pending: Duel[]
    active: Duel[]
    history: Duel[]
  }
  friends: any[]
  currentUserId: string
}

const OBJECTIVE_TYPES = ["FOCUS", "STRENGTH", "INTELLECT", "DISCIPLINE", "CREATIVITY"]

export default function DuelsClient({ initialDuels, friends, currentUserId }: DuelsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PENDING" | "HISTORY">("ACTIVE")
  const [isChallenging, setIsChallenging] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState("")
  const [selectedObjective, setSelectedObjective] = useState("FOCUS")
  const [wager, setWager] = useState(0)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  const handleChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFriend) return
    
    try {
      setLoadingId("challenge")
      await challengeFriend(selectedFriend, selectedObjective, wager)
      setIsChallenging(false)
      setSelectedFriend("")
      setWager(0)
      setActiveTab("PENDING")
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Failed to send challenge")
    } finally {
      setLoadingId(null)
    }
  }

  const handleAccept = async (duelId: string) => {
    try {
      setLoadingId(duelId)
      await acceptDuel(duelId)
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Failed to accept")
    } finally {
      setLoadingId(null)
    }
  }

  const handleDecline = async (duelId: string) => {
    try {
      setLoadingId(duelId)
      await declineDuel(duelId)
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Failed to decline")
    } finally {
      setLoadingId(null)
    }
  }

  const renderDuelCard = (duel: Duel) => {
    const isChallenger = duel.challengerId === currentUserId
    const opponent = isChallenger ? duel.defender : duel.challenger
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={duel.id} 
        className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,0,255,0.3)] transition-colors bg-black/40"
      >
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-full bg-gray-800 border-2 flex items-center justify-center text-xl" style={{ borderColor: `var(--${duel.objectiveType.toLowerCase()})` }}>
            ⚔️
          </div>
          <div>
            <div className="font-bold text-lg">
              {isChallenger ? "You challenged " : "Challenged by "}
              <span className="text-[var(--primary)]">{opponent.username}</span>
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800" style={{ color: `var(--${duel.objectiveType.toLowerCase()})` }}>
                {duel.objectiveType}
              </span>
              {duel.wager > 0 && <span className="text-yellow-500">💰 {duel.wager} Wager</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          {duel.status === "PENDING" && !isChallenger && (
            <>
              <button 
                onClick={() => handleAccept(duel.id)}
                disabled={loadingId === duel.id}
                className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-white rounded font-bold text-sm shadow-[0_0_10px_var(--primary)] disabled:opacity-50"
              >
                Accept
              </button>
              <button 
                onClick={() => handleDecline(duel.id)}
                disabled={loadingId === duel.id}
                className="px-4 py-2 bg-red-900/50 hover:bg-red-900/80 text-white border border-red-700 rounded font-bold text-sm disabled:opacity-50"
              >
                Decline
              </button>
            </>
          )}
          {duel.status === "PENDING" && isChallenger && (
            <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded text-sm font-mono border border-gray-700">Waiting...</span>
          )}
          {duel.status === "ACCEPTED" && (
            <span className="px-3 py-1 bg-[var(--secondary)]/20 text-[var(--secondary)] rounded text-sm font-bold border border-[var(--secondary)]/50 animate-pulse">In Progress</span>
          )}
          {duel.status === "COMPLETED" && duel.winner && (
            <span className={`px-3 py-1 rounded text-sm font-bold border ${duel.winner.id === currentUserId ? 'bg-green-900/30 text-green-400 border-green-700' : 'bg-red-900/30 text-red-400 border-red-700'}`}>
              {duel.winner.id === currentUserId ? 'Victory' : 'Defeat'}
            </span>
          )}
          {duel.status === "DECLINED" && (
            <span className="px-3 py-1 bg-gray-900 text-gray-500 rounded text-sm font-mono border border-gray-800">Declined</span>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {["ACTIVE", "PENDING", "HISTORY"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded font-bold text-sm transition-colors ${activeTab === tab ? 'bg-[var(--secondary)] text-white shadow-[0_0_10px_rgba(255,0,255,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
              {tab === "PENDING" && initialDuels.pending.filter(d => d.defenderId === currentUserId).length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {initialDuels.pending.filter(d => d.defenderId === currentUserId).length}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setIsChallenging(!isChallenging)}
          className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-white rounded font-bold text-sm shadow-[0_0_15px_var(--primary)]"
        >
          {isChallenging ? "Cancel" : "Challenge Friend"}
        </button>
      </div>

      <AnimatePresence>
        {isChallenging && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <form onSubmit={handleChallenge} className="glass-panel p-6 rounded-xl border border-[var(--primary)]/50 bg-black/60">
              <h3 className="text-xl font-bold mb-4">Issue a Challenge</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="friendSelect" className="block text-sm text-gray-400 mb-1">Opponent</label>
                  <select 
                    id="friendSelect"
                    value={selectedFriend}
                    onChange={(e) => setSelectedFriend(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white outline-none focus:border-[var(--primary)]"
                    required
                  >
                    <option value="">Select a friend...</option>
                    {friends.map(f => (
                      <option key={f.id} value={f.id}>{f.username} (Lvl {f.level})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="objectiveSelect" className="block text-sm text-gray-400 mb-1">Attribute Focus</label>
                  <select 
                    id="objectiveSelect"
                    value={selectedObjective}
                    onChange={(e) => setSelectedObjective(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white outline-none focus:border-[var(--primary)] font-mono"
                    style={{ color: `var(--${selectedObjective.toLowerCase()})` }}
                  >
                    {OBJECTIVE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="wagerInput" className="block text-sm text-gray-400 mb-1">Gold Wager (Optional)</label>
                  <input 
                    id="wagerInput"
                    type="number"
                    min="0"
                    value={wager}
                    onChange={(e) => setWager(parseInt(e.target.value) || 0)}
                    className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={loadingId === "challenge" || !selectedFriend}
                  className="px-6 py-2 bg-[var(--primary)] text-white rounded font-bold shadow-[0_0_15px_var(--primary)] disabled:opacity-50"
                >
                  {loadingId === "challenge" ? "Sending..." : "Send Challenge ⚔️"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        {activeTab === "ACTIVE" && (
          initialDuels.active.length > 0 ? (
            initialDuels.active.map(renderDuelCard)
          ) : (
            <div className="text-center py-12 text-gray-500 glass-panel rounded-xl">
              <div className="text-4xl mb-4 opacity-50">⚔️</div>
              <p>No active duels.</p>
              <p className="text-sm">Challenge a friend to prove your worth!</p>
            </div>
          )
        )}
        
        {activeTab === "PENDING" && (
          initialDuels.pending.length > 0 ? (
            initialDuels.pending.map(renderDuelCard)
          ) : (
            <div className="text-center py-12 text-gray-500 glass-panel rounded-xl">
              <p>No pending duels.</p>
            </div>
          )
        )}

        {activeTab === "HISTORY" && (
          initialDuels.history.length > 0 ? (
            initialDuels.history.map(renderDuelCard)
          ) : (
            <div className="text-center py-12 text-gray-500 glass-panel rounded-xl">
              <p>No duel history.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
