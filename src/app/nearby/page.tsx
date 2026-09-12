import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NearbyClient from "./NearbyClient"

export const metadata: Metadata = {
  title: "Nearby Players - Life RPG",
  description: "Discover nearby players in Life RPG",
}

export default async function NearbyPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/login")
  }

  const userId = (session.user as any).id as string

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { locationOptIn: true }
  })

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight glow-text text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-blue-500 flex items-center gap-3">
            NEARBY PLAYERS
          </h1>
          <p className="text-white/60 mt-2">Discover and challenge adventurers within 1 KM.</p>
        </div>
        
        <NearbyClient initialOptIn={!!user?.locationOptIn} />
      </div>
    </div>
  )
}
