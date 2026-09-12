"use client"

import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { searchUsers, sendFriendRequest, acceptFriendRequest, declineFriendRequest } from "../actions/social"
import Link from "next/link"

export type UserData = any;
export type RequestData = any;

export default function PartyClient({ 
  initialFriends, 
  initialRequests 
}: { 
  initialFriends: UserData[], 
  initialRequests: RequestData[] 
}) {
  const [friends, setFriends] = useState(initialFriends)
  const [requests, setRequests] = useState(initialRequests)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserData[]>([])
  const [isSearching, startSearchTransition] = useTransition()
  const [searchMessage, setSearchMessage] = useState("")

  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearchMessage("")
    startSearchTransition(async () => {
      const res = await searchUsers(searchQuery)
      if (res.success && res.users) {
        setSearchResults(res.users)
        if (res.users.length === 0) setSearchMessage("No users found.")
      } else {
        setSearchMessage(res.error || "Search failed")
      }
    })
  }

  const handleSendRequest = async (userId: string) => {
    setLoadingAction(`send-${userId}`)
    const res = await sendFriendRequest(userId)
    setLoadingAction(null)
    
    if (res.success) {
      alert("Friend request sent!")
    } else {
      alert(res.error || "Failed to send request")
    }
  }

  const handleAcceptRequest = async (requestId: string, sender: UserData) => {
    setLoadingAction(`accept-${requestId}`)
    const res = await acceptFriendRequest(requestId)
    setLoadingAction(null)
    
    if (res.success) {
      setRequests(prev => prev.filter(r => r.id !== requestId))
      setFriends(prev => [...prev, sender])
    } else {
      alert(res.error || "Failed to accept")
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    setLoadingAction(`decline-${requestId}`)
    const res = await declineFriendRequest(requestId)
    setLoadingAction(null)
    
    if (res.success) {
      setRequests(prev => prev.filter(r => r.id !== requestId))
    } else {
      alert(res.error || "Failed to decline")
    }
  }

  return (
    <div className="space-y-12">
      {/* Search Section */}
      <section className="glass-panel p-6">
        <h2 className="text-2xl font-bold mb-4 text-[var(--secondary)]">Find Allies</h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search username</label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter username..."
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)] glow-border transition-colors"
            />
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>

        {searchMessage && <p className="mt-4 text-white/60">{searchMessage}</p>}

        {searchResults.length > 0 && (
          <div className="mt-6 space-y-4">
            {searchResults.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-black/30 p-4 rounded-lg border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                    {user.avatars?.[0]?.avatar.imageUrl ? (
                      <img src={user.avatars[0].avatar.imageUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{user.username}</p>
                    <p className="text-sm text-[var(--primary)]">Level {user.level}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSendRequest(user.id)}
                  disabled={loadingAction === `send-${user.id}`}
                  className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
                >
                  {loadingAction === `send-${user.id}` ? "..." : "Send Request"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            Pending Requests 
            <span className="bg-[var(--secondary)] text-white text-xs px-2 py-1 rounded-full">{requests.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {requests.map(req => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                      {req.sender.avatars?.[0]?.avatar.imageUrl ? (
                        <img src={req.sender.avatars[0].avatar.imageUrl} alt={req.sender.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{req.sender.username}</p>
                      <p className="text-xs text-[var(--primary)]">Level {req.sender.level}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(req.id, req.sender)}
                      disabled={loadingAction === `accept-${req.id}`}
                      className="bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1 rounded transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      disabled={loadingAction === `decline-${req.id}`}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Party Members */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Your Party ({friends.length})</h2>
        {friends.length === 0 ? (
          <div className="glass-panel p-8 text-center text-white/50">
            <p>Your party is currently empty.</p>
            <p className="text-sm mt-2">Search for players above to invite them to your party.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map(friend => (
              <Link href={`/party/${friend.username}`} key={friend.id}>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="glass-panel-hover p-6 cursor-pointer relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden flex items-center justify-center border-2 border-[var(--primary)]/50 group-hover:border-[var(--primary)] transition-colors">
                      {friend.avatars?.[0]?.avatar.imageUrl ? (
                        <img src={friend.avatars[0].avatar.imageUrl} alt={friend.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{friend.username}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--primary)] font-medium">Lv. {friend.level}</span>
                        <span className="text-white/30 text-xs">|</span>
                        <span className="text-orange-400 text-sm flex items-center gap-1">
                          🔥 {friend.currentStreak || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/40 rounded p-2 flex justify-between">
                      <span className="text-white/50">INT</span>
                      <span className="text-blue-400 font-bold">{friend.intellect || 0}</span>
                    </div>
                    <div className="bg-black/40 rounded p-2 flex justify-between">
                      <span className="text-white/50">STR</span>
                      <span className="text-red-400 font-bold">{friend.strength || 0}</span>
                    </div>
                    <div className="bg-black/40 rounded p-2 flex justify-between">
                      <span className="text-white/50">DIS</span>
                      <span className="text-green-400 font-bold">{friend.discipline || 0}</span>
                    </div>
                    <div className="bg-black/40 rounded p-2 flex justify-between">
                      <span className="text-white/50">FOC</span>
                      <span className="text-purple-400 font-bold">{friend.focus || 0}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
