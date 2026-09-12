"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getUserSettings() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return null
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      masterVolume: true,
      uiVolume: true,
      ambientVolume: true,
      rewardVolume: true,
      isMuted: true,
      reducedMotion: true,
    }
  })
  
  return user
}

export async function updateUserSettings(data: {
  masterVolume?: number
  uiVolume?: number
  ambientVolume?: number
  rewardVolume?: number
  isMuted?: boolean
  reducedMotion?: boolean
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }
  
  await prisma.user.update({
    where: { email: session.user.email },
    data
  })
  
  return { success: true }
}
