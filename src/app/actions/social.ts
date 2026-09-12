"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"; // no, next/cache

export async function searchUsers(query: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const userId = (session.user as any).id as string

  if (!query || query.trim().length === 0) {
    return { success: true, users: [] }
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          // ignoreCase: true // Wait, SQLite doesn't support ignoreCase with contains well, it's default case-insensitive for some collations but let's just do contains.
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

  if (senderId === receiverId) {
    return { success: false, error: "Cannot send request to yourself" }
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
      return { success: false, error: "Already friends" }
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId }
        ],
        status: "PENDING"
      }
    })

    if (existingRequest) {
      return { success: false, error: "Friend request already pending" }
    }

    await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: "PENDING"
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Send friend request error:", error)
    return { success: false, error: "Failed to send request" }
  }
}

export async function cancelFriendRequest(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const userId = (session.user as any).id as string

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

  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    })

    if (!request || request.receiverId !== userId || request.status !== "PENDING") {
      return { success: false, error: "Invalid request" }
    }

    // Use transaction to accept request and create friendships
    await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" }
      })

      // Friendship is bidirectional or one direction if queried both ways? 
      // Based on schema, we might need two entries for bidirectional or query with OR.
      // Usually, just one entry where userId < friendId or just query OR.
      // Let's just create one entry.
      await tx.friendship.create({
        data: {
          userId: request.senderId,
          friendId: request.receiverId
        }
      })
    })

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

  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    })

    if (!request || request.receiverId !== userId || request.status !== "PENDING") {
      return { success: false, error: "Invalid request" }
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED" }
    })

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

    // Also delete any existing requests between them to be safe
    await prisma.friendRequest.deleteMany({
       where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId }
        ]
      }
    })

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
