"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getUserSettings() {
  const session = await getServerSession(authOptions)
  if (!(session?.user as any)?.username) {
    return null
  }
  
  const user = await prisma.user.findUnique({
    where: { username: (session?.user as any)?.username },
    select: {
      masterVolume: true,
      uiVolume: true,
      ambientVolume: true,
      rewardVolume: true,
      isMuted: true,
      reducedMotion: true,
      locationOptIn: true,
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
  locationOptIn?: boolean
}) {
  const session = await getServerSession(authOptions)
  if (!(session?.user as any)?.username) {
    throw new Error("Unauthorized")
  }
  
  await prisma.user.update({
    where: { username: (session?.user as any)?.username },
    data
  })
  
  return { success: true }
}
