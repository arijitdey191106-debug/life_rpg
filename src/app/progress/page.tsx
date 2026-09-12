import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { calculateLevelProgress } from "@/lib/rpgEngine"

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      quests: {
        orderBy: {
          completedAt: 'desc'
        }
      },
      achievements: true
    }
  })

  if (!user) {
    redirect("/login")
  }

  const completedQuests = user.quests.filter(q => q.status === "COMPLETED")
  
  // Weekly Activity
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeklyData = weekDays.map((day, i) => {
    const dayStart = new Date(startOfWeek)
    dayStart.setDate(startOfWeek.getDate() + i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayStart.getDate() + 1)
    const count = completedQuests.filter(q => {
      if (!q.completedAt) return false;
      const d = new Date(q.completedAt)
      return d >= dayStart && d < dayEnd
    }).length
    return { day, count, isToday: i === dayOfWeek }
  })
  const maxWeeklyCount = Math.max(1, ...weeklyData.map(d => d.count))

  // Difficulty Breakdown
  const diffs = ['EASY', 'MEDIUM', 'HARD', 'EPIC']
  const difficultyData = diffs.map(d => ({
    name: d,
    count: completedQuests.filter(q => q.difficulty === d).length
  }))
  const maxDiffCount = Math.max(1, ...difficultyData.map(d => d.count))

  // Categories Breakdown
  const categories = ['INTELLECT', 'STRENGTH', 'DISCIPLINE', 'CREATIVITY', 'FOCUS']
  const categoryData = categories.map(c => ({
    name: c,
    count: completedQuests.filter(q => q.category === c).length
  }))
  const maxCatCount = Math.max(1, ...categoryData.map(c => c.count))
  
  const totalGoldEarned = user.gold + user.goldSpent;
  const { currentLevelXp, nextLevelXp, progressPercent: progressPercentage } = calculateLevelProgress(user.xp);
  const xpForNextLevel = nextLevelXp;
  
  const totalAchievementsUnlocked = user.achievements.length;
  // Fallback total achievements assuming 50 available in the system
  const totalAchievements = 50; 

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen text-gray-100 bg-background">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-wider glow-text">
        YOUR JOURNEY
      </h1>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel p-6 flex flex-col justify-center">
          <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-1">Total XP</h2>
          <div className="text-3xl font-bold glow-text text-primary">{user.xp.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">Level {user.level}</div>
          <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <div className="text-xs text-right mt-1 text-gray-400">{currentLevelXp}/{xpForNextLevel} XP</div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-center">
          <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-1">Wealth</h2>
          <div className="text-3xl font-bold text-yellow-500 glow-text">{totalGoldEarned.toLocaleString()} <span className="text-sm text-gray-400 font-normal">earned</span></div>
          <div className="text-sm text-yellow-300 mt-2">{user.gold.toLocaleString()} <span className="text-gray-500">remaining</span></div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-center">
          <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-1">Streaks</h2>
          <div className="text-3xl font-bold text-orange-500 glow-text">{user.currentStreak} <span className="text-sm text-gray-400 font-normal">Days</span></div>
          <div className="text-sm text-gray-400 mt-2">Best: {user.bestStreak}</div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-center">
          <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-1">Quests</h2>
          <div className="text-3xl font-bold text-secondary glow-text">{completedQuests.length}</div>
          <div className="text-sm text-gray-400 mt-2">Completed</div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-center col-span-2 md:col-span-1">
          <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-1">Achievements</h2>
          <div className="text-3xl font-bold text-teal-400 glow-text">{totalAchievementsUnlocked}</div>
          <div className="text-sm text-gray-400 mt-2">/ {totalAchievements} Unlocked</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* ATTRIBUTE RADAR */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-200 tracking-wider">POWER ANALYSIS</h2>
          <div className="space-y-4">
            {[
              { name: 'INTELLECT', val: user.intellect, color: 'var(--attr-intellect, #3b82f6)' },
              { name: 'STRENGTH', val: user.strength, color: 'var(--attr-strength, #ef4444)' },
              { name: 'DISCIPLINE', val: user.discipline, color: 'var(--attr-discipline, #10b981)' },
              { name: 'CREATIVITY', val: user.creativity, color: 'var(--attr-creativity, #d946ef)' },
              { name: 'FOCUS', val: user.focus, color: 'var(--attr-focus, #f59e0b)' }
            ].map(attr => {
              const maxAttr = Math.max(10, user.intellect, user.strength, user.discipline, user.creativity, user.focus)
              return (
              <div key={attr.name}>
                <div className="flex justify-between mb-1 text-sm font-semibold tracking-wider">
                  <span style={{ color: attr.color }}>{attr.name}</span>
                  <span>{attr.val}</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded h-2">
                  <div 
                    className="h-full rounded transition-all duration-1000" 
                    style={{ 
                      width: `${(attr.val / maxAttr) * 100}%`,
                      backgroundColor: attr.color,
                      boxShadow: `0 0 10px ${attr.color}`
                    }}
                  />
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* WEEKLY ACTIVITY */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-200 tracking-wider">WEEKLY ACTIVITY</h2>
          <div className="flex justify-between items-end h-48 mt-4 pt-4 border-t border-gray-800">
            {weeklyData.map((d, i) => {
              const height = d.count > 0 ? `${(d.count / maxWeeklyCount) * 100}%` : '5%';
              return (
              <div key={i} className="flex flex-col items-center w-full">
                <div className="w-full flex justify-center h-40 items-end mb-2">
                  <div 
                    className={`w-4/5 md:w-8 rounded-t ${d.isToday ? 'bg-secondary shadow-[0_0_15px_var(--secondary)]' : 'bg-primary shadow-[0_0_10px_var(--primary)]'} transition-all duration-1000`}
                    style={{ height }}
                  >
                    <div className="-mt-6 text-center text-xs font-bold text-gray-300">
                      {d.count > 0 && d.count}
                    </div>
                  </div>
                </div>
                <div className={`text-xs ${d.isToday ? 'text-white font-bold' : 'text-gray-500'}`}>{d.day}</div>
              </div>
            )})}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* CATEGORY BREAKDOWN */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-200 tracking-wider">MASTERY BY DOMAIN</h2>
          <div className="space-y-4">
            {categoryData.map(c => {
               const colors: Record<string, string> = {
                  'INTELLECT': 'var(--attr-intellect, #3b82f6)',
                  'STRENGTH': 'var(--attr-strength, #ef4444)',
                  'DISCIPLINE': 'var(--attr-discipline, #10b981)',
                  'CREATIVITY': 'var(--attr-creativity, #d946ef)',
                  'FOCUS': 'var(--attr-focus, #f59e0b)'
               }
               const color = colors[c.name] || 'var(--primary)';
               return (
              <div key={c.name} className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-900" style={{ backgroundColor: color, color: '#000' }}>
                      {c.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-gray-300">
                      {c.count} Quests
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-800">
                  <div style={{ width: `${(c.count / maxCatCount) * 100}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000"></div>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* DIFFICULTY BREAKDOWN */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-200 tracking-wider">CHALLENGE TIER</h2>
          <div className="space-y-4">
            {difficultyData.map(d => {
              const colors: Record<string, string> = {
                'EASY': '#10b981', // green
                'MEDIUM': '#f59e0b', // yellow
                'HARD': '#ef4444', // red
                'EPIC': 'var(--primary)' // purple
              }
              const color = colors[d.name] || 'var(--primary)';
              return (
              <div key={d.name} className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-bold inline-block text-gray-300 tracking-wider" style={{ color: color, textShadow: `0 0 5px ${color}` }}>
                      {d.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-gray-400">
                      {d.count} Quests
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-800">
                  <div style={{ width: `${(d.count / maxDiffCount) * 100}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000"></div>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>

      {/* COMBAT LOG (RECENT ACTIVITY) */}
      <div className="glass-panel p-6 mb-16">
        <h2 className="text-xl font-bold mb-6 text-gray-200 tracking-wider">COMBAT LOG (RECENT)</h2>
        {completedQuests.length === 0 ? (
          <div className="text-center py-10 text-gray-500 italic border border-dashed border-gray-700 rounded-lg">
            No battles won yet. Embark on a quest!
          </div>
        ) : (
          <div className="space-y-3">
            {completedQuests.slice(0, 10).map((quest) => (
              <div key={quest.id} className="flex justify-between items-center p-4 bg-[#0A0A10] border border-gray-800 rounded-lg hover:border-primary transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 rounded-full bg-gray-900 border border-gray-700 group-hover:border-primary transition-colors">
                    <span className="text-[10px] text-gray-400">XP</span>
                    <span className="text-xs font-bold text-primary">+{quest.xpReward}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-200 group-hover:text-white transition-colors">{quest.title}</h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <span className="uppercase tracking-wider">{quest.category}</span>
                      <span>•</span>
                      <span className="uppercase tracking-wider">{quest.difficulty}</span>
                      <span>•</span>
                      <span>{quest.completedAt ? new Date(quest.completedAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center text-yellow-500 font-bold bg-yellow-900/20 px-3 py-1 rounded">
                    +{quest.goldReward}G
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
