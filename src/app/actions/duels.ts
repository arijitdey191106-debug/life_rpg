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

export async function verifyDuelCompletion(duelId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const duel = await prisma.duel.findUnique({
    where: { id: duelId },
    include: {
      challenger: true,
      defender: true
    }
  })

  if (!duel || duel.status !== "ACCEPTED") {
    throw new Error("Duel is not in an active state")
  }

  // Verify that the person requesting verification is a participant
  if (duel.challengerId !== session.user.id && duel.defenderId !== session.user.id) {
    throw new Error("Unauthorized to verify this duel")
  }

  // Calculate winner based on objectiveType attribute
  const attr = duel.objectiveType.toLowerCase() as keyof typeof duel.challenger
  const challengerScore = (duel.challenger[attr] as number) || 0
  const defenderScore = (duel.defender[attr] as number) || 0

  let winnerId = null;
  let loserId = null;
  if (challengerScore > defenderScore) {
    winnerId = duel.challengerId;
    loserId = duel.defenderId;
  } else if (defenderScore > challengerScore) {
    winnerId = duel.defenderId;
    loserId = duel.challengerId;
  } else {
    // Tie goes to defender for now
    winnerId = duel.defenderId;
    loserId = duel.challengerId;
  }

  const updatedDuel = await prisma.duel.update({
    where: { id: duelId },
    data: {
      status: "COMPLETED",
      winnerId: winnerId,
      completedAt: new Date()
    }
  })

  // Give rewards
  await prisma.user.update({
    where: { id: winnerId },
    data: {
      xp: { increment: 50 },
      gold: { increment: duel.wager > 0 ? duel.wager : 10 }
    }
  })

  await prisma.user.update({
    where: { id: loserId },
    data: {
      xp: { increment: 10 } // Participation reward
    }
  })

  revalidatePath("/duels")
  revalidatePath("/party")
  
  return { success: true, winnerId }
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
