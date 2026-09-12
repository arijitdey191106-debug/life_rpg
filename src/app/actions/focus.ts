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
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
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
  status: "COMPLETED" | "ABORTED"
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
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
  const validActiveSeconds = Math.min(clientActiveSeconds, serverElapsedSeconds);
  const validMinutes = Math.floor(validActiveSeconds / 60);

  let xpReward = 0;
  let goldReward = 0;
  
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

  if (status === "COMPLETED" && validMinutes > 0) {
    let rawXp = validMinutes * FOCUS_XP_PER_MINUTE;
    
    if (xpEarnedToday + rawXp > DAILY_XP_CAP) {
      xpReward = Math.max(0, DAILY_XP_CAP - xpEarnedToday);
    } else {
      xpReward = rawXp;
    }
    
    goldReward = Math.floor(validMinutes * FOCUS_GOLD_PER_MINUTE);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: xpReward },
        gold: { increment: goldReward },
        focus: { increment: Math.floor(xpReward / 10) }, // tiny attribute boost
      },
    });
  }

  await prisma.focusSession.update({
    where: { id: sessionId },
    data: {
      endedAt: now,
      status,
      validActiveDuration: validActiveSeconds,
      interruptionCount,
      rewardGranted: status === "COMPLETED" && validMinutes > 0,
    },
  });

  revalidatePath("/focus");
  revalidatePath("/dashboard"); // Assuming there's a dashboard

  return { success: true, xpReward, goldReward, validMinutes };
}
