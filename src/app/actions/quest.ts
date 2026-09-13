"use server"

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateLevelProgress } from '@/lib/rpgEngine'
import { checkAchievements } from '@/app/actions/achievements'

const BASE_REWARDS = {
  EASY: { xp: 10, gold: 5 },
  MEDIUM: { xp: 25, gold: 15 },
  HARD: { xp: 50, gold: 30 },
  EPIC: { xp: 100, gold: 60 }
}

const DURATION_MODIFIER = 0.5

export async function createQuest(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const category = formData.get('category') as string
  const difficulty = formData.get('difficulty') as keyof typeof BASE_REWARDS
  const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : null
  const dueDateStr = formData.get('dueDate') as string
  const dueDate = dueDateStr ? new Date(dueDateStr) : null
  const isRecurring = formData.get('isRecurring') === 'true'
  const recurringInterval = formData.get('recurringInterval') as string | null

  if (!title || !category || !difficulty) {
    throw new Error('Missing required fields')
  }

  let xpReward = BASE_REWARDS[difficulty]?.xp || 10
  let goldReward = BASE_REWARDS[difficulty]?.gold || 5

  if (duration && duration > 0) {
    xpReward += Math.floor(duration * DURATION_MODIFIER)
    goldReward += Math.floor((duration * DURATION_MODIFIER) / 2)
  }

  await prisma.quest.create({
    data: {
      userId: session.user.id,
      title,
      description,
      category,
      difficulty,
      duration,
      xpReward,
      goldReward,
      status: 'PENDING',
      dueDate,
      isRecurring,
      recurringInterval
    }
  })

  revalidatePath('/quests')
}

export async function editQuest(questId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const quest = await prisma.quest.findUnique({ where: { id: questId } })
  if (!quest || quest.userId !== session.user.id) throw new Error('Unauthorized')

  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const category = formData.get('category') as string
  const difficulty = formData.get('difficulty') as keyof typeof BASE_REWARDS
  const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : null
  const dueDateStr = formData.get('dueDate') as string
  const dueDate = dueDateStr ? new Date(dueDateStr) : null
  const isRecurring = formData.get('isRecurring') === 'true'
  const recurringInterval = formData.get('recurringInterval') as string | null

  if (!title || !category || !difficulty) {
    throw new Error('Missing required fields')
  }

  let xpReward = BASE_REWARDS[difficulty]?.xp || 10
  let goldReward = BASE_REWARDS[difficulty]?.gold || 5

  if (duration && duration > 0) {
    xpReward += Math.floor(duration * DURATION_MODIFIER)
    goldReward += Math.floor((duration * DURATION_MODIFIER) / 2)
  }

  await prisma.quest.update({
    where: { id: questId },
    data: {
      title,
      description,
      category,
      difficulty,
      duration,
      xpReward,
      goldReward,
      dueDate,
      isRecurring,
      recurringInterval
    }
  })

  revalidatePath('/quests')
}

export async function deleteQuest(questId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const quest = await prisma.quest.findUnique({ where: { id: questId } })
  if (!quest || quest.userId !== session.user.id) throw new Error('Unauthorized')

  await prisma.quest.delete({ where: { id: questId } })
  
  revalidatePath('/quests')
}

export async function startQuest(questId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const quest = await prisma.quest.findUnique({ where: { id: questId } })
  if (!quest || quest.userId !== session.user.id) throw new Error('Unauthorized')
  if (quest.status !== 'AVAILABLE') throw new Error('Invalid state transition')

  await prisma.quest.update({
    where: { id: questId },
    data: { status: 'IN_PROGRESS' }
  })
  revalidatePath('/quests')
}

export async function reportQuestObjectiveMet(questId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const quest = await prisma.quest.findUnique({ where: { id: questId } })
  if (!quest || quest.userId !== session.user.id) throw new Error('Unauthorized')
  if (quest.status !== 'IN_PROGRESS') throw new Error('Invalid state transition')

  await prisma.quest.update({
    where: { id: questId },
    data: { status: 'OBJECTIVE_MET' }
  })
  revalidatePath('/quests')
}

