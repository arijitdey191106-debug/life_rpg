"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const SYSTEM_CHALLENGES = [
  {
    key: "reach_level_5",
    name: "A New Journey",
    description: "Reach level 5 to prove your dedication.",
    category: "ALL",
    difficulty: "EASY",
    unlockLevel: 1,
    xpReward: 500,
    goldReward: 200,
    icon: "🌟",
    type: "MILESTONE",
  },
  {
    key: "intellect_quests_10",
    name: "Scholar's Path",
    description: "Complete 10 Intellect quests.",
    category: "INTELLECT",
    difficulty: "MEDIUM",
    unlockLevel: 1,
    xpReward: 800,
    goldReward: 300,
    icon: "📚",
    type: "MILESTONE",
  },
  {
    key: "strength_quests_10",
    name: "Warrior's Path",
    description: "Complete 10 Strength quests.",
    category: "STRENGTH",
    difficulty: "MEDIUM",
    unlockLevel: 1,
    xpReward: 800,
    goldReward: 300,
    icon: "⚔️",
    type: "MILESTONE",
  },
  {
    key: "daily_task_master",
    name: "Daily Task Master",
    description: "Complete 3 quests today.",
    category: "ALL",
    difficulty: "EASY",
    unlockLevel: 1,
    xpReward: 200,
    goldReward: 100,
    icon: "📅",
    type: "DAILY",
  },
  {
    key: "weekly_champion",
    name: "Weekly Champion",
    description: "Complete 15 quests this week.",
    category: "ALL",
    difficulty: "HARD",
    unlockLevel: 1,
    xpReward: 1000,
    goldReward: 500,
    icon: "🏆",
    type: "WEEKLY",
  }
];

export async function initializeSystemChallenges() {
  for (const challenge of SYSTEM_CHALLENGES) {
    await prisma.systemChallenge.upsert({
      where: { key: challenge.key },
      update: {},
      create: challenge,
    });
  }
}

export async function getUserChallenges() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;
  await initializeSystemChallenges();

  const allSystemChallenges = await prisma.systemChallenge.findMany();

  for (const challenge of allSystemChallenges) {
    await prisma.userChallenge.upsert({
      where: {
        userId_challengeId: {
          userId,
          challengeId: challenge.id,
        },
      },
      update: {},
      create: {
        userId,
        challengeId: challenge.id,
        status: "AVAILABLE",
        progress: 0,
      },
    });
  }

  const userChallenges = await prisma.userChallenge.findMany({
    where: { userId },
    include: { challenge: true },
  });

  return { userChallenges };
}

export async function startChallenge(userChallengeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userChallenge = await prisma.userChallenge.findUnique({
    where: { id: userChallengeId },
  });

  if (!userChallenge || userChallenge.userId !== session.user.id) {
    return { error: "Not found or unauthorized" };
  }

  if (userChallenge.status !== "AVAILABLE") {
    return { error: "Invalid state transition" };
  }

  await prisma.userChallenge.update({
    where: { id: userChallengeId },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath("/quests");
  return { success: true };
}

export async function reportChallengeObjectiveMet(userChallengeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userChallenge = await prisma.userChallenge.findUnique({
    where: { id: userChallengeId },
  });

  if (!userChallenge || userChallenge.userId !== session.user.id) {
    return { error: "Not found or unauthorized" };
  }

  if (userChallenge.status !== "IN_PROGRESS") {
    return { error: "Invalid state transition" };
  }

  await prisma.userChallenge.update({
    where: { id: userChallengeId },
    data: { status: "OBJECTIVE_MET" },
  });

  revalidatePath("/quests");
  return { success: true };
}

export async function verifyChallenge(userChallengeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;

  const userChallenge = await prisma.userChallenge.findUnique({
    where: { id: userChallengeId },
    include: { challenge: true },
  });

  if (!userChallenge || userChallenge.userId !== userId) {
    return { error: "Not found or unauthorized" };
  }

  if (userChallenge.status !== "OBJECTIVE_MET") {
    return { error: "Invalid state transition. Must be OBJECTIVE_MET." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  let isCompleted = false;
  let required = 0;
  let current = 0;
  let noun = "units";
  
  const challengeKey = userChallenge.challenge.key;

  if (challengeKey === "reach_level_5") {
    required = 5;
    current = user.level;
    noun = "Levels";
    if (user.level >= 5) isCompleted = true;
  } else if (challengeKey === "intellect_quests_10") {
    required = 10;
    noun = "Intellect Quests";
    current = await prisma.quest.count({ 
      where: { userId, category: "INTELLECT", status: "CLAIMED" }
    });
    if (current >= 10) isCompleted = true;
  } else if (challengeKey === "strength_quests_10") {
    required = 10;
    noun = "Strength Quests";
    current = await prisma.quest.count({ 
      where: { userId, category: "STRENGTH", status: "CLAIMED" }
    });
    if (current >= 10) isCompleted = true;
  } else if (challengeKey === "daily_task_master") {
    required = 3;
    noun = "Daily Quests";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    current = await prisma.quest.count({
      where: { userId, status: "CLAIMED", completedAt: { gte: today } }
    });
    if (current >= 3) isCompleted = true;
  } else if (challengeKey === "weekly_champion") {
    required = 15;
    noun = "Weekly Quests";
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    current = await prisma.quest.count({
      where: { userId, status: "CLAIMED", completedAt: { gte: weekAgo } }
    });
    if (current >= 15) isCompleted = true;
  }

  if (!isCompleted) {
    return { 
      error: "OBJECTIVE_NOT_MET", 
      details: {
        questName: userChallenge.challenge.name,
        description: userChallenge.challenge.description,
        required,
        current,
        remaining: Math.max(0, required - current),
        noun
      }
    };
  }

  await prisma.userChallenge.update({
    where: { id: userChallengeId },
    data: { status: "VERIFIED" },
  });

  revalidatePath("/quests");
  return { success: true };
}

export async function claimChallengeReward(userChallengeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;

  const userChallenge = await prisma.userChallenge.findUnique({
    where: { id: userChallengeId },
    include: { challenge: true },
  });

  if (!userChallenge || userChallenge.userId !== userId) {
    return { error: "Not found or unauthorized" };
  }

  if (userChallenge.status !== "VERIFIED") {
    return { error: "Challenge must be VERIFIED before claiming." };
  }

  try {
    await prisma.$transaction([
      prisma.rewardTransaction.create({
        data: { 
          userId, 
          sourceId: userChallenge.challengeId, 
          sourceType: "CHALLENGE", 
          xpGranted: userChallenge.challenge.xpReward, 
          goldGranted: userChallenge.challenge.goldReward 
        }
      }),
      prisma.userChallenge.update({
        where: { id: userChallengeId },
        data: { status: "CLAIMED", completedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: userChallenge.challenge.xpReward },
          gold: { increment: userChallenge.challenge.goldReward },
        },
      }),
    ]);
  } catch (error: any) {
    // Unique constraint on RewardTransaction will prevent double claiming
    if (error.code === 'P2002') {
      return { error: "Reward already claimed." };
    }
    throw error;
  }

  revalidatePath("/quests");
  return { success: true };
}
