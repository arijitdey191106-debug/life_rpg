"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { purchaseItem, equipItem, unequipItem } from "@/app/actions/shop"
import { Item, UserItem } from "@prisma/client"

type InventoryItem = UserItem & { item: Item }

interface InventoryClientProps {
  userGold: number
  shopItems: Item[]
  inventory: InventoryItem[]
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: "text-gray-400 border-gray-400/30",
  RARE: "text-blue-500 border-blue-500/30",
  EPIC: "text-purple-500 border-purple-500/30",
  LEGENDARY: "text-yellow-500 border-yellow-500/30"
}

const RARITY_GLOWS: Record<string, string> = {
  COMMON: "shadow-gray-400/20",
  RARE: "shadow-blue-500/20",
  EPIC: "shadow-purple-500/20",
  LEGENDARY: "shadow-yellow-500/20"
}

export default function InventoryClient({ userGold, shopItems, inventory }: InventoryClientProps) {
  const [activeTab, setActiveTab] = useState<"SHOP" | "INVENTORY">("SHOP")
  const [filterType, setFilterType] = useState<string>("ALL")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  const ownedItemIds = new Set(inventory.map(inv => inv.itemId))

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
        // Reload page to refresh inventory state from server
        setTimeout(() => window.location.reload(), 500)
      } else {
        showToast(res.error || "Purchase failed", "error")
      }
    } catch (e) {
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
        // Reload page to refresh equipped state from server
        setTimeout(() => window.location.reload(), 500)
      } else {
        showToast(res.error || "Failed to equip", "error")
      }
    } catch (e) {
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
        // Reload page to refresh equipped state from server
        setTimeout(() => window.location.reload(), 500)
      } else {
        showToast(res.error || "Failed to unequip", "error")
      }
    } catch (e) {
      showToast("An error occurred", "error")
    } finally {
      setLoadingAction(null)
    }
  }

  const filteredShop = shopItems.filter(item => filterType === "ALL" || item.type === filterType)
  const filteredInv = inventory.filter(inv => filterType === "ALL" || inv.item.type === filterType)

  const types = ["ALL", ...Array.from(new Set(shopItems.map(i => i.type)))]

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Toast Notification */}
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

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-wider glow-text">VAULT</h1>
          <p className="text-[var(--primary)] font-mono text-sm mt-1">Acquire & Equip Artifacts</p>
        </div>
        <div className="glass-panel px-6 py-4 flex items-center gap-3">
          <span className="text-xl">💰</span>
          <div className="flex flex-col">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Balance</span>
            <span className="text-2xl font-bold text-yellow-400 font-mono">{userGold.toLocaleString()} G</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex gap-2">
          {["SHOP", "INVENTORY"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-t-lg font-mono text-sm tracking-wider transition-all duration-200 border-b-2 ${
                activeTab === tab
                  ? "bg-white/10 text-white border-[var(--primary)] shadow-[0_-5px_15px_-5px_var(--primary)]"
                  : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          <span className="text-xs text-gray-500 font-mono uppercase mr-2">Filter:</span>
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

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "SHOP" ? (
          filteredShop.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 font-mono">
              <span className="text-4xl mb-4">🏪</span>
              <p>No items found in shop.</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredShop.map(item => {
                const isOwned = ownedItemIds.has(item.id)
                const canAfford = userGold >= item.cost
                const rarityColor = RARITY_COLORS[item.rarity] || "text-white"
                const glowClass = RARITY_GLOWS[item.rarity] || ""
                
                return (
                  <motion.div 
                    key={item.id}
                    whileHover={{ y: -5 }}
                    className={`glass-panel p-5 relative overflow-hidden group border ${isOwned ? 'border-white/5 opacity-70' : `border-l-4 ${rarityColor.split(' ')[0]} ${glowClass}`}`}
                  >
                    <div className="absolute -right-10 -top-10 opacity-5 text-9xl pointer-events-none group-hover:scale-110 transition-transform duration-500">
                      {item.icon}
                    </div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-black/40 flex items-center justify-center text-3xl border border-white/10 shadow-inner">
                        {item.icon}
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono px-2 py-1 rounded border uppercase tracking-wider ${rarityColor}`}>
                          {item.rarity}
                        </span>
                        <div className="text-xs text-gray-500 font-mono mt-2 uppercase tracking-wide">
                          {item.type}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-1" title={item.name}>{item.name}</h3>
                    <p className="text-sm text-gray-400 mb-6 h-10 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-yellow-400">💰</span>
                        <span className={`font-bold ${isOwned ? 'text-gray-500' : (canAfford ? 'text-white' : 'text-red-400')}`}>
                          {item.cost.toLocaleString()}
                        </span>
                      </div>
                      
                      {isOwned ? (
                        <span className="px-4 py-2 bg-white/5 rounded text-xs font-mono text-gray-400 uppercase tracking-widest border border-white/10">
                          Owned
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePurchase(item.id)}
                          disabled={!canAfford || loadingAction === `purchase-${item.id}`}
                          className={`px-5 py-2 rounded text-xs font-mono uppercase tracking-widest transition-all duration-300 ${
                            canAfford 
                              ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40 border border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                              : "bg-red-900/20 text-red-500/50 cursor-not-allowed border border-red-900/30"
                          }`}
                        >
                          {loadingAction === `purchase-${item.id}` ? "..." : (canAfford ? "Acquire" : "Poor")}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )
        ) : (
          filteredInv.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 font-mono">
              <span className="text-4xl mb-4">🎒</span>
              <p>Your inventory is empty.</p>
              <button 
                onClick={() => setActiveTab("SHOP")}
                className="mt-4 text-[var(--primary)] hover:underline"
              >
                Go to Shop
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredInv.map(inv => {
                const item = inv.item
                const isEquipped = inv.equipped
                const rarityColor = RARITY_COLORS[item.rarity] || "text-white"
                const glowClass = isEquipped ? `shadow-[0_0_20px_var(--primary)] border-[var(--primary)]` : 'border-white/10'
                
                return (
                  <motion.div 
                    key={inv.id}
                    whileHover={{ y: -5 }}
                    className={`glass-panel p-5 relative overflow-hidden group transition-all duration-300 border ${glowClass}`}
                  >
                    {isEquipped && (
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent pointer-events-none" />
                    )}
                    
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
                          <span className="text-[10px] font-mono px-2 py-1 bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/50 rounded uppercase tracking-wider animate-pulse">
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
                    <p className="text-sm text-gray-400 mb-6 h-10 line-clamp-2">{item.description}</p>
                    
                    <div className="mt-auto">
                      {isEquipped ? (
                        <button
                          onClick={() => handleUnequip(inv.id)}
                          disabled={loadingAction === `unequip-${inv.id}`}
                          className="w-full py-2 rounded text-xs font-mono uppercase tracking-widest bg-black/40 hover:bg-black/60 text-gray-300 border border-white/10 transition-colors"
                        >
                          {loadingAction === `unequip-${inv.id}` ? "..." : "Unequip"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquip(inv.id)}
                          disabled={loadingAction === `equip-${inv.id}`}
                          className="w-full py-2 rounded text-xs font-mono uppercase tracking-widest bg-white/5 hover:bg-[var(--primary)]/20 text-white hover:text-[var(--primary)] border border-white/10 hover:border-[var(--primary)]/50 transition-all"
                        >
                          {loadingAction === `equip-${inv.id}` ? "..." : "Equip"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )
        )}
      </div>
    </div>
  )
}
