"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // metres
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // in metres
}

export async function updateLocation(lat: number, lng: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const userId = (session.user as any).id as string
  if (!userId) return { success: false, error: "Session error. Please log in again." }

  try {
    // Fix: Do NOT check locationOptIn here. The client has already called updateUserSettings
    // to set locationOptIn=true, but that DB write may still be in-flight (race condition).
    // Visibility is enforced at query time in getNearbyPlayers.
    // Truncate to 3 decimal places for privacy (~110 m precision — prevents exact pinpointing).
    const approxLat = Math.round(lat * 1000) / 1000
    const approxLng = Math.round(lng * 1000) / 1000

    await prisma.user.update({
      where: { id: userId },
      data: {
        approxLat,
        approxLng,
        locationUpdatedAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Update location error:", error)
    return { success: false, error: "Failed to update location" }
  }
}

export async function getNearbyPlayers() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const userId = (session.user as any).id as string
  if (!userId) return { success: false, error: "Session error. Please log in again." }

  try {
    const currentUser = await prisma.user.findUnique({ where: { id: userId } })

    if (!currentUser) {
      return { success: false, error: "User not found." }
    }

    if (!currentUser.locationOptIn) {
      return { success: true, nearby: [] }
    }

    if (!currentUser.approxLat || !currentUser.approxLng) {
      // User has opted in but location hasn't been saved yet
      return {
        success: true,
        nearby: [],
        noLocationYet: true
      }
    }

    // Only query users updated within the last 2 hours (stale location guard)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

    const candidates = await prisma.user.findMany({
      where: {
        id: { not: userId },
        locationOptIn: true, // Only users who opted in are visible
        locationUpdatedAt: { gte: twoHoursAgo },
        approxLat: { not: null },
        approxLng: { not: null }
      },
      select: {
        id: true,
        username: true,
        level: true,
        approxLat: true,
        approxLng: true,
        avatars: {
          where: { equipped: true },
          include: { avatar: true }
        }
      }
    })

    const nearby = candidates
      .map(c => {
        const dist = calculateDistance(
          currentUser.approxLat!,
          currentUser.approxLng!,
          c.approxLat!,
          c.approxLng!
        )
        return {
          id: c.id,
          username: c.username,
          level: c.level,
          avatars: c.avatars,
          distance: Math.round(dist) // in metres — never expose raw coordinates
        }
      })
      .filter(c => c.distance <= 1000) // 1 KM radius
      .sort((a, b) => a.distance - b.distance)

    return { success: true, nearby }
  } catch (error) {
    console.error("Get nearby error:", error)
    return { success: false, error: "Failed to fetch nearby players" }
  }
}
