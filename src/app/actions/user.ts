"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function getUserProfile() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  let profile = await prisma.user.findUnique({
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

  // Vercel Ephemeral SQLite Fix
  if (!profile && (session.user as any).username) {
    try {
      await prisma.user.create({
        data: {
          id: session.user.id,
          username: (session.user as any).username,
          email: `${(session.user as any).username}@placeholder.com`,
          passwordHash: "ephemeral-recreation"
        }
      })
      profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          quests: { orderBy: { createdAt: "desc" } },
          achievements: { include: { achievement: true } },
          inventory: { include: { item: true } },
          avatars: { include: { avatar: true } },
          skills: { include: { skillNode: true } }
        }
      })
    } catch (e) {
      console.error("Failed to dynamically recreate user on Vercel", e)
    }
  }

  return profile
}

export async function getUserStats() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  let user = await prisma.user.findUnique({
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

  // Vercel Ephemeral SQLite Fix
  if (!user && (session.user as any).username) {
    try {
      await prisma.user.create({
        data: {
          id: session.user.id,
          username: (session.user as any).username,
          email: `${(session.user as any).username}@placeholder.com`,
          passwordHash: "ephemeral-recreation"
        }
      })
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          level: true, xp: true, gold: true, goldSpent: true,
          currentStreak: true, bestStreak: true, intellect: true,
          strength: true, discipline: true, creativity: true, focus: true,
          _count: {
            select: { quests: { where: { status: "COMPLETED" } }, achievements: true, inventory: true }
          }
        }
      })
    } catch (e) {
      console.error("Failed to dynamically recreate user on Vercel", e)
    }
  }

  return user
}
