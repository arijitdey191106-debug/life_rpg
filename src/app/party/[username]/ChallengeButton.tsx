"use client"

import { useState } from "react"
import { challengeFriend } from "@/app/actions/duels"
import { useRouter } from "next/navigation"

export default function ChallengeButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChallenge = async () => {
    try {
      setLoading(true)
      await challengeFriend(userId, "STREAK", 0) // Default to simple streak challenge
      router.push("/duels")
    } catch (err: any) {
      alert(err.message || "Failed to challenge")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleChallenge}
      disabled={loading}
      className="bg-[var(--secondary)]/20 text-[var(--secondary)] hover:bg-[var(--secondary)]/40 border border-[var(--secondary)]/50 px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
    >
      {loading ? "..." : "CHALLENGE DUEL"}
    </button>
  )
}
