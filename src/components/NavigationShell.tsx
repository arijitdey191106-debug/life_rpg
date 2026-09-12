"use client"

import { usePathname } from "next/navigation"
import NavigationRail from "./NavigationRail"
import { useSession } from "next-auth/react"

export default function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAuthPage = pathname === "/login" || pathname === "/register"

  if (isAuthPage || !session) {
    return (
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    )
  }

  return (
    <>
      <NavigationRail />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </>
  )
}
