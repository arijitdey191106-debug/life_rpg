"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { checkAchievements } from "@/app/actions/achievements"

export async function getShopItems() {
  try {
    const items = await prisma.item.findMany({
      orderBy: [
        { type: 'asc' },
        { cost: 'asc' }
      ]
    })
    return { success: true, items }
  } catch (error) {
    console.error("Error fetching shop items:", error)
    return { success: false, error: "Failed to fetch shop items" }
  }
}

export async function getUserInventory() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const inventory = await prisma.userItem.findMany({
      where: { userId: session.user.id },
      include: { item: true },
      orderBy: { acquiredAt: 'desc' }
    })
    
    return { success: true, inventory }
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return { success: false, error: "Failed to fetch inventory" }
  }
}

export async function purchaseItem(itemId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const userId = session.user.id

    // Load item
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return { success: false, error: "Item not found" }
    }

    // Check if already bought
    const existing = await prisma.userItem.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId
        }
      }
    })

    if (existing) {
      return { success: false, error: "Item already owned" }
    }

    // Check user level and gold
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gold: true, level: true }
    })

    if (!user || user.gold < item.cost) {
      return { success: false, error: "Not enough gold" }
    }

    // Parse [UNLOCK_LEVEL:X] from item description
    const unlockLevelMatch = item.description.match(/\[UNLOCK_LEVEL:(\d+)\]/i);
    if (unlockLevelMatch) {
      const requiredLevel = parseInt(unlockLevelMatch[1], 10);
      if (user.level < requiredLevel) {
        return { success: false, error: `Requires Level ${requiredLevel}` };
      }
    }

    // Transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          gold: { decrement: item.cost },
          goldSpent: { increment: item.cost }
        }
      }),
      prisma.userItem.create({
        data: {
          userId,
          itemId
        }
      })
    ])

    // Check achievements
    await checkAchievements(userId)
    
    revalidatePath("/outfits")
    
    revalidatePath("/character")
    revalidatePath("/")
    
    return { success: true, message: `Purchased ${item.name}!` }
  } catch (error) {
    console.error("Error purchasing item:", error)
    return { success: false, error: "Transaction failed" }
  }
}

export async function equipItem(userItemId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Find the item and verify ownership
    const userItem = await prisma.userItem.findUnique({
      where: { id: userItemId },
      include: { item: true }
    })

    if (!userItem || userItem.userId !== session.user.id) {
      return { success: false, error: "Item not found or unauthorized" }
    }

    // Transaction: unequip same type, then equip new
    await prisma.$transaction(async (tx) => {
      // Find all items of this type the user owns
      const userItemsOfSameType = await tx.userItem.findMany({
        where: {
          userId: session.user.id,
          item: {
            type: userItem.item.type
          }
        }
      })
      
      const idsToUnequip = userItemsOfSameType.map(ui => ui.id)

      // Unequip all
      if (idsToUnequip.length > 0) {
        await tx.userItem.updateMany({
          where: { id: { in: idsToUnequip } },
          data: { equipped: false }
        })
      }

      // Equip the new one
      await tx.userItem.update({
        where: { id: userItemId },
        data: { equipped: true }
      })
    })

    revalidatePath("/outfits")
    
    revalidatePath("/character")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error equipping item:", error)
    return { success: false, error: "Failed to equip item" }
  }
}

export async function unequipItem(userItemId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const userItem = await prisma.userItem.findUnique({
      where: { id: userItemId }
    })

    if (!userItem || userItem.userId !== session.user.id) {
      return { success: false, error: "Item not found or unauthorized" }
    }

    await prisma.userItem.update({
      where: { id: userItemId },
      data: { equipped: false }
    })

    revalidatePath("/outfits")
    
    revalidatePath("/character")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error unequipping item:", error)
    return { success: false, error: "Failed to unequip item" }
  }
}
