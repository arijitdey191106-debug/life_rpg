"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function getUserProfile() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      quests: {
        orderBy: { createdAt: "desc" }
      },
      achievements: {
        include: { achievement: true }
      },
      inventory: {
        include: { item: true }
      },
      avatars: {
        include: { avatar: true }
      },
      skills: {
        include: { skillNode: true }
      }
    }
  })

  return profile
}

export async function getUserStats() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      level: true,
      xp: true,
      gold: true,
      goldSpent: true,
      currentStreak: true,
      bestStreak: true,
      intellect: true,
      strength: true,
      discipline: true,
      creativity: true,
      focus: true,
      _count: {
        select: {
          quests: { where: { status: "COMPLETED" } },
          achievements: true,
          inventory: true,
        }
      }
    }
  })

  return user
}
