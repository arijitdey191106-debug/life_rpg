import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { NextResponse } from "next/server"

bcrypt.setRandomFallback((len) => Array.from(crypto.randomBytes(len)))

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password || username.length < 3 || password.length < 6) {
      return NextResponse.json(
        { error: "Username must be 3+ chars, password must be 6+ chars" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Callsign already taken" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        username,
        email: `${username.toLowerCase()}@life-rpg.local`,
        passwordHash,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Registration failed. Try again." },
      { status: 500 }
    )
  }
}
