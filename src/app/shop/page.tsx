import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import OutfitShopClient from "./OutfitShopClient"

export default async function ShopPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { gold: true, level: true }
  })

  if (!user) redirect("/login")

  const inventory = await prisma.userItem.findMany({
    where: { userId: session.user.id },
    include: { item: true }
  })

  const shopItems = await prisma.item.findMany({
    where: {
      type: { in: ['TOP', 'BOTTOM', 'SHOES', 'HAT', 'HAIR', 'ACCESSORY', 'BADGE', 'AURA', 'FRAME'] }
    },
    orderBy: [
      { type: 'asc' },
      { cost: 'asc' }
    ]
  })

  const equippedItems = inventory
    .filter(i => i.equipped)
    .map(i => ({ name: i.item.name, type: i.item.type, icon: i.item.icon, rarity: i.item.rarity }))

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <OutfitShopClient
        userGold={user.gold}
        userLevel={user.level}
        shopItems={shopItems}
        inventory={inventory}
        equippedItems={equippedItems}
      />
    </div>
  )
}
