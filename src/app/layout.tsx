import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"
import NavigationShell from "@/components/NavigationShell"
import CursorGlow from "@/components/CursorGlow"
import GlobalEffectsServer from "@/components/GlobalEffectsServer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "LIFE RPG",
  description: "Level up your real life. Transform daily tasks into epic quests.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased h-screen overflow-hidden flex bg-[#05050A] text-[#e2e8f0]">
        <Providers>
          <GlobalEffectsServer />
          <CursorGlow />
          <NavigationShell>
            {children}
          </NavigationShell>
        </Providers>
      </body>
    </html>
  )
}
