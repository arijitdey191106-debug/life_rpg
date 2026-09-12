import { PrismaClient } from "@prisma/client"
import path from "path"
import fs from "fs"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazy instantiate Prisma to prevent Vercel build-time initialization errors
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      
      let dbUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`

      // Vercel's serverless environment (/var/task) is read-only.
      // Prisma SQLite requires write access to create .journal or .wal files.
      // We must copy the bundled database to the writable /tmp directory.
      if (process.env.VERCEL) {
        const sourcePath = path.join(process.cwd(), "prisma", "dev.db")
        const tmpPath = path.join("/tmp", "dev.db")
        
        try {
          if (!fs.existsSync(tmpPath)) {
            if (fs.existsSync(sourcePath)) {
              fs.copyFileSync(sourcePath, tmpPath)
            } else {
              console.warn("Source dev.db not found at:", sourcePath)
            }
          }
          dbUrl = `file:${tmpPath}`
        } catch (error) {
          console.error("Failed to copy SQLite database to /tmp:", error)
        }
      }

      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        datasources: {
          db: {
            url: dbUrl
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
