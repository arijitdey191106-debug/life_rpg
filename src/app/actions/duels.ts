"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function challengeFriend(friendId: string, objectiveType: string, wager: number = 0) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify friendship
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: session.user.id, friendId: friendId },
        { userId: friendId, friendId: session.user.id }
      ]
    }
  })

  if (!friendship) {
    throw new Error("You can only challenge friends.")
  }

  // Create duel
  const duel = await prisma.duel.create({
    data: {
      challengerId: session.user.id,
      defenderId: friendId,
      objectiveType,
      wager,
      status: "PENDING"
    }
  })

  revalidatePath("/duels")
  revalidatePath("/party")
  
  return duel
}

export async function acceptDuel(duelId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const duel = await prisma.duel.findUnique({ where: { id: duelId } })
  
  if (!duel) {
    throw new Error("Duel not found")
  }
  
  if (duel.defenderId !== session.user.id) {
    throw new Error("Only the defender can accept this duel")
  }

  const updated = await prisma.duel.update({
    where: { id: duelId },
    data: { status: "ACCEPTED" }
  })

  revalidatePath("/duels")
  revalidatePath("/party")

  return updated
}

export async function declineDuel(duelId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const duel = await prisma.duel.findUnique({ where: { id: duelId } })
  
  if (!duel) {
    throw new Error("Duel not found")
  }
  
  if (duel.defenderId !== session.user.id && duel.challengerId !== session.user.id) {
    throw new Error("Unauthorized to modify this duel")
  }

  const updated = await prisma.duel.update({
    where: { id: duelId },
    data: { status: "DECLINED", completedAt: new Date() }
  })

  revalidatePath("/duels")
  revalidatePath("/party")

  return updated
}

export async function getDuels() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { pending: [], active: [], history: [] }
  }

  const duels = await prisma.duel.findMany({
    where: {
      OR: [
        { challengerId: session.user.id },
        { defenderId: session.user.id }
      ]
    },
    include: {
      challenger: {
        select: { id: true, username: true, level: true }
      },
      defender: {
        select: { id: true, username: true, level: true }
      },
      winner: {
        select: { id: true, username: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const pending = duels.filter(d => d.status === "PENDING")
  const active = duels.filter(d => d.status === "ACCEPTED")
  const history = duels.filter(d => ["COMPLETED", "DECLINED"].includes(d.status))

  return { pending, active, history }
}
