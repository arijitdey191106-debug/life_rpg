"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

export async function searchUsers(query: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const userId = (session.user as any).id as string
  if (!userId) return { success: false, error: "Session error. Please log in again." }

  if (!query || query.trim().length === 0) {
    return { success: true, users: [] }
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query.trim(),
          mode: "insensitive", // Fix: case-insensitive search on PostgreSQL
        },
        id: {
          not: userId
        }
      },
      select: {
        id: true,
        username: true,
        level: true,
        avatars: {
          where: { equipped: true },
          include: { avatar: true }
        },
      },
      take: 10
    })

    return { success: true, users }
  } catch (error) {
    console.error("Search users error:", error)
    return { success: false, error: "Failed to search users" }
  }
}

export async function sendFriendRequest(receiverId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const senderId = (session.user as any).id as string

  if (!senderId) return { success: false, error: "Session error. Please log in again." }
  if (!receiverId) return { success: false, error: "Invalid target user." }

  if (senderId === receiverId) {
    return { success: false, error: "You cannot send a request to yourself." }
  }

  try {
    // Check if already friends
    const existingFriend = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId }
        ]
      }
    })

    if (existingFriend) {
      return { success: false, error: "You are already connected." }
    }

    // Check if ANY request already exists between these two users (in either direction)
    // Must check both directions because the schema unique constraint is (senderId, receiverId)
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    })

    if (existingRequest) {
      if (existingRequest.senderId === senderId && existingRequest.status === "PENDING") {
        return { success: false, error: "Request already sent." }
      }
      if (existingRequest.senderId === receiverId && existingRequest.status === "PENDING") {
        return {
          success: false,
          error: "This player already sent you a request. Check your Requests Received section."
        }
      }
      // Previously declined — delete and re-create so the user can retry
      await prisma.friendRequest.delete({ where: { id: existingRequest.id } })
    }

    await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: "PENDING"
      }
    })

    revalidatePath("/party")
    return { success: true, message: "Request sent successfully." }
  } catch (error) {
    // Safety net: catch Prisma unique constraint violation (P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "Request already sent." }
    }
    console.error("Send friend request error:", error)
    return { success: false, error: "Unable to send request. Please try again." }
  }
}

export async function cancelFriendRequest(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const userId = (session.user as any).id as string
  if (!userId) return { success: false, error: "Session error. Please log in again." }

  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    })

    if (!request || request.senderId !== userId || request.status !== "PENDING") {
      return { success: false, error: "Invalid request" }
    }

    await prisma.friendRequest.delete({
      where: { id: requestId }
    })

    revalidatePath("/party")
    return { success: true }
  } catch (error) {
    console.error("Cancel friend request error:", error)
    return { success: false, error: "Failed to cancel request" }
  }
}

export async function acceptFriendRequest(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const userId = (session.user as any).id as string
  if (!userId) return { success: false, error: "Session error. Please log in again." }

  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    })

    if (!request || request.receiverId !== userId || request.status !== "PENDING") {
      return { success: false, error: "Invalid request" }
    }

    // Use transaction to delete request and create friendship atomically
    await prisma.$transaction(async (tx) => {
      await tx.friendRequest.delete({
        where: { id: requestId }
      })

      await tx.friendship.create({
        data: {
          userId: request.senderId,
          friendId: request.receiverId
        }
      })
    })

    revalidatePath("/party")
    return { success: true }
  } catch (error) {
    console.error("Accept friend request error:", error)
    return { success: false, error: "Failed to accept request" }
  }
}

export async function declineFriendRequest(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const userId = (session.user as any).id as string
  if (!userId) return { success: false, error: "Session error. Please log in again." }

  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    })

    if (!request || request.receiverId !== userId || request.status !== "PENDING") {
      return { success: false, error: "Invalid request" }
    }

    await prisma.friendRequest.delete({
      where: { id: requestId }
    })

    revalidatePath("/party")
    return { success: true }
  } catch (error) {
    console.error("Decline friend request error:", error)
    return { success: false, error: "Failed to decline request" }
  }
}

export async function removeFriend(friendId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const userId = (session.user as any).id as string

  try {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    })

    // Also delete any existing requests between them
    await prisma.friendRequest.deleteMany({
       where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId }
        ]
      }
    })

    revalidatePath("/party")
    return { success: true }
  } catch (error) {
    console.error("Remove friend error:", error)
    return { success: false, error: "Failed to remove friend" }
  }
}

export async function getParty() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const userId = (session.user as any).id as string
  if (!userId) return { success: false, error: "Session error. Please log in again." }

  try {
    // Get pending received requests
    const pendingRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: "PENDING"
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            level: true,
            avatars: {
              where: { equipped: true },
              include: { avatar: true }
            }
          }
        }
      }
    })

    // Get pending sent requests
    const sentRequests = await prisma.friendRequest.findMany({
      where: {
        senderId: userId,
        status: "PENDING"
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            level: true,
            avatars: {
              where: { equipped: true },
              include: { avatar: true }
            }
          }
        }
      }
    })

    // Get friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: userId },
          { friendId: userId }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            level: true,
            currentStreak: true,
            intellect: true,
            strength: true,
            discipline: true,
            creativity: true,
            focus: true,
            avatars: {
              where: { equipped: true },
              include: { avatar: true }
            }
          }
        },
        friend: {
          select: {
            id: true,
            username: true,
            level: true,
            currentStreak: true,
            intellect: true,
            strength: true,
            discipline: true,
            creativity: true,
            focus: true,
            avatars: {
              where: { equipped: true },
              include: { avatar: true }
            }
          }
        }
      }
    })

    const friends = friendships.map(f => {
      return f.userId === userId ? f.friend : f.user
    })

    return { success: true, pendingRequests, sentRequests, friends }
  } catch (error) {
    console.error("Get party error:", error)
    return { success: false, error: "Failed to get party data" }
  }
}
