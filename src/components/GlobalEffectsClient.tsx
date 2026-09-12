"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function GlobalEffectsClient({ backgrounds }: { backgrounds: string[] }) {
  if (backgrounds.length === 0) return null

  const bg = backgrounds[0]

  if (bg === "STARFIELD") {
    return (
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-40" style={{
        backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0))',
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px'
      }} />
    )
  }

  if (bg === "NEBULA CLOUD") {
    return (
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-30" style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(138,43,226,0.3) 0%, rgba(0,0,0,0) 70%)',
        backgroundSize: '100% 100%'
      }} />
    )
  }

  if (bg === "DIGITAL RAIN") {
    return (
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-20 overflow-hidden text-green-500 font-mono text-xs flex justify-around">
        {/* Simple CSS animation for digital rain columns */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -1000 }}
            animate={{ y: 1000 }}
            transition={{ duration: 10 + Math.random() * 5, repeat: Infinity, ease: "linear" }}
          >
            10101010<br/>01010101<br/>11001100<br/>00110011
          </motion.div>
        ))}
      </div>
    )
  }

  return null
}
