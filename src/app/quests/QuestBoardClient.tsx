"use client"

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Trash2, Edit2, Plus, Calendar, Clock, RefreshCw, X, Shield, Sparkles, Star } from 'lucide-react'
import { createQuest, editQuest, claimQuestReward, deleteQuest } from '@/app/actions/quest'
import { acceptSystemQuest } from '@/app/actions/acceptSystemQuest'
import { processSystemChallenge } from '@/app/actions/processChallenge'

type Quest = {
  id: string
  title: string
  description: string | null
  category: string
  difficulty: string
  duration: number | null
  xpReward: number
  goldReward: number
  status: string
  type: string
  dueDate: Date | null
  isRecurring: boolean
  recurringInterval: string | null
  createdAt: Date
  completedAt: Date | null
}

type UserChallenge = {
  id: string
  status: string
  progress: number
  completedAt: Date | null
  challenge: {
    id: string
    key: string
    name: string
    description: string
    category: string
    difficulty: string
    xpReward: number
    goldReward: number
    icon: string
    type: string
  }
}

const CATEGORIES = ['ALL', 'INTELLECT', 'STRENGTH', 'DISCIPLINE', 'CREATIVITY', 'FOCUS']
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EPIC']
const TABS = ['ALL', 'TODAY', 'PERSONAL', 'SYSTEM', 'COMPLETED']

