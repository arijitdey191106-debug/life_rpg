import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const systemQuests = [
  // INTELLECT
  { id: 'system-intellect-study-30', title: 'Study for 30 Minutes', description: 'Focus on learning something valuable for your future.', category: 'INTELLECT', difficulty: 'MEDIUM', xpReward: 40, goldReward: 10 },
  { id: 'system-intellect-coding-5', title: 'Solve 5 Coding Problems', description: 'Keep your algorithm skills sharp.', category: 'INTELLECT', difficulty: 'HARD', xpReward: 80, goldReward: 20 },
  { id: 'system-intellect-read-20', title: 'Read 20 Pages', description: 'Read a non-fiction or educational book.', category: 'INTELLECT', difficulty: 'EASY', xpReward: 20, goldReward: 5 },
  { id: 'system-intellect-learn-new', title: 'Learn Something New', description: 'Watch a tutorial or read an article about a new topic.', category: 'INTELLECT', difficulty: 'MEDIUM', xpReward: 30, goldReward: 8 },

  // STRENGTH
  { id: 'system-strength-workout', title: 'Complete a Workout', description: 'Lift weights or do bodyweight exercises.', category: 'STRENGTH', difficulty: 'HARD', xpReward: 60, goldReward: 15 },
  { id: 'system-strength-walk-5k', title: 'Walk 5,000 Steps', description: 'Get outside and move.', category: 'STRENGTH', difficulty: 'MEDIUM', xpReward: 35, goldReward: 10 },
  { id: 'system-strength-stretch', title: 'Stretch for 15 Minutes', description: 'Improve your flexibility and prevent injuries.', category: 'STRENGTH', difficulty: 'EASY', xpReward: 15, goldReward: 5 },
  { id: 'system-strength-pushups', title: 'Complete 30 Push-ups', description: 'Can be broken into multiple sets.', category: 'STRENGTH', difficulty: 'MEDIUM', xpReward: 25, goldReward: 8 },

  // DISCIPLINE
  { id: 'system-discipline-morning', title: 'Complete Your Morning Routine', description: 'Start the day right without checking your phone immediately.', category: 'DISCIPLINE', difficulty: 'MEDIUM', xpReward: 35, goldReward: 10 },
  { id: 'system-discipline-plan', title: 'Plan Tomorrow', description: 'Write down your top 3 tasks for the next day.', category: 'DISCIPLINE', difficulty: 'EASY', xpReward: 20, goldReward: 5 },
  { id: 'system-discipline-clean', title: 'Clean Your Workspace', description: 'Clear your desk and organize your files.', category: 'DISCIPLINE', difficulty: 'EASY', xpReward: 25, goldReward: 5 },
  { id: 'system-discipline-pending', title: 'Finish One Pending Task', description: 'Do that one thing you have been procrastinating on.', category: 'DISCIPLINE', difficulty: 'HARD', xpReward: 50, goldReward: 15 },

  // CREATIVITY
  { id: 'system-creativity-write-20', title: 'Write for 20 Minutes', description: 'Journal, blog, or work on a story.', category: 'CREATIVITY', difficulty: 'MEDIUM', xpReward: 45, goldReward: 12 },
  { id: 'system-creativity-create', title: 'Create Something', description: 'Code a small side project, make a beat, or edit a video.', category: 'CREATIVITY', difficulty: 'HARD', xpReward: 70, goldReward: 20 },
  { id: 'system-creativity-sketch', title: 'Sketch or Design for 30 Minutes', description: 'Practice your visual arts or UI design.', category: 'CREATIVITY', difficulty: 'MEDIUM', xpReward: 40, goldReward: 10 },
  { id: 'system-creativity-brainstorm', title: 'Brainstorm 10 Ideas', description: 'Pick a problem and come up with 10 possible solutions.', category: 'CREATIVITY', difficulty: 'EASY', xpReward: 20, goldReward: 5 },

  // FOCUS
  { id: 'system-focus-deep-25', title: 'Deep Work for 25 Minutes', description: 'One full Pomodoro session with zero distractions.', category: 'FOCUS', difficulty: 'MEDIUM', xpReward: 40, goldReward: 10 },
  { id: 'system-focus-deep-60', title: 'Deep Work for 60 Minutes', description: 'An hour of intense, uninterrupted focus.', category: 'FOCUS', difficulty: 'EPIC', xpReward: 100, goldReward: 30 },
  { id: 'system-focus-study', title: 'Study Without Distractions', description: 'Keep your phone in another room.', category: 'FOCUS', difficulty: 'MEDIUM', xpReward: 50, goldReward: 12 },
  { id: 'system-focus-important', title: 'Complete One Important Task', description: 'Finish the most critical task of your day.', category: 'FOCUS', difficulty: 'HARD', xpReward: 60, goldReward: 15 },
]

async function main() {
  console.log('Seeding system quests...')
  
  // Create a dummy system user if needed, or just let them have a dummy ID.
  // Actually, userId is required, so let's create a SYSTEM user.
  let systemUser = await prisma.user.findUnique({ where: { id: 'SYSTEM_USER' } })
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        id: 'SYSTEM_USER',
        username: 'System',
        email: 'system@liferpg.local',
        passwordHash: 'none',
        level: 99
      }
    })
  }

  for (const q of systemQuests) {
    await prisma.quest.upsert({
      where: { id: q.id },
      update: {
        title: q.title,
        description: q.description,
        category: q.category,
        difficulty: q.difficulty,
        xpReward: q.xpReward,
        goldReward: q.goldReward,
      },
      create: {
        id: q.id,
        userId: systemUser.id,
        type: 'SYSTEM',
        title: q.title,
        description: q.description,
        category: q.category,
        difficulty: q.difficulty,
        xpReward: q.xpReward,
        goldReward: q.goldReward,
      }
    })
  }

  console.log('Done seeding system quests.')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
