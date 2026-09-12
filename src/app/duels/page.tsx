import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDuels } from "@/app/actions/duels"
import { getParty } from "@/app/actions/social"
import DuelsClient from "./DuelsClient"

export const metadata = {
  title: "Duels | Life RPG",
  description: "Challenge friends to attribute duels",
}

export default async function DuelsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const [duelsData, partyData] = await Promise.all([
    getDuels(),
    getParty()
  ])

  const friends = partyData.success && partyData.friends ? partyData.friends : []

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold glow-text text-[var(--secondary)]">Arena Duels</h1>
          <p className="text-gray-400 mt-2">Challenge your friends to prove your might.</p>
        </div>
      </div>
      
      <DuelsClient 
        initialDuels={duelsData} 
        friends={friends} 
        currentUserId={userId} 
      />
    </div>
  )
}
