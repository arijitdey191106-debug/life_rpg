import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import GlobalEffectsClient from "./GlobalEffectsClient"

export default async function GlobalEffectsServer() {
  const session = await getServerSession(authOptions)
  if (!(session?.user as any)?.username) return null

  let user = await prisma.user.findUnique({
    where: { username: (session?.user as any)?.username },
    include: {
      inventory: {
        where: { equipped: true },
        include: { item: true }
      }
    }
  })

  // Vercel Ephemeral SQLite Fix
  if (!user && (session?.user as any)?.username) {
    try {
      await prisma.user.create({
        data: {
          id: (session!.user as any).id,
          username: (session!.user as any).username,
          email: `${(session!.user as any).username}@placeholder.com`,
          passwordHash: "ephemeral-recreation"
        }
      })
      user = await prisma.user.findUnique({
        where: { username: (session?.user as any)?.username },
        include: {
          inventory: {
            where: { equipped: true },
            include: { item: true }
          }
        }
      })
    } catch (e) {
      console.error("Failed to dynamically recreate user on Vercel", e)
    }
  }

  if (!user) return null

  const equippedBackgrounds = user.inventory
    .filter(i => i.item.type === "BACKGROUND")
    .map(i => i.item.name)

  return <GlobalEffectsClient backgrounds={equippedBackgrounds} />
}
