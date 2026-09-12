import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getShopItems, getUserInventory } from "@/app/actions/shop"
import { getUserProfile } from "@/app/actions/user"
import OutfitClient from "./OutfitClient"

export default async function OutfitsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const [shopRes, invRes, profile] = await Promise.all([
    getShopItems(),
    getUserInventory(),
    getUserProfile()
  ])

  if (!shopRes.success) {
    return <div className="p-8 text-red-500">Failed to load shop items: {shopRes.error}</div>
  }

  if (!invRes.success) {
    return <div className="p-8 text-red-500">Failed to load inventory: {invRes.error}</div>
  }

  if (!profile) {
    return <div className="p-8 text-red-500">Failed to load profile</div>
  }

  const equippedItems = profile.inventory
    .filter(ui => ui.equipped)
    .map(ui => ({ name: ui.item.name, type: ui.item.type, icon: ui.item.icon, rarity: ui.item.rarity }))

  return (
    <OutfitClient 
      userGold={profile.gold}
      userLevel={profile.level}
      shopItems={shopRes.items || []}
      inventory={invRes.inventory || []}
      initialEquippedItems={equippedItems}
    />
  )
}
