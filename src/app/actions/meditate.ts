"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const MEDITATE_XP_PER_MINUTE = 3;
const MEDITATE_GOLD_PER_MINUTE = 0.5;

export async function startMeditationSession(mode: string, duration: number) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.username) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { username: (session?.user as any)?.username },
  });
  if (!user) throw new Error("User not found");

  const meditateSession = await prisma.meditationSession.create({
    data: {
      userId: user.id,
      mode,
      duration,
    },
  });

  return { success: true, sessionId: meditateSession.id };
}

export async function endMeditationSession(
  sessionId: string,
  completed: boolean
) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.username) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { username: (session?.user as any)?.username },
  });
  if (!user) throw new Error("User not found");

  const meditateSession = await prisma.meditationSession.findUnique({
    where: { id: sessionId },
  });
  
  if (!meditateSession || meditateSession.userId !== user.id) {
    throw new Error("Meditation session not found or unauthorized");
  }

  if (meditateSession.completed || meditateSession.rewardGranted) {
    throw new Error("Session already ended");
  }

  const now = new Date();
  const serverElapsedSeconds = Math.floor((now.getTime() - meditateSession.startedAt.getTime()) / 1000);
  
  let xpReward = 0;
  let goldReward = 0;
  
  const plannedDurationSeconds = meditateSession.duration * 60;
  
  // They only get rewards if they actually meditated for the full time
  // allow 10 seconds leeway for network delay
  const isValid = completed && serverElapsedSeconds >= (plannedDurationSeconds - 10);

  if (isValid) {
    xpReward = meditateSession.duration * MEDITATE_XP_PER_MINUTE;
    goldReward = Math.floor(meditateSession.duration * MEDITATE_GOLD_PER_MINUTE);

    const { calculateLevelProgress } = require("@/lib/rpgEngine");
    const newXp = user.xp + xpReward;
    const levelProgress = calculateLevelProgress(newXp);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        level: levelProgress.currentLevel,
        gold: { increment: goldReward },
        focus: { increment: Math.floor(xpReward / 10) }, 
      },
    });
  }

  await prisma.meditationSession.update({
    where: { id: sessionId },
    data: {
      completed: isValid,
      rewardGranted: isValid,
    },
  });

  revalidatePath("/meditate");
  revalidatePath("/dashboard");

  return { success: true, xpReward, goldReward };
}
