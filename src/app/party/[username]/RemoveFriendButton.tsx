"use client"

import { useState } from "react"
import { removeFriend } from "../../actions/social"
import { useRouter } from "next/navigation"

export default function RemoveFriendButton({ friendId, username }: { friendId: string, username: string }) {
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${username} from your party?`)) return

    setIsRemoving(true)
    const res = await removeFriend(friendId)
    setIsRemoving(false)

    if (res.success) {
      router.refresh()
      router.push("/party")
    } else {
      alert(res.error || "Failed to remove friend")
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isRemoving}
      className="bg-red-500/10 hover:bg-red-500/20 text-red-500/70 hover:text-red-500 px-3 py-1 rounded text-sm font-medium transition-colors border border-red-500/20"
    >
      {isRemoving ? "Removing..." : "Remove Friend"}
    </button>
  )
}
