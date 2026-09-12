import { getUserAchievements } from "@/app/actions/achievements";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";

export const metadata = {
  title: "Achievements | Life RPG",
};

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const achievements = await getUserAchievements();
  
  const unlocked = achievements.filter(a => a.unlockedAt !== null);
  const locked = achievements.filter(a => a.unlockedAt === null);
  
  const total = achievements.length;
  const progress = total > 0 ? (unlocked.length / total) * 100 : 0;

  const rarityColors: Record<string, string> = {
    COMMON: "border-gray-500 text-gray-400 shadow-gray-500/20",
    RARE: "border-blue-500 text-blue-400 shadow-blue-500/20",
    EPIC: "border-purple-500 text-purple-400 shadow-purple-500/20",
    LEGENDARY: "border-yellow-500 text-yellow-400 shadow-yellow-500/20",
  };

  const getRarityColor = (rarity: string) => rarityColors[rarity] || rarityColors.COMMON;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 glow-text uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Hall of Legends
        </h1>
        <p className="text-gray-400 text-lg mb-6">Forge your legacy and claim your rewards.</p>
        
        <div className="max-w-md mx-auto glass-panel p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-gray-300">Completion</span>
            <span className="text-sm font-bold text-primary">{unlocked.length} / {total}</span>
          </div>
          <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(138,43,226,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {unlocked.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center border-b border-white/10 pb-2">
            <span className="bg-primary/20 text-primary p-1 rounded mr-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            Unlocked Feats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlocked.map((ach) => (
              <div 
                key={ach.id} 
                className={`glass-panel glass-panel-hover p-5 rounded-xl border ${getRarityColor(ach.rarity).split(' ')[0]} shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group`}
              >
                {/* Background glow based on rarity */}
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br from-transparent to-current ${getRarityColor(ach.rarity).split(' ')[1]}`} />
                
                <div className="relative z-10 flex items-start gap-4">
                  <div className="text-5xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transform group-hover:scale-110 transition-transform duration-300">
                    {ach.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-white mb-1 group-hover:glow-text transition-all">{ach.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{ach.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-auto">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded bg-black/40 border border-current uppercase tracking-wider ${getRarityColor(ach.rarity).split(' ')[1]}`}>
                        {ach.rarity}
                      </span>
                      {ach.xpReward > 0 && (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-intellect/10 text-intellect border border-intellect/20">
                          +{ach.xpReward} XP
                        </span>
                      )}
                      {ach.goldReward > 0 && (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          +{ach.goldReward} Gold
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-[10px] text-gray-500 font-mono">
                      Unlocked: {new Date(ach.unlockedAt!).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center border-b border-white/10 pb-2 text-gray-400">
            <Lock className="w-5 h-5 mr-3" />
            Locked Mysteries
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locked.map((ach) => (
              <div 
                key={ach.id} 
                className="glass-panel p-5 rounded-xl border border-white/5 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-black/40 z-0" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="text-5xl opacity-50">
                    {ach.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-300 mb-1 flex justify-between items-center">
                      {ach.name}
                      <Lock className="w-4 h-4 text-gray-500" />
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 italic">{ach.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded bg-black/40 border border-gray-700 text-gray-500 uppercase tracking-wider`}>
                        {ach.rarity}
                      </span>
                      {(ach.xpReward > 0 || ach.goldReward > 0) && (
                        <span className="text-[10px] text-gray-500 border border-gray-800 rounded px-2 py-1">
                          Reward Hidden
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
