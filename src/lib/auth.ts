import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// CRITICAL FIX: Next.js App Router Server Components lose the Request object.
// If NEXTAUTH_URL is missing or incorrectly set to localhost on Vercel, 
// getServerSession expects a non-secure cookie while the API route sets a secure one.
// This perfectly syncs them by dynamically forcing the correct HTTPS URL.
if (process.env.VERCEL) {
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost") 
    ? process.env.NEXTAUTH_URL 
    : `https://${process.env.VERCEL_URL}`
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "life-rpg-fallback-secret-key-2024",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            username: user.username,
            name: user.username,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).username = token.username as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
}
