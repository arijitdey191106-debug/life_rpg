'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function acceptSystemQuest(questId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const systemQuest = await prisma.quest.findUnique({ where: { id: questId } })
  if (!systemQuest || systemQuest.type !== 'SYSTEM') {
    throw new Error('System quest not found')
  }

  await prisma.quest.create({
    data: {
      userId: session.user.id,
      title: systemQuest.title,
      description: systemQuest.description,
      category: systemQuest.category,
      difficulty: systemQuest.difficulty,
      duration: systemQuest.duration,
      xpReward: systemQuest.xpReward,
      goldReward: systemQuest.goldReward,
      type: 'PERSONAL',
      status: 'PENDING'
    }
  })

  revalidatePath('/quests')
  return { success: true }
}
