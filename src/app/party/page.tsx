import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import PartyClient from "./PartyClient"
import { getParty } from "../actions/social"

export const metadata: Metadata = {
  title: "Your Party - Life RPG",
  description: "Manage your friends and party in Life RPG",
}

export default async function PartyPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/login")
  }

  const partyData = await getParty()

  if (!partyData.success) {
    return (
      <div className="min-h-screen p-8 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Error loading party</h1>
        <p className="text-white/70">{partyData.error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight glow-text text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
            YOUR PARTY
          </h1>
          <p className="text-white/60 mt-2">Connect with allies and grow stronger together.</p>
        </div>
        
        <PartyClient 
          initialFriends={partyData.friends as any} 
          initialRequests={partyData.pendingRequests as any} 
        />
      </div>
    </div>
  )
}
