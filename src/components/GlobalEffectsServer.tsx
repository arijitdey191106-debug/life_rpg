import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import GlobalEffectsClient from "./GlobalEffectsClient"

export default async function GlobalEffectsServer() {
  const session = await getServerSession(authOptions)
  if (!(session?.user as any)?.username) return null

  const user = await prisma.user.findUnique({
    where: { username: (session?.user as any)?.username },
    include: {
      inventory: {
        where: { equipped: true },
        include: { item: true }
      }
    }
  })

  if (!user) return null

  const equippedBackgrounds = user.inventory
    .filter(i => i.item.type === "BACKGROUND")
    .map(i => i.item.name)

  return <GlobalEffectsClient backgrounds={equippedBackgrounds} />
}
