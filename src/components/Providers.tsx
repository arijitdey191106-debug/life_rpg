"use client"

import { SessionProvider } from "next-auth/react"
import { AudioProvider } from "./AudioProvider"
import { RewardProvider } from "./RewardProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AudioProvider>
        <RewardProvider>
          {children}
        </RewardProvider>
      </AudioProvider>
    </SessionProvider>
  )
}
