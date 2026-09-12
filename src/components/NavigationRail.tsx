"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Swords, User, TrendingUp, Backpack, Trophy, LogOut, Menu, X, Target, Wind, Users, Settings, Globe, Shield, MapPin } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAudio } from "@/components/AudioProvider"

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Quests", href: "/quests", icon: Swords },
  { label: "World", href: "/world", icon: Globe },
  { label: "Nearby", href: "/nearby", icon: MapPin },
  { label: "Character", href: "/character", icon: User },
  { label: "Focus", href: "/focus", icon: Target },
  { label: "Meditate", href: "/meditate", icon: Wind },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Party", href: "/party", icon: Users },
  { label: "Duels", href: "/duels", icon: Shield },
  { label: "Outfits", href: "/outfits", icon: Backpack },
  { label: "Achievements", href: "/achievements", icon: Trophy },
  { label: "Settings", href: "/settings", icon: Settings },
]

export default function NavigationRail() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const audio = useAudio()

  return (
    <>
      {/* Desktop Sidebar */}
      <nav 
        className="w-20 md:w-64 shrink-0 h-full border-r border-white/10 glass-panel rounded-none flex-col justify-between hidden sm:flex"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="p-4">
          <h1 className="text-xl md:text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary glow-text text-center md:text-left mb-8">
            <span className="hidden md:inline">LIFE RPG</span>
            <span className="md:hidden">LR</span>
          </h1>

          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => audio.playClick()}
                    onMouseEnter={() => audio.playHover()}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isActive 
                        ? "bg-primary/20 text-primary border border-primary/30 glow-border" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="w-6 h-6 shrink-0" />
                    <span className="hidden md:inline font-medium tracking-wide text-sm uppercase">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogOut className="w-6 h-6 shrink-0" />
            <span className="hidden md:inline font-medium tracking-wide text-sm uppercase">Log Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#05050A]/95 backdrop-blur-xl">
        <nav role="navigation" aria-label="Mobile navigation" className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => audio.playClick()}
                onMouseEnter={() => audio.playHover()}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[3rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive ? "text-primary" : "text-gray-500"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-wider uppercase">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="More options"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] tracking-wider uppercase">More</span>
          </button>
        </nav>
      </div>

      {/* Mobile More Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sm:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 glass-panel rounded-t-2xl p-6 border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold tracking-widest">MENU</h2>
                <button 
                  onClick={() => setMobileOpen(false)} 
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ul className="space-y-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-xl transition-colors",
                          isActive 
                            ? "bg-primary/20 text-primary" 
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium tracking-wide text-sm uppercase">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full mt-4 flex items-center space-x-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium tracking-wide text-sm uppercase">Log Out</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