export async function verifyQuest(questId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const quest = await prisma.quest.findUnique({ where: { id: questId } })
  if (!quest || quest.userId !== session.user.id) throw new Error('Unauthorized')
  if (quest.status !== 'OBJECTIVE_MET') throw new Error('Invalid state transition')

  // Self-created quests have no rigid external proof to query, 
  // so we implicitly trust the OBJECTIVE_MET report and advance it.
  await prisma.quest.update({
    where: { id: questId },
    data: { status: 'VERIFIED' }
  })
  revalidatePath('/quests')
}

export async function claimQuestReward(questId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const quest = await prisma.quest.findUnique({ where: { id: questId } })
  if (!quest || quest.userId !== userId) throw new Error('Unauthorized')
  if (quest.status !== 'VERIFIED' && quest.status !== 'PENDING') {
    throw new Error('Invalid state transition. Must be VERIFIED or PENDING.')
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const now = new Date()
  let currentStreak = user.currentStreak
  let bestStreak = user.bestStreak
  const lastActiveDate = user.lastActive ? user.lastActive.toISOString().split('T')[0] : null
  const todayStr = now.toISOString().split('T')[0]

  if (lastActiveDate !== todayStr) {
      if (lastActiveDate) {
          const lastDate = new Date(lastActiveDate)
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
              currentStreak++
          } else {
              currentStreak = 1
          }
      } else {
          currentStreak = 1
      }
  }

  if (currentStreak > bestStreak) {
      bestStreak = currentStreak
  }

  const categoryAttr = quest.category.toLowerCase()
  const attributeVal = (user as any)[categoryAttr] || 0

  const newXp = user.xp + quest.xpReward
  const levelProgress = calculateLevelProgress(newXp)

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Create RewardTransaction first (fails if already claimed)
      let transactionSourceId = questId;
      if (quest.isRecurring) {
        transactionSourceId = `${questId}_${todayStr}`;
      }

      await tx.rewardTransaction.create({
        data: { 
          userId, 
          sourceId: transactionSourceId, 
          sourceType: "QUEST", 
          xpGranted: quest.xpReward, 
          goldGranted: quest.goldReward 
        }
      });

      if (quest.isRecurring) {
        let nextDueDate = quest.dueDate ? new Date(quest.dueDate) : new Date();
        if (quest.recurringInterval === 'DAILY') {
          nextDueDate.setDate(nextDueDate.getDate() + 1);
        } else if (quest.recurringInterval === 'WEEKLY') {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (quest.recurringInterval === 'MONTHLY') {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        await tx.quest.update({
          where: { id: questId },
          data: { status: 'PENDING', dueDate: nextDueDate }
        });
      } else {
        await tx.quest.update({
          where: { id: questId },
          data: { status: 'CLAIMED', completedAt: now }
        });
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: quest.xpReward },
          gold: { increment: quest.goldReward },
          [categoryAttr]: { increment: 1 },
          currentStreak,
          bestStreak,
          lastActive: now,
        }
      });
      
      const computedLevel = calculateLevelProgress(updated.xp);
      if (computedLevel.currentLevel > updated.level) {
        await tx.user.update({
          where: { id: userId },
          data: { level: computedLevel.currentLevel }
        });
        updated.level = computedLevel.currentLevel;
      }
      return updated;
    });

    levelProgress.currentLevel = updatedUser.level;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error("Reward already claimed for this interval.")
    }
    throw error
  }

  // check achievements
  try {
    await checkAchievements(userId)
  } catch (e) {
    console.error("Failed to check achievements", e)
  }

  revalidatePath('/quests', 'layout')
  revalidatePath('/', 'layout')
  revalidatePath('/character', 'layout')
  revalidatePath('/progress', 'layout')
  return { 
    xp: quest.xpReward, 
    gold: quest.goldReward, 
    category: quest.category, 
    levelUp: levelProgress.currentLevel > user.level ? levelProgress.currentLevel : null 
  }
}
