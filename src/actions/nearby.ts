"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// In a real production app with PostGIS, this would use ST_Distance
// For this hackathon/SQLite version, we'll just mock distances or use simple math if lat/lng are provided.
export async function getNearbyPlayers() {
  const session = await getServerSession(authOptions)
  if (!(session?.user as any)?.username) return []

  const currentUser = await prisma.user.findUnique({
    where: { username: (session?.user as any)?.username },
    select: { id: true, locationOptIn: true }
  })

  if (!currentUser?.locationOptIn) {
    return []
  }

  // Find other opted-in users (excluding self)
  const nearbyUsers = await prisma.user.findMany({
    where: { 
      locationOptIn: true,
      id: { not: currentUser.id }
    },
    select: {
      id: true,
      username: true,
      level: true,
      avatars: {
        where: { equipped: true },
        include: { avatar: true }
      }
    },
    take: 5
  })

  // Map to mock approximate distances (in meters) to respect privacy rules
  return nearbyUsers.map(u => ({
    id: u.id,
    username: u.username,
    level: u.level,
    avatar: u.avatars[0]?.avatar?.imageUrl || "👤",
    approxDistance: Math.floor(Math.random() * 800) + 100 // e.g. ~250m away, ~850m away
  })).sort((a, b) => a.approxDistance - b.approxDistance)
}
