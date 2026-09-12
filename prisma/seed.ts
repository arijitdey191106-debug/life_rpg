import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed shop items
  const items = [
    // Frames
    { name: 'Neon Pulse Frame', description: 'A pulsating neon border for your avatar.', type: 'FRAME', rarity: 'COMMON', cost: 100, icon: '🖼️' },
    { name: 'Cyber Circuit Frame', description: 'Digital circuits flow around your profile.', type: 'FRAME', rarity: 'RARE', cost: 300, icon: '⚡' },
    { name: 'Void Rift Frame', description: 'A frame torn from the fabric of space-time.', type: 'FRAME', rarity: 'EPIC', cost: 600, icon: '🌀' },
    { name: 'Astral Crown Frame', description: 'The ultimate frame. Celestial energy radiates outward.', type: 'FRAME', rarity: 'LEGENDARY', cost: 1200, icon: '👑' },
    // Badges
    { name: 'Rookie Badge', description: 'Everyone starts somewhere. Wear it with pride.', type: 'BADGE', rarity: 'COMMON', cost: 50, icon: '🎖️' },
    { name: 'Grinder Badge', description: 'For those who never stop pushing.', type: 'BADGE', rarity: 'RARE', cost: 200, icon: '⚙️' },
    { name: 'Legend Badge', description: 'Few have earned the right to display this.', type: 'BADGE', rarity: 'EPIC', cost: 500, icon: '🏅' },
    { name: 'Mythic Badge', description: 'A badge of mythical proportions.', type: 'BADGE', rarity: 'LEGENDARY', cost: 1000, icon: '💎' },
    // Themes
    { name: 'Midnight Theme', description: 'Deeper, darker interface tones.', type: 'THEME', rarity: 'COMMON', cost: 150, icon: '🌙' },
    { name: 'Crimson Theme', description: 'Blood-red accents for the fierce warrior.', type: 'THEME', rarity: 'RARE', cost: 350, icon: '🔴' },
    { name: 'Aurora Theme', description: 'Northern lights dance across your interface.', type: 'THEME', rarity: 'EPIC', cost: 700, icon: '🌌' },
    { name: 'Void Theme', description: 'The absence of light. Pure darkness aesthetics.', type: 'THEME', rarity: 'LEGENDARY', cost: 1500, icon: '🕳️' },
    // Backgrounds
    { name: 'Starfield', description: 'A gentle starfield background.', type: 'BACKGROUND', rarity: 'COMMON', cost: 100, icon: '✨' },
    { name: 'Nebula Cloud', description: 'Colorful cosmic clouds drift behind you.', type: 'BACKGROUND', rarity: 'RARE', cost: 250, icon: '☁️' },
    { name: 'Digital Rain', description: 'Matrix-style code cascading.', type: 'BACKGROUND', rarity: 'EPIC', cost: 550, icon: '🌧️' },
    // Effects
    { name: 'Spark Trail', description: 'Tiny sparks follow your actions.', type: 'EFFECT', rarity: 'RARE', cost: 300, icon: '🔥' },
    { name: 'Glitch Pulse', description: 'Periodic glitch effects on your profile.', type: 'EFFECT', rarity: 'EPIC', cost: 650, icon: '📡' },
    { name: 'Cosmic Aura', description: 'An otherworldly aura surrounds your avatar.', type: 'EFFECT', rarity: 'LEGENDARY', cost: 1300, icon: '🌠' },
  ]

  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.name.toLowerCase().replace(/\s+/g, '-') },
      update: item,
      create: { id: item.name.toLowerCase().replace(/\s+/g, '-'), ...item },
    })
  }
  console.log(`Seeded ${items.length} shop items`)

  // Seed achievements
  const achievements = [
    { key: 'FIRST_QUEST', name: 'First Steps', description: 'Complete your first quest.', icon: '🌟', rarity: 'COMMON', xpReward: 25, goldReward: 10 },
    { key: 'QUEST_10', name: 'Adventurer', description: 'Complete 10 quests.', icon: '⚔️', rarity: 'COMMON', xpReward: 50, goldReward: 25 },
    { key: 'QUEST_25', name: 'Veteran', description: 'Complete 25 quests.', icon: '🛡️', rarity: 'RARE', xpReward: 100, goldReward: 50 },
    { key: 'QUEST_50', name: 'Champion', description: 'Complete 50 quests.', icon: '🏆', rarity: 'RARE', xpReward: 200, goldReward: 100 },
    { key: 'QUEST_100', name: 'Century', description: 'Complete 100 quests.', icon: '💯', rarity: 'EPIC', xpReward: 500, goldReward: 250 },
    { key: 'STREAK_3', name: 'Consistent', description: 'Maintain a 3-day streak.', icon: '🔥', rarity: 'COMMON', xpReward: 30, goldReward: 15 },
    { key: 'STREAK_7', name: '7 Day Warrior', description: 'Maintain a 7-day streak.', icon: '⚡', rarity: 'RARE', xpReward: 75, goldReward: 40 },
    { key: 'STREAK_14', name: 'Unstoppable', description: 'Maintain a 14-day streak.', icon: '💪', rarity: 'RARE', xpReward: 150, goldReward: 75 },
    { key: 'STREAK_30', name: 'Iron Will', description: 'Maintain a 30-day streak.', icon: '🗡️', rarity: 'EPIC', xpReward: 300, goldReward: 150 },
    { key: 'LEVEL_5', name: 'Rising Star', description: 'Reach level 5.', icon: '⭐', rarity: 'COMMON', xpReward: 50, goldReward: 25 },
    { key: 'LEVEL_10', name: 'Elite Operator', description: 'Reach level 10.', icon: '🌠', rarity: 'RARE', xpReward: 100, goldReward: 50 },
    { key: 'LEVEL_25', name: 'Legendary', description: 'Reach level 25.', icon: '👑', rarity: 'EPIC', xpReward: 500, goldReward: 250 },
    { key: 'GOLD_500', name: 'Merchant', description: 'Accumulate 500 gold.', icon: '💰', rarity: 'COMMON', xpReward: 25, goldReward: 0 },
    { key: 'GOLD_2000', name: 'Tycoon', description: 'Accumulate 2000 gold.', icon: '🏦', rarity: 'RARE', xpReward: 50, goldReward: 0 },
    { key: 'ATTR_10', name: 'Specialist', description: 'Reach 10 in any attribute.', icon: '📈', rarity: 'RARE', xpReward: 75, goldReward: 30 },
    { key: 'ATTR_25', name: 'Master', description: 'Reach 25 in any attribute.', icon: '🎓', rarity: 'EPIC', xpReward: 200, goldReward: 100 },
    { key: 'ALL_ATTR_5', name: 'Well-Rounded', description: 'Reach 5 in all attributes.', icon: '🎯', rarity: 'RARE', xpReward: 100, goldReward: 50 },
    { key: 'FIRST_PURCHASE', name: 'Collector', description: 'Buy your first item from the shop.', icon: '🛒', rarity: 'COMMON', xpReward: 25, goldReward: 0 },
    { key: 'KNOWLEDGE_SEEKER', name: 'Knowledge Seeker', description: 'Complete 10 INTELLECT quests.', icon: '📚', rarity: 'RARE', xpReward: 75, goldReward: 35 },
    { key: 'IRON_BODY', name: 'Iron Body', description: 'Complete 10 STRENGTH quests.', icon: '💪', rarity: 'RARE', xpReward: 75, goldReward: 35 },
  ]

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: ach,
      create: ach,
    })
  }
  console.log(`Seeded ${achievements.length} achievements`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
