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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight glow-text mb-2">QUEST BOARD</h1>
        <p className="text-gray-400">Manage your active missions and track your victories.</p>
      </header>

      <QuestBoardClient 
        initialQuests={quests} 
        initialChallenges={userChallenges} 
        initialAttribute={initialAttribute}
      />
    </div>
  )
}
