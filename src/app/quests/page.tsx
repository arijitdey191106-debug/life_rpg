import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import QuestBoardClient from "./QuestBoardClient"
import { getUserChallenges } from "@/app/actions/challenges"

export default async function QuestsPage(props: {
  searchParams?: Promise<{ attribute?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const quests = await prisma.quest.findMany({
    where: { 
      OR: [
        { userId: session.user.id },
        { type: 'SYSTEM' }
      ]
    },
    orderBy: { createdAt: "desc" }
  })

  const { userChallenges = [] } = await getUserChallenges() || {};
  const initialAttribute = searchParams?.attribute || "ALL";

  // Serialize all Date fields to strings so they can safely cross the
  // Server → Client component boundary without React error #441.
  // We use JSON.parse(JSON.stringify()) to completely strip any Prisma internal properties
  // or symbols that might cause Vercel's strict React Server Component compiler to throw.
  const serializedQuests = JSON.parse(JSON.stringify(quests.map(q => ({
    ...q,
    dueDate: q.dueDate?.toISOString() ?? null,
    completedAt: q.completedAt?.toISOString() ?? null,
    createdAt: q.createdAt.toISOString(),
  }))))

  const serializedChallenges = JSON.parse(JSON.stringify(userChallenges.map((uc: any) => ({
    ...uc,
    completedAt: uc.completedAt?.toISOString() ?? null,
    createdAt: uc.createdAt?.toISOString() ?? null,
    challenge: uc.challenge ? {
      ...uc.challenge,
    } : undefined,
  }))))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight glow-text mb-2">QUEST BOARD</h1>
        <p className="text-gray-400">Manage your active missions and track your victories.</p>
      </header>

      <QuestBoardClient 
        initialQuests={serializedQuests} 
        initialChallenges={serializedChallenges} 
        initialAttribute={initialAttribute}
      />
    </div>
  )
}
