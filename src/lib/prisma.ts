import { PrismaClient } from "@prisma/client"
import path from "path"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazy instantiate Prisma to prevent Vercel build-time initialization errors
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        datasources: {
          db: {
            url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`
          }
        }
      })
    }
    return (globalForPrisma.prisma as any)[prop]
  }
})

if (process.env.NODE_ENV !== "production") {
  // We don't set it immediately, it will be set on first access
}
