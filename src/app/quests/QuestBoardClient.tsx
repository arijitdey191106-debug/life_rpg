"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Trash2, Edit2, Plus, Calendar, Clock, RefreshCw, X, Shield, Sparkles, Loader2, Target, Sword, AlertCircle } from 'lucide-react'
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
  dueDate: string | null
  isRecurring: boolean
  recurringInterval: string | null
  createdAt: string
  completedAt: string | null
}

type UserChallenge = {
  id: string
  status: string
  progress: number
  completedAt: string | null
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
const TABS = ['ACTIVE', 'AVAILABLE', 'COMPLETED']

export default function QuestBoardClient({ 
  initialQuests, 
  initialChallenges = [],
  initialAttribute = 'ALL' 
}: { 
  initialQuests: any[], 
  initialChallenges?: any[],
  initialAttribute?: string 
}) {
  const router = useRouter()
  
  // Safe Date parsing done ONCE on initial render
  const [quests, setQuests] = useState<Quest[]>(
    initialQuests.map((q: any) => ({
      ...q,
      dueDate: q.dueDate ? new Date(q.dueDate).toISOString().split('T')[0] : null,
      createdAt: q.createdAt,
      completedAt: q.completedAt ? new Date(q.completedAt).toISOString().split('T')[0] : null,
    }))
  )
  
  const [challenges, setChallenges] = useState<UserChallenge[]>(
    initialChallenges.map((c: any) => ({
      ...c,
      completedAt: c.completedAt ? new Date(c.completedAt).toISOString().split('T')[0] : null,
    }))
  )

  const [tab, setTab] = useState<string>('ACTIVE')
  const [attributeFilter, setAttributeFilter] = useState<string>(initialAttribute.toUpperCase())
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  
  // Loading & Action states
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)
  const [isModalSubmitting, setIsModalSubmitting] = useState(false)

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
    setIsModalSubmitting(true)
    try {
      if (editingQuest) {
        await editQuest(editingQuest.id, formData)
      } else {
        await createQuest(formData)
      }
      setIsModalOpen(false)
      window.location.reload()
    } catch (err: any) {
      setQuestError({ title: "ERROR", description: err.message || 'Failed to save quest' })
    } finally {
      setIsModalSubmitting(false)
    }
  }

  const handleComplete = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(id);
    try {
      const res = await claimQuestReward(id) as any
      if (res?.error) {
        setQuestError({ title: "VERIFICATION FAILED", description: res.error })
        return
      }
      setCelebration({ xp: res.xp, gold: res.gold, category: res.category })
      if (res.levelUp) setLevelUp(res.levelUp)
      
      setQuests(prev => prev.map(q => q.id === id ? { ...q, status: 'CLAIMED', completedAt: new Date().toISOString().split('T')[0] } : q))
      router.refresh()
      
      setTimeout(() => {
        setCelebration(null)
        if (res.levelUp) setTimeout(() => setLevelUp(null), 3000)
      }, 3000)
    } catch (err: any) {
      setQuestError({ title: "ERROR", description: err.message || 'Failed to claim reward' })
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (isSubmitting) return;
    if (confirm('Are you sure you want to abandon this quest?')) {
      setIsSubmitting(id);
      try {
        await deleteQuest(id)
        setQuests(prev => prev.filter(q => q.id !== id))
      } finally {
        setIsSubmitting(null)
      }
    }
  }

  const handleAcceptSystemQuest = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(id);
    try {
      await acceptSystemQuest(id)
      setQuestSuccess({ title: "Quest Accepted", xp: 0, gold: 0 })
      setTimeout(() => window.location.reload(), 1000)
    } catch (err: any) {
      setQuestError({ title: "ERROR", description: err.message || 'Failed to accept quest' })
    } finally {
      setIsSubmitting(null)
    }
  }
  
  const handleClaimChallenge = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(id);
    try {
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
          setQuestError({ title: "VERIFICATION FAILED", description: res.error })
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
      
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, status: 'CLAIMED', completedAt: new Date().toISOString().split('T')[0] } : c))
      router.refresh()
      setTimeout(() => setQuestSuccess(null), 3000)
    } finally {
      setIsSubmitting(null)
    }
  }

  const getAttrColor = (category: string) => {
    switch (category) {
      case 'INTELLECT': return 'text-blue-400 border-blue-400 bg-blue-400/10'
      case 'STRENGTH': return 'text-red-400 border-red-400 bg-red-400/10'
      case 'DISCIPLINE': return 'text-green-400 border-green-400 bg-green-400/10'
      case 'CREATIVITY': return 'text-purple-400 border-purple-400 bg-purple-400/10'
      case 'FOCUS': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10'
      default: return 'text-gray-400 border-gray-400 bg-gray-400/10'
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

    const activeQ = filteredQuests.filter(q => q.status === 'PENDING' && q.type !== 'SYSTEM');
    const activeC = filteredChallenges.filter(c => c.status !== 'COMPLETED' && c.status !== 'CLAIMED');

    const availableQ = filteredQuests.filter(q => q.type === 'SYSTEM');

    const completedQ = filteredQuests.filter(q => (q.status === 'COMPLETED' || q.status === 'CLAIMED') && q.type !== 'SYSTEM');
    const completedC = filteredChallenges.filter(c => c.status === 'COMPLETED' || c.status === 'CLAIMED');

    if (tab === 'ACTIVE') return { quests: activeQ, challenges: activeC };
    if (tab === 'AVAILABLE') return { quests: availableQ, challenges: [] };
    if (tab === 'COMPLETED') return { quests: completedQ, challenges: completedC };
    
    return { quests: [], challenges: [] };
  }, [quests, challenges, tab, attributeFilter]);

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-xl border border-white/5">
        {/* Navigation Tabs */}
        <div className="flex bg-black/40 rounded-lg p-1 w-full md:w-auto overflow-x-auto">
          {TABS.map(t => (
            <button 
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold tracking-wider rounded-md transition-all whitespace-nowrap ${
                tab === t 
                  ? 'bg-[var(--primary)] text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        
        <button 
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg font-bold transition-all border border-white/10"
        >
          <Plus className="w-4 h-4" />
          NEW QUEST
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button 
            key={c}
            onClick={() => setAttributeFilter(c)}
            className={`px-4 py-1.5 text-xs font-bold tracking-widest rounded-full border transition-all ${
              attributeFilter === c 
                ? 'bg-white text-black border-white' 
                : 'border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Quest Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {/* Challenges Rendering */}
          {filteredItems.challenges.map((uc) => (
             <motion.div 
               key={uc.id}
               layout
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-[#0a0a0f] border border-yellow-500/30 rounded-xl overflow-hidden shadow-lg shadow-yellow-500/5 flex flex-col"
             >
               <div className="p-5 flex-1">
                 <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-2">
                     <Target className="w-4 h-4 text-yellow-500" />
                     <span className="text-[10px] font-black tracking-widest text-yellow-500 uppercase">System Challenge</span>
                   </div>
                   <span className="text-2xl" aria-hidden="true">{uc.challenge.icon}</span>
                 </div>
                 
                 <h3 className="text-lg font-bold text-white mb-2 leading-tight">{uc.challenge.name}</h3>
                 <p className="text-gray-400 text-sm mb-4">{uc.challenge.description}</p>
                 
                 <div className="flex flex-wrap gap-2 text-[10px] font-bold tracking-widest uppercase">
                   <span className={`px-2.5 py-1 rounded-sm border ${getAttrColor(uc.challenge.category)}`}>
                     {uc.challenge.category}
                   </span>
                   <span className="px-2.5 py-1 rounded-sm border border-gray-700 text-gray-400 bg-gray-800/50">
                     {uc.challenge.type}
                   </span>
                 </div>
               </div>

               <div className="bg-black/40 p-4 border-t border-yellow-500/10">
                 <div className="flex justify-between items-center mb-4">
                   <span className="text-[var(--primary)] font-bold flex items-center gap-1.5 text-sm">
                     <Sparkles className="w-4 h-4" /> {uc.challenge.xpReward} XP
                   </span>
                   <span className="text-yellow-400 font-bold flex items-center gap-1.5 text-sm">
                     <span className="text-lg leading-none">dYT</span> {uc.challenge.goldReward}
                   </span>
                 </div>
                 
                 {uc.status === 'AVAILABLE' ? (
                   <button 
                     onClick={() => handleClaimChallenge(uc.id)}
                     disabled={isSubmitting !== null}
                     className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black py-2.5 rounded-lg font-bold text-sm tracking-widest transition-colors flex justify-center items-center gap-2"
                   >
                     {isSubmitting === uc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CHECK PROGRESS'}
                   </button>
                 ) : (
                   <div className="w-full text-center bg-gray-900/50 text-gray-500 py-2.5 rounded-lg font-bold text-sm tracking-widest border border-gray-800">
                     COMPLETED {uc.completedAt ? `(${uc.completedAt})` : ''}
                   </div>
                 )}
               </div>
             </motion.div>
          ))}

          {/* Quests Rendering */}
          {filteredItems.quests.map((quest) => (
            <motion.div 
              key={quest.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-[#0a0a0f] border rounded-xl overflow-hidden shadow-lg flex flex-col transition-colors ${
                (quest.status === 'COMPLETED' || quest.status === 'CLAIMED') 
                  ? 'border-gray-800/50 opacity-60' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Sword className={`w-4 h-4 ${quest.type === 'SYSTEM' ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                      {quest.type === 'SYSTEM' ? 'System Quest' : 'Personal Quest'}
                    </span>
                  </div>
                  
                  {quest.status === 'PENDING' && quest.type !== 'SYSTEM' && (
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(quest)} disabled={isSubmitting !== null} className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-md hover:bg-white/5" aria-label="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(quest.id)} disabled={isSubmitting !== null} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10" aria-label="Abandon">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {(quest.status === 'COMPLETED' || quest.status === 'CLAIMED') && (
                    <button onClick={() => handleDelete(quest.id)} disabled={isSubmitting !== null} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-md" aria-label="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <h3 className={`text-lg font-bold mb-2 leading-tight ${
                  (quest.status === 'COMPLETED' || quest.status === 'CLAIMED') ? 'line-through text-gray-500' : 'text-white'
                }`}>{quest.title}</h3>
                
                {quest.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{quest.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 text-[10px] font-bold tracking-widest uppercase">
                  <span className={`px-2.5 py-1 rounded-sm border ${getAttrColor(quest.category)}`}>
                    {quest.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-sm border border-gray-700 text-gray-400 bg-gray-800/50 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {quest.difficulty}
                  </span>
                  {quest.duration && (
                    <span className="px-2.5 py-1 rounded-sm border border-gray-700 text-gray-400 bg-gray-800/50 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {quest.duration}m
                    </span>
                  )}
                  {quest.dueDate && (
                    <span className="px-2.5 py-1 rounded-sm border border-blue-900/50 text-blue-400 bg-blue-900/20 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {quest.dueDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-black/40 p-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[var(--primary)] font-bold flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4" /> {quest.xpReward} XP
                  </span>
                  <span className="text-yellow-400 font-bold flex items-center gap-1.5 text-sm">
                    <span className="text-lg leading-none">dYT</span> {quest.goldReward}
                  </span>
                </div>
                
                {quest.type === 'SYSTEM' ? (
                  <button 
                    onClick={() => handleAcceptSystemQuest(quest.id)}
                    disabled={isSubmitting !== null}
                    className="w-full bg-[var(--primary)] hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-bold text-sm tracking-widest transition-colors flex justify-center items-center gap-2"
                  >
                    {isSubmitting === quest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ACCEPT QUEST'}
                  </button>
                ) : quest.status === 'PENDING' ? (
                  <button 
                    onClick={() => handleComplete(quest.id)}
                    disabled={isSubmitting !== null}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-bold text-sm tracking-widest transition-colors flex justify-center items-center gap-2"
                  >
                    {isSubmitting === quest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <><CheckCircle2 className="w-4 h-4" /> COMPLETE</>
                    )}
                  </button>
                ) : (
                  <div className="w-full text-center bg-gray-900/50 text-gray-500 py-2.5 rounded-lg font-bold text-sm tracking-widest border border-gray-800">
                    COMPLETED {quest.completedAt ? `(${quest.completedAt})` : ''}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {filteredItems.quests.length === 0 && filteredItems.challenges.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="col-span-full py-24 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-2xl"
            >
              <Shield className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-bold tracking-widest uppercase mb-1">No Quests Found</p>
              <p className="text-sm">Change your filters or accept new quests.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals & Notifications */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0a0a0f] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h2 className="text-xl font-bold tracking-widest uppercase">{editingQuest ? 'Edit Quest' : 'New Quest'}</h2>
                <button onClick={() => setIsModalOpen(false)} disabled={isModalSubmitting} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form action={handleAction} className="p-6 space-y-5">
                <div>
                  <label htmlFor="title" className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Quest Title *</label>
                  <input type="text" id="title" name="title" defaultValue={editingQuest?.title} required className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors" placeholder="Enter quest objective..." />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Description</label>
                  <textarea id="description" name="description" defaultValue={editingQuest?.description || ''} rows={3} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors resize-none" placeholder="Add optional details..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Attribute *</label>
                    <select id="category" name="category" defaultValue={editingQuest?.category || 'INTELLECT'} required className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors">
                      {CATEGORIES.filter(c => c !== 'ALL').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="difficulty" className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Difficulty *</label>
                    <select id="difficulty" name="difficulty" defaultValue={editingQuest?.difficulty || 'EASY'} required className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors">
                      {['EASY', 'MEDIUM', 'HARD', 'EPIC'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duration" className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Duration (min)</label>
                    <input type="number" id="duration" name="duration" defaultValue={editingQuest?.duration || ''} min="1" className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors" placeholder="e.g. 30" />
                  </div>
                  <div>
                    <label htmlFor="dueDate" className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Due Date</label>
                    <input type="date" id="dueDate" name="dueDate" defaultValue={editingQuest?.dueDate || ''} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors" />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button type="submit" disabled={isModalSubmitting} className="w-full bg-[var(--primary)] hover:bg-opacity-90 disabled:opacity-50 text-white font-bold tracking-widest text-sm uppercase py-3.5 rounded-lg transition-all flex items-center justify-center gap-2">
                    {isModalSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingQuest ? 'SAVE CHANGES' : 'FORGE QUEST')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {questError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-[#0a0a0f] border border-red-500/30 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl shadow-red-500/10"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black tracking-widest text-white mb-2">{questError.title}</h3>
              <p className="text-gray-400 text-sm whitespace-pre-wrap mb-6">{questError.description}</p>
              <button 
                onClick={() => setQuestError(null)}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest text-sm py-3 rounded-lg transition-colors"
              >
                ACKNOWLEDGE
              </button>
            </motion.div>
          </div>
        )}

        {questSuccess && (
          <div className="fixed bottom-8 right-8 z-50">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0a0a0f] border border-green-500/30 p-6 rounded-xl shadow-2xl shadow-green-500/10 flex items-center gap-4"
            >
              <div className="bg-green-500/20 p-3 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight">{questSuccess.title}</h3>
                {(questSuccess.xp > 0 || questSuccess.gold > 0) && (
                  <p className="text-sm text-gray-400 mt-1 flex gap-3">
                    {questSuccess.xp > 0 && <span className="text-[var(--primary)] font-bold">+{questSuccess.xp} XP</span>}
                    {questSuccess.gold > 0 && <span className="text-yellow-400 font-bold">+{questSuccess.gold} Gold</span>}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
