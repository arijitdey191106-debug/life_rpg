"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export async function register(prevState: any, formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username || !password || username.length < 3 || password.length < 6) {
    return { error: "Invalid username or password" }
  }

  const existingUser = await prisma.user.findUnique({
    where: { username }
  })

  if (existingUser) {
    return { error: "Username already taken" }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      username,
      email: `${username}@placeholder.com`,
      passwordHash,
    }
  })

  redirect("/login")
}
