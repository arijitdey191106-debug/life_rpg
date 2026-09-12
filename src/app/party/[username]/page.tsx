import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import RemoveFriendButton from "./RemoveFriendButton"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import { calculateLevelProgress } from "@/lib/rpgEngine"

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return {
    title: `${params.username}'s Profile - Life RPG`,
    description: `View ${params.username}'s RPG stats and achievements.`,
  }
}

export default async function FriendProfilePage({ params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user ? (session.user as any).id : null

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      username: true,
      level: true,
      xp: true,
      currentStreak: true,
      bestStreak: true,
      intellect: true,
      strength: true,
      discipline: true,
      creativity: true,
      focus: true,
      avatars: {
        where: { equipped: true },
        include: { avatar: true }
      },
      inventory: {
        where: { equipped: true },
        include: { item: true }
      },
      achievements: {
        orderBy: { unlockedAt: 'desc' },
        take: 5,
        include: { achievement: true }
      }
    }
  })

  if (!user) {
    notFound()
  }

  // Calculate XP progress using the official RPG Engine
  const { currentLevelXp, nextLevelXp, progressPercent } = calculateLevelProgress(user.xp)

  // Determine cosmetics
  const backgroundItem = user.inventory.find(i => i.item.type === 'BACKGROUND')?.item
  const effectItem = user.inventory.find(i => i.item.type === 'EFFECT')?.item
  const frameItem = user.inventory.find(i => i.item.type === 'FRAME')?.item

  // Base background class
  let bgClass = "min-h-screen bg-[var(--background)] p-4 md:p-8 relative overflow-hidden"
  
  // Custom background logic
  if (backgroundItem?.name === 'STARFIELD') {
    bgClass += " bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"
  }

  // Avatar effect logic
  let avatarEffectClass = ""
  if (effectItem?.name === 'NEON AURA') {
    avatarEffectClass = "shadow-[0_0_30px_rgba(138,43,226,0.8)]"
  } else if (effectItem?.name === 'FIRE AURA') {
    avatarEffectClass = "shadow-[0_0_30px_rgba(255,100,0,0.8)]"
  }

  // Check if they are friends
  let isFriend = false
  if (currentUserId && currentUserId !== user.id) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: currentUserId, friendId: user.id },
          { userId: user.id, friendId: currentUserId }
        ]
      }
    })
    isFriend = !!friendship
  }

  return (
    <div className={bgClass}>
      <Link href="/party" className="inline-block mb-8 text-white/50 hover:text-white transition-colors">
        ← Back to Party
      </Link>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Profile Header */}
        <div className="glass-panel p-8 flex flex-col md:flex-row items-center gap-8 relative">
          
          <div className="relative">
            <div className={`w-32 h-32 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border-4 border-black/50 ${avatarEffectClass} ${frameItem ? 'ring-4 ring-[var(--primary)] ring-offset-4 ring-offset-black' : ''}`}>
              {user.avatars?.[0]?.avatar?.imageUrl ? (
                <img src={user.avatars[0].avatar.imageUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">👤</span>
              )}
            </div>
            {/* Show badge if they have one */}
            {user.inventory.find(i => i.item.type === 'BADGE') && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[var(--secondary)] rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-black" title={user.inventory.find(i => i.item.type === 'BADGE')?.item.name}>
                {user.inventory.find(i => i.item.type === 'BADGE')?.item.icon}
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black glow-text mb-2">{user.username}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
              <span className="bg-[var(--primary)]/20 text-[var(--primary)] px-3 py-1 rounded-full border border-[var(--primary)]/30">
                Level {user.level}
              </span>
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30 flex items-center gap-1">
                🔥 {user.currentStreak} Day Streak
              </span>
            </div>

            <div className="mt-6 w-full max-w-md bg-black/50 rounded-full h-4 overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-white/50 mt-2">{user.xp} / {nextLevelXp} XP</p>
          </div>

          {isFriend && (
            <div className="absolute top-4 right-4">
              <RemoveFriendButton friendId={user.id} username={user.username} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Attributes */}
          <div className="glass-panel p-6 md:col-span-1 h-fit">
            <h2 className="text-xl font-bold mb-6 text-[var(--primary)] border-b border-white/10 pb-2">Attributes</h2>
            <div className="space-y-4">
              <AttributeRow name="Intellect" value={user.intellect} color="text-blue-400" />
              <AttributeRow name="Strength" value={user.strength} color="text-red-400" />
              <AttributeRow name="Discipline" value={user.discipline} color="text-green-400" />
              <AttributeRow name="Creativity" value={user.creativity} color="text-yellow-400" />
              <AttributeRow name="Focus" value={user.focus} color="text-purple-400" />
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="glass-panel p-6 md:col-span-2">
            <h2 className="text-xl font-bold mb-6 text-[var(--secondary)] border-b border-white/10 pb-2">Recent Achievements</h2>
            
            {user.achievements.length === 0 ? (
              <p className="text-white/50 italic text-center py-8">No achievements unlocked yet.</p>
            ) : (
              <div className="space-y-4">
                {user.achievements.map(({ achievement, unlockedAt }) => (
                  <div key={achievement.id} className="bg-black/30 p-4 rounded-lg flex items-start gap-4 border border-white/5 hover:border-[var(--primary)]/30 transition-colors">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-2xl shrink-0">
                      {achievement.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white/90">{achievement.name}</h3>
                      <p className="text-sm text-white/60 mt-1">{achievement.description}</p>
                      <p className="text-xs text-[var(--primary)]/70 mt-2">
                        Unlocked on {new Date(unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

      </div>
    </div>
  )
}

function AttributeRow({ name, value, color }: { name: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/70 font-medium">{name}</span>
      <span className={`font-black text-lg ${color}`}>{value}</span>
    </div>
  )
}
