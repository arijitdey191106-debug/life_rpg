import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const items = [
  // TOPS
  { name: 'Starter T-Shirt', description: 'Basic comfortable tee.', type: 'TOP', rarity: 'COMMON', cost: 0, unlockLevel: 1 },
  { name: 'Explorer Jacket', description: 'Sturdy leather for the adventurous.', type: 'TOP', rarity: 'COMMON', cost: 300, unlockLevel: 3 },
  { name: 'Cyber Jacket', description: 'High-tech armor with neon highlights.', type: 'TOP', rarity: 'RARE', cost: 800, unlockLevel: 5 },
  { name: 'Scholar Robe', description: 'Robes for the intellectually gifted.', type: 'TOP', rarity: 'COMMON', cost: 500, unlockLevel: 8 },
  { name: 'Arena Chestplate', description: 'Lightweight gear for combat.', type: 'TOP', rarity: 'EPIC', cost: 1500, unlockLevel: 10 },
  { name: 'Void Top', description: 'Woven from dark matter.', type: 'TOP', rarity: 'LEGENDARY', cost: 3000, unlockLevel: 15 },
  
  // BOTTOMS
  { name: 'Jeans', description: 'Standard blue jeans.', type: 'BOTTOM', rarity: 'COMMON', cost: 0, unlockLevel: 1 },
  { name: 'Cargo Pants', description: 'Lots of pockets.', type: 'BOTTOM', rarity: 'COMMON', cost: 200, unlockLevel: 3 },
  { name: 'Cyber Pants', description: 'Neon-laced trousers.', type: 'BOTTOM', rarity: 'RARE', cost: 700, unlockLevel: 5 },
  { name: 'Arena Shorts', description: 'Maximum mobility.', type: 'BOTTOM', rarity: 'EPIC', cost: 1200, unlockLevel: 10 },
  
  // HATS
  { name: 'Cap', description: 'A standard baseball cap.', type: 'HAT', rarity: 'COMMON', cost: 150, unlockLevel: 2 },
  { name: 'Cyber Visor', description: 'Augmented reality visor.', type: 'HAT', rarity: 'RARE', cost: 600, unlockLevel: 5 },
  { name: 'Wizard Hat', description: 'For scholars.', type: 'HAT', rarity: 'EPIC', cost: 1000, unlockLevel: 8 },
  
  // HAIR
  { name: 'Short Hair', description: 'Neat and tidy.', type: 'HAIR', rarity: 'COMMON', cost: 0, unlockLevel: 1 },
  { name: 'Wild Hair', description: 'Untamed and fierce.', type: 'HAIR', rarity: 'COMMON', cost: 100, unlockLevel: 1 },
  { name: 'Cyber Hair', description: 'Spiky neon hair.', type: 'HAIR', rarity: 'RARE', cost: 400, unlockLevel: 5 },
  
  // SHOES
  { name: 'Sneakers', description: 'Comfortable kicks.', type: 'SHOES', rarity: 'COMMON', cost: 0, unlockLevel: 1 },
  { name: 'Leather Boots', description: 'Reliable footwear.', type: 'SHOES', rarity: 'COMMON', cost: 200, unlockLevel: 3 },
  { name: 'Cyber Boots', description: 'Propulsion boots.', type: 'SHOES', rarity: 'RARE', cost: 600, unlockLevel: 5 }
]

async function main() {
  console.log('Seeding new cosmetics economy...')
  for (const item of items) {
    const id = item.name.toLowerCase().replace(/\s+/g, '-')
    const desc = `${item.description} [UNLOCK_LEVEL:${item.unlockLevel}]`
    
    await prisma.item.upsert({
      where: { id },
      update: { cost: item.cost, type: item.type, description: desc },
      create: { id, name: item.name, description: desc, type: item.type, rarity: item.rarity, cost: item.cost, icon: '👕' },
    })
  }
  
  // Give starter items to everyone so they aren't naked
  const users = await prisma.user.findMany()
  const starters = ["starter-t-shirt", "jeans", "short-hair", "sneakers"]
  for (const user of users) {
    for (const starter of starters) {
      await prisma.userItem.upsert({
        where: { userId_itemId: { userId: user.id, itemId: starter } },
        update: {},
        create: { userId: user.id, itemId: starter, equipped: true }
      })
    }
  }

  console.log('Done.')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
