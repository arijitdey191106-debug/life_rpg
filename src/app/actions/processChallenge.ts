"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { verifyChallenge, claimChallengeReward, reportChallengeObjectiveMet, startChallenge } from "./challenges"

export async function processSystemChallenge(userChallengeId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Unauthorized" }

  const uc = await prisma.userChallenge.findUnique({ where: { id: userChallengeId } })
  if (!uc) return { error: "Not found" }

  // Step 1: Start if available
  if (uc.status === "AVAILABLE") {
    await startChallenge(userChallengeId)
  }

  // Step 2: Report objective met
  const ucAfterStart = await prisma.userChallenge.findUnique({ where: { id: userChallengeId } })
  if (ucAfterStart?.status === "IN_PROGRESS") {
    await reportChallengeObjectiveMet(userChallengeId)
  }

  // Step 3: Verify
  const ucAfterReport = await prisma.userChallenge.findUnique({ where: { id: userChallengeId } })
  if (ucAfterReport?.status === "OBJECTIVE_MET") {
    const verifyResult = await verifyChallenge(userChallengeId)
    if (verifyResult.error) {
      if (verifyResult.error === "OBJECTIVE_NOT_MET") {
        return { error: verifyResult.error, details: verifyResult.details }
      }
      return { error: verifyResult.error }
    }
  }

  // Step 4: Claim
  const ucAfterVerify = await prisma.userChallenge.findUnique({ where: { id: userChallengeId } })
  if (ucAfterVerify?.status === "VERIFIED") {
    return await claimChallengeReward(userChallengeId)
  }

  return { error: "Failed to process challenge. Make sure you meet the requirements!" }
}
