"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assume this is where authOptions lives, or use whatever is common
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const FOCUS_XP_PER_MINUTE = 4;
const FOCUS_GOLD_PER_MINUTE = 0.5;
const DAILY_XP_CAP = 1000;

export async function startFocusSession(plannedDuration: number) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.username) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { username: (session?.user as any)?.username },
  });
  if (!user) throw new Error("User not found");

  const focusSession = await prisma.focusSession.create({
    data: {
      userId: user.id,
      plannedDuration,
      status: "IN_PROGRESS",
    },
  });

  return { success: true, sessionId: focusSession.id };
}

export async function endFocusSession(
  sessionId: string,
  clientActiveSeconds: number,
  interruptionCount: number,
  status: "COMPLETED" | "ABORTED",
  abandoned: boolean = false
) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.username) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { username: (session?.user as any)?.username },
  });
  if (!user) throw new Error("User not found");

  const focusSession = await prisma.focusSession.findUnique({
    where: { id: sessionId },
  });
  
  if (!focusSession || focusSession.userId !== user.id) {
    throw new Error("Focus session not found or unauthorized");
  }

  if (focusSession.status !== "IN_PROGRESS") {
    throw new Error("Session already ended");
  }

  const now = new Date();
  const serverElapsedSeconds = Math.floor((now.getTime() - focusSession.startedAt.getTime()) / 1000);
  
  // Validate active seconds
  const INTERRUPTION_PENALTY_SECONDS = 60;
  let validActiveSeconds = Math.min(clientActiveSeconds, serverElapsedSeconds);
  validActiveSeconds = Math.max(0, validActiveSeconds - (interruptionCount * INTERRUPTION_PENALTY_SECONDS));
  const validMinutes = Math.floor(validActiveSeconds / 60);
  const plannedSeconds = focusSession.plannedDuration * 60;

  let xpReward = 0;
  let goldReward = 0;
  let penaltyApplied = false;

  const isInsufficientDuration = validActiveSeconds < plannedSeconds * 0.9;

  if (!abandoned && isInsufficientDuration) {
    throw new Error("Required duration not met. Must abandon to end early.");
  }

  if (abandoned || isInsufficientDuration) {
    // Penalty
    penaltyApplied = true;
    const { calculateLevelProgress } = require("@/lib/rpgEngine");
    const newXp = Math.max(0, user.xp - 25);
    const levelProgress = calculateLevelProgress(newXp);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        level: levelProgress.currentLevel,
      },
    });
  } else if (status === "COMPLETED" && validMinutes > 0) {
    // Calculate daily XP to enforce cap
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysSessions = await prisma.focusSession.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: today },
        rewardGranted: true,
      },
    });

    const xpEarnedToday = todaysSessions.reduce((acc, curr) => {
      return acc + Math.floor(curr.validActiveDuration / 60) * FOCUS_XP_PER_MINUTE;
    }, 0);

    let rawXp = validMinutes * FOCUS_XP_PER_MINUTE;
    
    if (xpEarnedToday + rawXp > DAILY_XP_CAP) {
      xpReward = Math.max(0, DAILY_XP_CAP - xpEarnedToday);
    } else {
      xpReward = rawXp;
    }
    
    goldReward = Math.floor(validMinutes * FOCUS_GOLD_PER_MINUTE);

    const { calculateLevelProgress } = require("@/lib/rpgEngine");
    const newXp = user.xp + xpReward;
    const levelProgress = calculateLevelProgress(newXp);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        level: levelProgress.currentLevel,
        gold: { increment: goldReward },
        focus: { increment: Math.floor(xpReward / 10) }, // tiny attribute boost
      },
    });
  }

  await prisma.focusSession.update({
    where: { id: sessionId },
    data: {
      endedAt: now,
      status: abandoned ? "ABORTED" : status,
      validActiveDuration: validActiveSeconds,
      interruptionCount: interruptionCount,
      rewardGranted: !penaltyApplied && status === "COMPLETED",
    },
  });

  revalidatePath("/focus");
  revalidatePath("/dashboard"); // Assuming there's a dashboard

  return { success: true, xpReward, goldReward, validMinutes, penaltyApplied };
}
