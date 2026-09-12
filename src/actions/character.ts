"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function seedAndGetAvatars() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const count = await prisma.avatar.count()
  if (count === 0) {
    await prisma.avatar.createMany({
      data: [
        { name: "Default Hero", imageUrl: "👤", rarity: "COMMON", unlockLevel: 1 },
        { name: "Cyber Ninja", imageUrl: "🥷", rarity: "RARE", unlockLevel: 5 },
        { name: "Void Mage", imageUrl: "🧙", rarity: "EPIC", unlockLevel: 10 },
        { name: "Mecha Knight", imageUrl: "🤖", rarity: "LEGENDARY", unlockLevel: 15 },
        { name: "Star Explorer", imageUrl: "🧑‍🚀", rarity: "RARE", unlockLevel: 3 },
      ]
    })
  }

  const avatars = await prisma.avatar.findMany({
    orderBy: { unlockLevel: 'asc' }
  })
  
  return avatars
}

export async function equipAvatar(avatarId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  // first unequip all
  await prisma.userAvatar.updateMany({
    where: { userId: session.user.id },
    data: { equipped: false }
  })

  // check if user owns it, if not, give it to them (assuming they meet the level req, but for now we'll just give it)
  let userAvatar = await prisma.userAvatar.findFirst({
    where: { userId: session.user.id, avatarId }
  })

  if (!userAvatar) {
    userAvatar = await prisma.userAvatar.create({
      data: {
        userId: session.user.id,
        avatarId,
        equipped: true
      }
    })
  } else {
    await prisma.userAvatar.update({
      where: { id: userAvatar.id },
      data: { equipped: true }
    })
  }

  revalidatePath("/character")
  return { success: true }
}

export async function getSkillNodes() {
  const count = await prisma.skillNode.count()
  if (count === 0) {
    await prisma.skillNode.createMany({
      data: [
        // Intellect
        { attribute: "INTELLECT", name: "Novice Coder", description: "Learn the basics.", requiredAttrLevel: 5 },
        { attribute: "INTELLECT", name: "Algorithm Master", description: "Solve complex problems.", requiredAttrLevel: 15 },
        { attribute: "INTELLECT", name: "System Architect", description: "Design scalable apps.", requiredAttrLevel: 30 },
        // Strength
        { attribute: "STRENGTH", name: "Fitness Initiate", description: "Start moving.", requiredAttrLevel: 5 },
        { attribute: "STRENGTH", name: "Iron Lifter", description: "Lift heavy things.", requiredAttrLevel: 15 },
        { attribute: "STRENGTH", name: "Peak Human", description: "Max physical state.", requiredAttrLevel: 30 },
        // Discipline
        { attribute: "DISCIPLINE", name: "Early Riser", description: "Wake up on time.", requiredAttrLevel: 5 },
        { attribute: "DISCIPLINE", name: "Habit Former", description: "Never break a streak.", requiredAttrLevel: 15 },
        { attribute: "DISCIPLINE", name: "Iron Will", description: "Unshakable routine.", requiredAttrLevel: 30 },
        // Creativity
        { attribute: "CREATIVITY", name: "Doodler", description: "Basic sketches.", requiredAttrLevel: 5 },
        { attribute: "CREATIVITY", name: "Visionary", description: "Unique ideas.", requiredAttrLevel: 15 },
        { attribute: "CREATIVITY", name: "Master Creator", description: "Flawless execution.", requiredAttrLevel: 30 },
        // Focus
        { attribute: "FOCUS", name: "Pomodoro Starter", description: "25 min focus.", requiredAttrLevel: 5 },
        { attribute: "FOCUS", name: "Deep Worker", description: "Hours of flow.", requiredAttrLevel: 15 },
        { attribute: "FOCUS", name: "Zen Mind", description: "Zero distractions.", requiredAttrLevel: 30 },
      ]
    })
  }

  return prisma.skillNode.findMany()
}
