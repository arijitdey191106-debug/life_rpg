"use client"

import { useEffect, useState } from "react"
import { motion, useSpring, useMotionValue } from "framer-motion"
import { usePathname } from "next/navigation"

export default function CursorGlow() {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  
  const springConfig = { damping: 30, stiffness: 300, mass: 0.2 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  const pathname = usePathname()

  useEffect(() => {
    // Only show on desktop
    if (window.matchMedia("(max-width: 768px)").matches) return
    setIsVisible(true)

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }

    const checkHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if it's an interactive element
      const isInteractive = !!target.closest('button, a, input, select, [role="button"], [role="link"], .cursor-pointer')
      setIsHovering(isInteractive)
    }

    window.addEventListener("mousemove", moveCursor)
    window.addEventListener("mousemove", checkHover)

    return () => {
      window.removeEventListener("mousemove", moveCursor)
      window.removeEventListener("mousemove", checkHover)
    }
  }, [cursorX, cursorY, pathname])

  if (!isVisible) return null

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full mix-blend-screen"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
        translateX: "-50%",
        translateY: "-50%",
      }}
      initial={{ width: 12, height: 12, backgroundColor: "rgba(255, 215, 0, 0.4)", boxShadow: "0 0 10px 1px rgba(255, 215, 0, 0.3)" }}
      animate={{
        width: isHovering ? 40 : 12,
        height: isHovering ? 40 : 12,
        backgroundColor: isHovering ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 215, 0, 0.4)",
        boxShadow: isHovering ? "0 0 30px 4px rgba(255, 215, 0, 0.4)" : "0 0 10px 1px rgba(255, 215, 0, 0.3)",
        border: isHovering ? "1px solid rgba(255,215,0,0.5)" : "none"
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    />
  )
}
