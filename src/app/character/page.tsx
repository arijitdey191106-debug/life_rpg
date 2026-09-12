import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUserProfile } from "@/app/actions/user"
import { calculateLevelProgress } from "@/lib/rpgEngine"
import CharacterClient from "./CharacterClient"
import { seedAndGetAvatars, getSkillNodes } from "@/actions/character"

export default async function CharacterPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const profile = await getUserProfile()
  if (!profile) redirect("/login")

  const avatars = await seedAndGetAvatars()
  const skillNodes = await getSkillNodes()

  const levelProgress = calculateLevelProgress(profile.xp)
  const totalCompleted = profile.quests.filter(q => q.status === "COMPLETED").length

  // Category breakdown for quests completed
  const categoryBreakdown = {
    INTELLECT: profile.quests.filter(q => q.status === "COMPLETED" && q.category === "INTELLECT").length,
    STRENGTH: profile.quests.filter(q => q.status === "COMPLETED" && q.category === "STRENGTH").length,
    DISCIPLINE: profile.quests.filter(q => q.status === "COMPLETED" && q.category === "DISCIPLINE").length,
    CREATIVITY: profile.quests.filter(q => q.status === "COMPLETED" && q.category === "CREATIVITY").length,
    FOCUS: profile.quests.filter(q => q.status === "COMPLETED" && q.category === "FOCUS").length,
  }

  // Equipped items
  const equippedItems = profile.inventory
    .filter(ui => ui.equipped)
    .map(ui => ({ name: ui.item.name, type: ui.item.type, icon: ui.item.icon, rarity: ui.item.rarity }))

  const userAvatars = profile.avatars.map(ua => ua.avatarId)
  const equippedAvatarObj = profile.avatars.find(ua => ua.equipped)?.avatar
  const currentAvatar = equippedAvatarObj ? equippedAvatarObj.imageUrl : "👤"

  // User unlocked skills
  const unlockedSkills = profile.skills.map(s => s.skillNodeId)

  return (
    <CharacterClient
      username={profile.username}
      level={levelProgress.currentLevel}
      currentLevelXp={levelProgress.currentLevelXp}
      nextLevelXp={levelProgress.nextLevelXp}
      progressPercent={levelProgress.progressPercent}
      totalXp={profile.xp}
      gold={profile.gold}
      goldSpent={profile.goldSpent}
      currentStreak={profile.currentStreak}
      bestStreak={profile.bestStreak}
      totalCompleted={totalCompleted}
      intellect={profile.intellect}
      strength={profile.strength}
      discipline={profile.discipline}
      creativity={profile.creativity}
      focus={profile.focus}
      categoryBreakdown={categoryBreakdown}
      equippedItems={equippedItems}
      achievementCount={profile.achievements.length}
      daysSinceJoined={Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)))}
      
      // New props
      avatars={avatars}
      currentAvatar={currentAvatar}
      userAvatars={userAvatars}
      skillNodes={skillNodes}
      unlockedSkills={unlockedSkills}
    />
  )
}