export default function QuestBoardClient({ 
  initialQuests, 
  initialChallenges = [],
  initialAttribute = 'ALL' 
}: { 
  initialQuests: any[], 
  initialChallenges?: any[],
  initialAttribute?: string 
}) {
  const [quests, setQuests] = useState<Quest[]>(
    initialQuests.map((q: any) => ({
      ...q,
      dueDate: q.dueDate ? new Date(q.dueDate) : null,
      createdAt: new Date(q.createdAt),
      completedAt: q.completedAt ? new Date(q.completedAt) : null,
    }))
  )
  
  const [challenges, setChallenges] = useState<UserChallenge[]>(
    initialChallenges.map((c: any) => ({
      ...c,
      completedAt: c.completedAt ? new Date(c.completedAt) : null,
    }))
  )

  const [tab, setTab] = useState<string>('ALL')
  const [attributeFilter, setAttributeFilter] = useState<string>(initialAttribute.toUpperCase())
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  
  const [celebration, setCelebration] = useState<{ xp: number; gold: number; category: string } | null>(null)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  
  const [questError, setQuestError] = useState<{
    title: string;
    description: string;
    required?: number;
    current?: number;
    remaining?: number;
    noun?: string;
  } | null>(null)
  
  const [questSuccess, setQuestSuccess] = useState<{
    title: string;
    xp: number;
    gold: number;
  } | null>(null)

  const openCreateModal = () => {
    setEditingQuest(null)
    setIsModalOpen(true)
  }

  const openEditModal = (q: Quest) => {
    setEditingQuest(q)
    setIsModalOpen(true)
  }

  const handleAction = async (formData: FormData) => {
    if (editingQuest) {
      await editQuest(editingQuest.id, formData)
    } else {
      await createQuest(formData)
    }
    setIsModalOpen(false)
    window.location.reload()
  }

  const handleComplete = async (id: string) => {
    try {
      const res = await claimQuestReward(id) as any
      if (res?.error) {
        setQuestError({
          title: "VERIFICATION FAILED",
          description: res.error
        })
        return
      }
      setCelebration({ xp: res.xp, gold: res.gold, category: res.category })
      if (res.levelUp) {
        setLevelUp(res.levelUp)
      }
      
      setQuests(prev => prev.map(q => q.id === id ? { ...q, status: 'CLAIMED', completedAt: new Date() } : q))
      
      setTimeout(() => {
        setCelebration(null)
        if (res.levelUp) {
          setTimeout(() => setLevelUp(null), 3000)
        }
      }, 3000)
    } catch (err: any) {
      setQuestError({
        title: "ERROR",
        description: err.message || 'Failed to claim reward'
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this quest?')) {
      await deleteQuest(id)
      setQuests(prev => prev.filter(q => q.id !== id))
    }
  }

  const handleAcceptSystemQuest = async (id: string) => {
    try {
      await acceptSystemQuest(id)
      window.location.reload()
    } catch (err: any) {
      setQuestError({
        title: "ERROR",
        description: err.message || 'Failed to accept system quest'
      })
    }
  }
  
  const handleClaimChallenge = async (id: string) => {
    const res = await processSystemChallenge(id) as any
    if (res?.error) {
      if (res.error === "OBJECTIVE_NOT_MET" && res.details) {
        setQuestError({
          title: "QUEST NOT COMPLETE",
          description: `This quest cannot be claimed yet.\n\nREQUIRED\nComplete ${res.details.required} ${res.details.noun.toLowerCase()}.\n\nCURRENT PROGRESS\n${res.details.current} / ${res.details.required} completed\n\nComplete ${res.details.remaining} more to unlock this reward.`,
          required: res.details.required,
          current: res.details.current,
          remaining: res.details.remaining,
          noun: res.details.noun
        })
      } else {
        setQuestError({
          title: "VERIFICATION FAILED",
          description: res.error
        })
      }
      return
    }
    
    const challenge = challenges.find(c => c.id === id)
    if (challenge) {
      setQuestSuccess({
        title: challenge.challenge.name,
        xp: challenge.challenge.xpReward,
        gold: challenge.challenge.goldReward
      })
    }
    
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, status: 'CLAIMED', completedAt: new Date() } : c))
  }

  const getAttrColor = (category: string) => {
    switch (category) {
      case 'INTELLECT': return 'text-blue-400 border-blue-400'
      case 'STRENGTH': return 'text-red-400 border-red-400'
      case 'DISCIPLINE': return 'text-green-400 border-green-400'
      case 'CREATIVITY': return 'text-purple-400 border-purple-400'
      case 'FOCUS': return 'text-yellow-400 border-yellow-400'
      default: return 'text-gray-400 border-gray-400'
    }
  }

  const filteredItems = useMemo(() => {
    let filteredQuests = quests.filter(q => {
      if (attributeFilter !== 'ALL' && q.category !== attributeFilter) return false;
      return true;
    });
    
    let filteredChallenges = challenges.filter(c => {
      if (attributeFilter !== 'ALL' && c.challenge.category !== 'ALL' && c.challenge.category !== attributeFilter) return false;
      return true;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeQ = filteredQuests.filter(q => q.status === 'PENDING' && q.type !== 'SYSTEM');
    const systemQ = filteredQuests.filter(q => q.type === 'SYSTEM');
    const completedQ = filteredQuests.filter(q => q.status === 'COMPLETED');
    
    const activeC = filteredChallenges.filter(c => c.status === 'AVAILABLE');
    const completedC = filteredChallenges.filter(c => c.status === 'COMPLETED');

    if (tab === 'ALL') {
      return { quests: [...activeQ, ...systemQ], challenges: activeC };
    }
    if (tab === 'TODAY') {
      const todayQ = activeQ.filter(q => {
        if (!q.dueDate) return false;
        const due = new Date(q.dueDate);
        due.setHours(0,0,0,0);
        return due.getTime() === today.getTime();
      });
      return { quests: todayQ, challenges: activeC };
    }
    if (tab === 'PERSONAL') {
      return { quests: activeQ, challenges: [] };
    }
    if (tab === 'SYSTEM') {
      return { quests: systemQ, challenges: activeC };
    }
    if (tab === 'COMPLETED') {
      return { quests: completedQ, challenges: completedC };
    }
    return { quests: [], challenges: [] };
  }, [quests, challenges, tab, attributeFilter]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 min-h-screen bg-[#05050A] text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold glow-text text-[var(--primary)] flex items-center gap-3">
            <Shield className="w-10 h-10" />
            Quest Board
          </h1>
          <p className="text-[var(--secondary)] mt-2">Manage your journey and earn rewards.</p>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[var(--primary)] hover:bg-opacity-80 px-6 py-3 rounded-md font-bold transition-all shadow-[0_0_15px_rgba(138,43,226,0.5)]"
        >
          <Plus className="w-5 h-5" />
          Create Quest
        </button>
      </div>
      
      {/* Filters & Tabs */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button 
              key={c}
              onClick={() => setAttributeFilter(c)}
              className={`px-3 py-1 text-sm rounded-full border transition-all ${
                attributeFilter === c 
                  ? 'bg-gray-800 border-white text-white font-bold' 
                  : 'border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        
        <div className="flex gap-4 border-b border-gray-800 pb-2 overflow-x-auto">
          {TABS.map(t => (
            <button 
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-bold transition-colors whitespace-nowrap ${
                tab === t 
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredItems.challenges.map((uc) => (
             <motion.div 
               key={uc.id}
               layout
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className={`glass-panel p-6 rounded-xl flex flex-col justify-between border-2 shadow-lg
                 ${uc.status === 'COMPLETED' ? 'border-gray-800 opacity-60' : 'border-yellow-500/50 shadow-yellow-500/20'}`}
             >
               <div>
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-xs font-bold px-2 py-1 rounded-full border border-yellow-500 text-yellow-500 bg-yellow-500/10">
                     ◆ SYSTEM CHALLENGE
                   </span>
                   <span className="text-2xl">{uc.challenge.icon}</span>
                 </div>
                 
                 <h3 className="text-xl font-bold mb-2 text-yellow-100">{uc.challenge.name}</h3>
                 <p className="text-gray-400 text-sm mb-4">{uc.challenge.description}</p>
                 
                 <div className="flex flex-wrap gap-2 text-xs text-gray-300 mb-4">
                   <span className={`px-2 py-1 rounded border ${getAttrColor(uc.challenge.category)} bg-gray-900`}>
                     {uc.challenge.category}
                   </span>
                   <span className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded">
                     {uc.challenge.type}
                   </span>
                 </div>
               </div>

               <div className="mt-4 pt-4 border-t border-gray-800/50 flex justify-between items-center">
                 <div className="flex gap-4">
                   <span className="text-[var(--primary)] font-bold flex items-center gap-1"><Sparkles className="w-4 h-4" /> {uc.challenge.xpReward} XP</span>
                   <span className="text-yellow-400 font-bold flex items-center gap-1">🪙 {uc.challenge.goldReward}</span>
                 </div>
                 
                 {uc.status === 'AVAILABLE' && (
                   <button 
                     onClick={() => handleClaimChallenge(uc.id)}
                     className="bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 px-4 py-2 rounded font-bold transition-all border border-yellow-600/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                   >
                     Claim
                   </button>
                 )}
                 {uc.status === 'COMPLETED' && (
                   <div className="text-sm text-gray-500">Completed</div>
                 )}
               </div>
             </motion.div>
          ))}

          {filteredItems.quests.map((quest) => (
            <motion.div 
              key={quest.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`glass-panel p-6 rounded-xl flex flex-col justify-between ${quest.status === 'COMPLETED' ? 'border-gray-800 opacity-60' : 'glow-border'}`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getAttrColor(quest.category)}`}>
                    {quest.category}
                  </span>
                  {quest.type === 'SYSTEM' ? (
                    <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase border border-gray-700 px-2 py-1 rounded">SYSTEM</span>
                  ) : quest.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(quest)} className="text-gray-400 hover:text-white transition-colors" aria-label="Edit Quest">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(quest.id)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Delete Quest">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleDelete(quest.id)} className="text-gray-500 hover:text-red-500 transition-colors" aria-label="Delete Completed Quest">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <h3 className={`text-xl font-bold mb-2 ${quest.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>{quest.title}</h3>
                {quest.description && <p className="text-gray-400 text-sm mb-4 line-clamp-3">{quest.description}</p>}
                
                <div className="flex flex-wrap gap-2 text-xs text-gray-300 mb-4">
                  <span className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded">
                    <Shield className="w-3 h-3" /> {quest.difficulty}
                  </span>
                  {quest.duration && (
                    <span className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" /> {quest.duration}m
                    </span>
                  )}
                  {quest.dueDate && (
                    <span className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded">
                      <Calendar className="w-3 h-3" /> {quest.dueDate.toLocaleDateString()}
                    </span>
                  )}
                  {quest.isRecurring && (
                    <span className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded text-blue-300">
                      <RefreshCw className="w-3 h-3" /> {quest.recurringInterval}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                <div className="flex gap-4">
                  <span className="text-[var(--primary)] font-bold flex items-center gap-1"><Sparkles className="w-4 h-4" /> {quest.xpReward} XP</span>
                  <span className="text-yellow-400 font-bold flex items-center gap-1">🪙 {quest.goldReward}</span>
                </div>
                
                {quest.type === 'SYSTEM' ? (
                  <button 
                    onClick={() => handleAcceptSystemQuest(quest.id)}
                    className="bg-[var(--primary)] hover:bg-opacity-80 text-white px-4 py-2 text-sm font-bold tracking-widest rounded-md transition-all shadow-[0_0_10px_rgba(138,43,226,0.3)]"
                  >
                    ACCEPT QUEST
                  </button>
                ) : quest.status === 'PENDING' && (
                  <button 
                    onClick={() => handleComplete(quest.id)}
                    className="bg-green-600/20 hover:bg-green-600/40 text-green-400 p-2 rounded-full transition-all hover:scale-110 border border-green-600/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    aria-label="Complete Quest"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                )}
                {quest.status === 'COMPLETED' && (
                  <div className="text-sm text-gray-500">
                    Completed on: {quest.completedAt?.toLocaleDateString()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {filteredItems.quests.length === 0 && filteredItems.challenges.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 glass-panel rounded-xl">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Nothing found.</p>
              <p>Try changing filters or forge a new path.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="glass-panel glow-border w-full max-w-2xl rounded-xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold glow-text">{editingQuest ? 'Edit Quest' : 'New Quest'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white" aria-label="Close modal">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form action={handleAction} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1 text-gray-300">Quest Title *</label>
                  <input type="text" id="title" name="title" defaultValue={editingQuest?.title} required className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-[var(--primary)]" />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-300">Description</label>
                  <textarea id="description" name="description" defaultValue={editingQuest?.description || ''} rows={3} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-[var(--primary)]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-1 text-gray-300">Attribute Category *</label>
                    <select id="category" name="category" defaultValue={editingQuest?.category || 'INTELLECT'} required className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-[var(--primary)]">
                      {CATEGORIES.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium mb-1 text-gray-300">Difficulty *</label>
                    <select id="difficulty" name="difficulty" defaultValue={editingQuest?.difficulty || 'EASY'} required className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-[var(--primary)]">
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium mb-1 text-gray-300">Est. Duration (minutes)</label>
                    <input type="number" id="duration" name="duration" defaultValue={editingQuest?.duration || ''} min="1" className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-[var(--primary)]" />
                  </div>
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium mb-1 text-gray-300">Due Date</label>
                    <input type="date" id="dueDate" name="dueDate" defaultValue={editingQuest?.dueDate ? editingQuest.dueDate.toISOString().split('T')[0] : ''} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-[var(--primary)]" />
                  </div>
                </div>

                <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-md space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isRecurring" name="isRecurring" value="true" defaultChecked={editingQuest?.isRecurring} className="w-4 h-4 accent-[var(--primary)]" />
                    <label htmlFor="isRecurring" className="text-sm font-medium text-gray-300">Recurring Quest</label>
                  </div>
                  <div>
                    <label htmlFor="recurringInterval" className="block text-sm font-medium mb-1 text-gray-400">Interval</label>
                    <select id="recurringInterval" name="recurringInterval" defaultValue={editingQuest?.recurringInterval || ''} className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm text-white focus:outline-none focus:border-[var(--primary)]">
                      <option value="">None</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-md font-bold text-gray-300 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 bg-[var(--primary)] hover:bg-opacity-80 rounded-md font-bold text-white transition-colors shadow-[0_0_10px_rgba(138,43,226,0.3)]">
                    {editingQuest ? 'Save Changes' : 'Create Quest'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {celebration && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5, y: -100 }}
            className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-[#0a0a1a] border-2 border-[var(--primary)] p-10 rounded-2xl shadow-[0_0_50px_rgba(138,43,226,0.6)] text-center">
              <h2 className="text-4xl font-black mb-4 text-white glow-text uppercase tracking-wider">Quest Complete!</h2>
              <div className="flex justify-center gap-8 mb-6">
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold text-[var(--primary)] drop-shadow-[0_0_10px_rgba(138,43,226,0.8)]">+{celebration.xp}</span>
                  <span className="text-xl text-gray-300 mt-2 font-bold tracking-widest">XP</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">+{celebration.gold}</span>
                  <span className="text-xl text-gray-300 mt-2 font-bold tracking-widest">GOLD</span>
                </div>
              </div>
              {celebration.category !== 'ALL' && (
                <p className="text-[var(--secondary)] font-bold text-xl uppercase tracking-widest">+1 {celebration.category}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {levelUp && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="fixed inset-0 z-[110] pointer-events-none flex flex-col items-center justify-center bg-[var(--primary)]/20 backdrop-blur-md"
          >
            <div className="text-center">
              <h1 className="text-7xl font-black text-white glow-text mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,1)]">LEVEL UP!</h1>
              <p className="text-5xl font-bold text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,1)]">You are now Level {levelUp}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {questError && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0a0a1a] border border-[var(--primary)]/50 p-8 rounded-xl shadow-[0_0_40px_rgba(138,43,226,0.2)] text-center max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50" />
              
              <h2 className="text-xl font-bold mb-6 text-red-400 tracking-widest">{questError.title}</h2>
              
              <p className="text-gray-300 text-sm whitespace-pre-wrap mb-8 leading-relaxed">
                {questError.description}
              </p>
              
              <button 
                onClick={() => setQuestError(null)}
                className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-bold text-white transition-colors"
              >
                GOT IT
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {questSuccess && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0a0a1a] border border-[var(--primary)]/50 p-8 rounded-xl shadow-[0_0_40px_rgba(138,43,226,0.3)] text-center max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50" />
              
              <h2 className="text-2xl font-black mb-2 text-white glow-text uppercase tracking-wider">QUEST COMPLETE</h2>
              <p className="text-[var(--primary)] font-bold tracking-widest mb-6">{questSuccess.title}</p>
              
              <div className="flex justify-center gap-6 mb-8">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-white">+{questSuccess.xp}</span>
                  <span className="text-xs text-gray-500 mt-1 font-bold tracking-widest">XP</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-yellow-400">+{questSuccess.gold}</span>
                  <span className="text-xs text-gray-500 mt-1 font-bold tracking-widest">GOLD</span>
                </div>
              </div>
              
              <div className="text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 mb-8">
                <CheckCircle2 className="w-5 h-5" /> REWARD CLAIMED
              </div>
              
              <button 
                onClick={() => setQuestSuccess(null)}
                className="w-full px-6 py-3 bg-[var(--primary)] hover:bg-opacity-80 rounded-lg font-bold text-white transition-colors shadow-[0_0_15px_rgba(138,43,226,0.4)]"
              >
                GOT IT
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
