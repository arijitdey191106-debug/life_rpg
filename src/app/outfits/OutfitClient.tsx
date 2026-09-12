"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { purchaseItem, equipItem, unequipItem } from "@/app/actions/shop"
import { Item, UserItem } from "@prisma/client"
import AvatarSprite from "@/components/AvatarSprite"
import { ShoppingBag, ArrowLeft, Shirt } from "lucide-react"
import Link from "next/link"

type InventoryItem = UserItem & { item: Item }

interface OutfitClientProps {
  userGold: number
  userLevel: number
  shopItems: Item[]
  inventory: InventoryItem[]
  initialEquippedItems: { name: string; type: string; icon: string; rarity: string }[]
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: "text-gray-400 border-gray-400/30",
  RARE: "text-blue-500 border-blue-500/30",
  EPIC: "text-purple-500 border-purple-500/30",
  LEGENDARY: "text-yellow-500 border-yellow-500/30",
  MYTHIC: "text-pink-500 border-pink-500/30"
}

export default function OutfitClient({ userGold, userLevel, shopItems, inventory, initialEquippedItems }: OutfitClientProps) {
  const [filterType, setFilterType] = useState<string>("ALL")
  const [filterOwnership, setFilterOwnership] = useState<"ALL" | "OWNED" | "UNOWNED">("ALL")
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [previewItem, setPreviewItem] = useState<Item | null>(null)

  const ownedItemsMap = useMemo(() => {
    const map = new Map<string, InventoryItem>()
    inventory.forEach(inv => map.set(inv.itemId, inv))
    return map
  }, [inventory])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage({ message, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handlePurchase = async (itemId: string) => {
    setLoadingAction(`purchase-${itemId}`)
    try {
      const res = await purchaseItem(itemId)
      if (res.success) {
        showToast(res.message || "Purchase successful", "success")
        setTimeout(() => window.location.reload(), 500)
      } else {
        showToast(res.error || "Purchase failed", "error")
      }
    } catch {
      showToast("An error occurred", "error")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleEquip = async (userItemId: string) => {
    setLoadingAction(`equip-${userItemId}`)
    try {
      const res = await equipItem(userItemId)
      if (res.success) {
        showToast("Item equipped", "success")
        setTimeout(() => window.location.reload(), 500)
      } else {
        showToast(res.error || "Failed to equip", "error")
      }
    } catch {
      showToast("An error occurred", "error")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleUnequip = async (userItemId: string) => {
    setLoadingAction(`unequip-${userItemId}`)
    try {
      const res = await unequipItem(userItemId)
      if (res.success) {
        showToast("Item unequipped", "success")
        setTimeout(() => window.location.reload(), 500)
      } else {
        showToast(res.error || "Failed to unequip", "error")
      }
    } catch {
      showToast("An error occurred", "error")
    } finally {
      setLoadingAction(null)
    }
  }

  const types = ["ALL", ...Array.from(new Set(shopItems.map(i => i.type)))]
  
  const filteredItems = shopItems.filter(item => {
    if (filterType !== "ALL" && item.type !== filterType) return false
    const isOwned = ownedItemsMap.has(item.id)
    if (filterOwnership === "OWNED" && !isOwned) return false
    if (filterOwnership === "UNOWNED" && isOwned) return false
    return true
  })

  // Calculate live preview items
  const currentPreviewItems = [...initialEquippedItems]
  if (previewItem) {
    const existingIndex = currentPreviewItems.findIndex(i => i.type === previewItem.type)
    if (existingIndex > -1) {
      currentPreviewItems.splice(existingIndex, 1)
    }
    
    // Only add it if we are not "unequipping" it (toggle preview behavior)
    const owned = ownedItemsMap.get(previewItem.id)
    if (!owned || !owned.equipped || previewItem.id !== previewItem?.id /* Just to force it in preview */) {
      currentPreviewItems.push({
        name: previewItem.name,
        type: previewItem.type,
        icon: previewItem.icon,
        rarity: previewItem.rarity
      })
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-md shadow-lg font-mono text-sm uppercase ${
              toastMessage.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}
          >
            {toastMessage.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-wider glow-text flex items-center gap-3">
            <Shirt className="w-8 h-8 text-[var(--primary)]" /> OUTFITS
          </h1>
          <p className="text-[var(--primary)] font-mono text-sm mt-1">Upgrade your style. Look good, play good.</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel px-6 py-4 flex items-center gap-3">
            <span className="text-xl">⭐</span>
            <div className="flex flex-col">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Level</span>
              <span className="text-2xl font-bold text-white font-mono">{userLevel}</span>
            </div>
          </div>
          <div className="glass-panel px-6 py-4 flex items-center gap-3">
            <span className="text-xl">💰</span>
            <div className="flex flex-col">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Balance</span>
              <span className="text-2xl font-bold text-yellow-400 font-mono">{userGold.toLocaleString()} G</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Live Preview Panel */}
        <div className="lg:col-span-4 h-fit sticky top-24">
          <div className="glass-panel p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[420px]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.15)_0%,transparent_70%)]" aria-hidden="true" />
            <h3 className="absolute top-4 left-4 text-xs font-bold tracking-widest text-white/50 uppercase">Live Preview</h3>
            
            <div className="relative mb-6">
              <AvatarSprite equippedItems={currentPreviewItems} size={250} className="z-10 drop-shadow-[0_0_15px_rgba(0,255,255,0.2)]" />
            </div>
            
            {previewItem ? (
              <div className="text-center font-mono animate-pulse">
                <span className="text-xs text-gray-400 uppercase">Previewing:</span>
                <div className={`font-bold mt-1 ${RARITY_COLORS[previewItem.rarity] || "text-white"}`}>
                  {previewItem.name}
                </div>
                <button onClick={() => setPreviewItem(null)} className="mt-2 text-[10px] text-gray-500 hover:text-white underline uppercase">Clear Preview</button>
              </div>
            ) : (
              <div className="text-center font-mono text-xs text-gray-500 uppercase mt-4">
                Select an item to preview
              </div>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex gap-2">
              {["ALL", "OWNED", "UNOWNED"].map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterOwnership(mode as any)}
                  className={`px-4 py-2 rounded text-xs font-mono transition-colors border ${
                    filterOwnership === mode
                      ? "bg-white/10 text-white border-white/30"
                      : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto hide-scrollbar">
              <span className="text-xs text-gray-500 font-mono uppercase mr-2 shrink-0">Type:</span>
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap border border-white/10 ${
                    filterType === t 
                      ? "bg-[var(--primary)]/20 text-[var(--primary)] border-[var(--primary)]/50" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 font-mono glass-panel rounded-xl">
              <span className="text-4xl mb-4">🏪</span>
              <p>No items found.</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {filteredItems.map(item => {
                const inventoryEntry = ownedItemsMap.get(item.id)
                const isOwned = !!inventoryEntry
                const isEquipped = inventoryEntry?.equipped || false
                const canAfford = userGold >= item.cost
                const rarityColor = RARITY_COLORS[item.rarity] || "text-white"
                
                let requiredLevel = 1
                const levelMatch = item.description.match(/\[UNLOCK_LEVEL:(\d+)\]/i)
                if (levelMatch) {
                  requiredLevel = parseInt(levelMatch[1], 10)
                }
                const levelMet = userLevel >= requiredLevel
                const displayDesc = item.description.replace(/\[UNLOCK_LEVEL:\d+\]/i, '').trim()

                const isPreviewing = previewItem?.id === item.id

                return (
                  <motion.div 
                    key={item.id}
                    onClick={() => setPreviewItem(item)}
                    className={`glass-panel p-5 relative overflow-hidden group cursor-pointer transition-all duration-300 border ${
                      isEquipped 
                        ? 'border-[var(--primary)] shadow-[0_0_15px_rgba(138,43,226,0.3)]' 
                        : isPreviewing
                          ? 'border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                          : `border-white/5 hover:border-white/20`
                    }`}
                  >
                    <div className="absolute -right-10 -top-10 opacity-5 text-9xl pointer-events-none group-hover:scale-110 transition-transform duration-500">
                      {item.icon}
                    </div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-inner border ${
                        isEquipped ? 'bg-[var(--primary)]/20 border-[var(--primary)]/50' : 'bg-black/40 border-white/10'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        {isEquipped && (
                          <span className="text-[10px] font-mono px-2 py-1 bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/50 rounded uppercase tracking-wider">
                            EQUIPPED
                          </span>
                        )}
                        <span className={`text-[10px] font-mono px-2 py-1 rounded border uppercase tracking-wider ${rarityColor}`}>
                          {item.rarity}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold line-clamp-1" title={item.name}>{item.name}</h3>
                    </div>
                    <div className="text-xs text-gray-500 font-mono mb-2 uppercase tracking-wide">
                      {item.type}
                    </div>
                    <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2">{displayDesc}</p>
                    
                    {!levelMet && !isOwned && (
                      <div className="text-xs font-mono text-red-400 mb-4 bg-red-900/20 px-2 py-1 rounded border border-red-900/30 inline-block">
                        Requires Level {requiredLevel}
                      </div>
                    )}
                    {(levelMet || isOwned) && <div className="h-4 mb-4"></div>}
                    
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-yellow-400">💰</span>
                        <span className={`font-bold ${isOwned ? 'text-gray-500' : (canAfford ? 'text-white' : 'text-red-400')}`}>
                          {item.cost.toLocaleString()}
                        </span>
                      </div>
                      
                      {isOwned ? (
                        isEquipped ? (
                          <button
                            onClick={() => handleUnequip(inventoryEntry.id)}
                            disabled={loadingAction === `unequip-${inventoryEntry.id}`}
                            className="px-4 py-2 rounded text-xs font-mono uppercase tracking-widest bg-black/40 hover:bg-black/60 text-gray-300 border border-white/10 transition-colors"
                          >
                            {loadingAction === `unequip-${inventoryEntry.id}` ? "..." : "Unequip"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEquip(inventoryEntry.id)}
                            disabled={loadingAction === `equip-${inventoryEntry.id}`}
                            className="px-4 py-2 rounded text-xs font-mono uppercase tracking-widest bg-white/5 hover:bg-[var(--primary)]/20 text-white hover:text-[var(--primary)] border border-white/10 hover:border-[var(--primary)]/50 transition-all"
                          >
                            {loadingAction === `equip-${inventoryEntry.id}` ? "..." : "Equip"}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handlePurchase(item.id)}
                          disabled={!canAfford || !levelMet || loadingAction === `purchase-${item.id}`}
                          className={`px-5 py-2 rounded text-xs font-mono uppercase tracking-widest transition-all duration-300 ${
                            canAfford && levelMet
                              ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40 border border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                              : "bg-red-900/20 text-red-500/50 cursor-not-allowed border border-red-900/30"
                          }`}
                        >
                          {loadingAction === `purchase-${item.id}` ? "..." : (!levelMet ? "Locked" : (canAfford ? "Buy" : "Poor"))}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
