import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getUserProfile } from "@/app/actions/user"
import { calculateLevelProgress } from "@/lib/rpgEngine"
import DashboardClient from "@/components/DashboardClient"
import { getNearbyPlayers } from "@/actions/nearby"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  const profile = await getUserProfile()
  if (!profile) {
    redirect("/login")
  }

  const levelProgress = calculateLevelProgress(profile.xp)
  const activeQuests = profile.quests.filter(q => q.status === "PENDING").slice(0, 5)
  const recentCompleted = profile.quests.filter(q => q.status === "COMPLETED" || q.status === "CLAIMED").slice(0, 3)
  const recentAchievements = profile.achievements
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 3)

  const totalCompletedQuests = profile.quests.filter(q => q.status === "COMPLETED" || q.status === "CLAIMED").length
  const nearbyPlayers = await getNearbyPlayers()

  return (
    <DashboardClient
      username={profile.username}
      level={levelProgress.currentLevel}
      currentLevelXp={levelProgress.currentLevelXp}
      nextLevelXp={levelProgress.nextLevelXp}
      progressPercent={levelProgress.progressPercent}
      totalXp={profile.xp}
      gold={profile.gold}
      currentStreak={profile.currentStreak}
      bestStreak={profile.bestStreak}
      totalCompletedQuests={totalCompletedQuests}
      intellect={profile.intellect}
      strength={profile.strength}
      discipline={profile.discipline}
      creativity={profile.creativity}
      focus={profile.focus}
      activeQuests={activeQuests.map(q => ({
        id: q.id,
        title: q.title,
        category: q.category,
        difficulty: q.difficulty,
        xpReward: q.xpReward,
        goldReward: q.goldReward,
        dueDate: q.dueDate?.toISOString() ?? null,
      }))}
      recentCompleted={recentCompleted.map(q => ({
        id: q.id,
        title: q.title,
        category: q.category,
        xpReward: q.xpReward,
        goldReward: q.goldReward,
        completedAt: q.completedAt?.toISOString() ?? null,
      }))}
      recentAchievements={recentAchievements.map(ua => ({
        name: ua.achievement.name,
        icon: ua.achievement.icon,
        rarity: ua.achievement.rarity,
        unlockedAt: ua.unlockedAt.toISOString(),
      }))}
      locationOptIn={(profile as any).locationOptIn || false}
      nearbyPlayers={nearbyPlayers}
    />
  )
}
