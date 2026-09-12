"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function checkAchievements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      quests: true,
      inventory: true,
      achievements: true,
    }
  });

  if (!user) return [];

  const allAchievements = await prisma.achievement.findMany();
  
  const unlockedIds = new Set(user.achievements.map(ua => ua.achievementId));
  const newUnlocks: string[] = [];

  const completedQuests = user.quests.filter((q: any) => q.status === "COMPLETED" || q.status === "DONE");
  const intellectQuests = completedQuests.filter((q: any) => q.category === "INTELLECT");
  const strengthQuests = completedQuests.filter((q: any) => q.category === "STRENGTH");

  let totalXpReward = 0;
  let totalGoldReward = 0;

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    let conditionMet = false;

    switch (achievement.key) {
      case 'FIRST_QUEST': conditionMet = completedQuests.length >= 1; break;
      case 'QUEST_10': conditionMet = completedQuests.length >= 10; break;
      case 'QUEST_25': conditionMet = completedQuests.length >= 25; break;
      case 'QUEST_50': conditionMet = completedQuests.length >= 50; break;
      case 'QUEST_100': conditionMet = completedQuests.length >= 100; break;
      case 'STREAK_3': conditionMet = user.bestStreak >= 3; break;
      case 'STREAK_7': conditionMet = user.bestStreak >= 7; break;
      case 'STREAK_14': conditionMet = user.bestStreak >= 14; break;
      case 'STREAK_30': conditionMet = user.bestStreak >= 30; break;
      case 'LEVEL_5': conditionMet = user.level >= 5; break;
      case 'LEVEL_10': conditionMet = user.level >= 10; break;
      case 'LEVEL_25': conditionMet = user.level >= 25; break;
      case 'GOLD_500': conditionMet = user.gold >= 500; break;
      case 'GOLD_2000': conditionMet = user.gold >= 2000; break;
      case 'ATTR_10': 
        conditionMet = Math.max(user.intellect, user.strength, user.discipline, user.creativity, user.focus) >= 10; 
        break;
      case 'ATTR_25': 
        conditionMet = Math.max(user.intellect, user.strength, user.discipline, user.creativity, user.focus) >= 25; 
        break;
      case 'ALL_ATTR_5': 
        conditionMet = Math.min(user.intellect, user.strength, user.discipline, user.creativity, user.focus) >= 5; 
        break;
      case 'FIRST_PURCHASE': conditionMet = user.inventory.length >= 1; break;
      case 'KNOWLEDGE_SEEKER': conditionMet = intellectQuests.length >= 10; break;
      case 'IRON_BODY': conditionMet = strengthQuests.length >= 10; break;
    }

    if (conditionMet) {
      await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: achievement.id,
        }
      });
      newUnlocks.push(achievement.name);
      totalXpReward += achievement.xpReward;
      totalGoldReward += achievement.goldReward;
    }
  }

  if (newUnlocks.length > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: totalXpReward },
        gold: { increment: totalGoldReward },
      }
    });
    revalidatePath('/achievements');
    revalidatePath('/dashboard');
  }

  return newUnlocks;
}

export async function getUserAchievements() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const allAchievements = await prisma.achievement.findMany({
    orderBy: { rarity: 'desc' }
  });

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId: session.user.id }
  });

  const unlockedMap = new Map();
  for (const ua of userAchievements) {
    unlockedMap.set(ua.achievementId, ua.unlockedAt);
  }

  return allAchievements.map(ach => ({
    ...ach,
    unlockedAt: unlockedMap.get(ach.id) || null
  }));
}
