import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getShopItems, getUserInventory } from "@/app/actions/shop"
import InventoryClient from "./InventoryClient"

export const metadata = {
  title: "Inventory | Life RPG",
  description: "Your inventory and shop",
}

export default async function InventoryPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [user, shopRes, inventoryRes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gold: true }
    }),
    getShopItems(),
    getUserInventory()
  ])

  const userGold = user?.gold || 0
  const shopItems = shopRes.success ? (shopRes.items || []) : []
  const inventory = inventoryRes.success ? (inventoryRes.inventory || []) : []

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <InventoryClient 
        userGold={userGold} 
        shopItems={shopItems} 
        inventory={inventory} 
      />
    </div>
  )
}
