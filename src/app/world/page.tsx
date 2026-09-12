import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUserStats } from "@/app/actions/user"
import { prisma } from "@/lib/prisma"
import WorldMap from "./WorldMap"

export const metadata = {
  title: "World Map | Life RPG",
  description: "Explore the Fictional World of Life RPG",
}

export default async function WorldPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  const userStats = await getUserStats()
  
  if (!userStats) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { username: (session?.user as any)?.username },
    include: {
      inventory: {
        where: { equipped: true },
        include: { item: true }
      }
    }
  })

  const equippedItems = user?.inventory.map(i => i.item) || []

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-6 pb-0">
        <h1 className="text-3xl font-bold glow-text text-[var(--primary)]">World Map</h1>
        <p className="text-gray-400 mt-2">Explore the realm. Higher levels unlock new regions.</p>
      </div>
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        <WorldMap userLevel={userStats.level} equippedItems={equippedItems} />
      </div>
    </div>
  )
}
