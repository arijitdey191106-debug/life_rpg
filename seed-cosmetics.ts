import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const items = [
  { name: 'Explorer Outfit', description: 'Sturdy leather for the adventurous.', type: 'OUTFIT', rarity: 'COMMON', cost: 0 },
  { name: 'Cyber Outfit', description: 'High-tech armor with neon highlights.', type: 'OUTFIT', rarity: 'RARE', cost: 0 },
  { name: 'Scholar Outfit', description: 'Robes for the intellectually gifted.', type: 'OUTFIT', rarity: 'COMMON', cost: 0 },
  { name: 'Arena Outfit', description: 'Lightweight gear for gladiatorial combat.', type: 'OUTFIT', rarity: 'EPIC', cost: 0 },
  { name: 'Void Outfit', description: 'Woven from the dark matter of the universe.', type: 'OUTFIT', rarity: 'LEGENDARY', cost: 0 },
  { name: 'Legendary Outfit', description: 'Gold plated armor of the ancients.', type: 'OUTFIT', rarity: 'LEGENDARY', cost: 0 },
  { name: 'Mythic Outfit', description: 'A pulsing aura of raw power.', type: 'OUTFIT', rarity: 'LEGENDARY', cost: 0 },
  
  { name: 'Cyber Hair', description: 'Spiky neon hair.', type: 'HAIR', rarity: 'RARE', cost: 0 },
  { name: 'Scholar Hair', description: 'Neat and tidy.', type: 'HAIR', rarity: 'COMMON', cost: 0 },
  { name: 'Wild Hair', description: 'Untamed and fierce.', type: 'HAIR', rarity: 'COMMON', cost: 0 },
  { name: 'Void Hair', description: 'Wavy dark matter.', type: 'HAIR', rarity: 'EPIC', cost: 0 },
  
  { name: 'Cyber Boots', description: 'Propulsion boots.', type: 'SHOES', rarity: 'RARE', cost: 0 },
  { name: 'Leather Boots', description: 'Reliable footwear.', type: 'SHOES', rarity: 'COMMON', cost: 0 },
  
  { name: 'Sword', description: 'A sharp blade.', type: 'ACCESSORY', rarity: 'RARE', cost: 0 },
  { name: 'Shield', description: 'A sturdy shield.', type: 'ACCESSORY', rarity: 'RARE', cost: 0 },
  { name: 'Book', description: 'A tome of knowledge.', type: 'ACCESSORY', rarity: 'COMMON', cost: 0 }
]

async function main() {
  console.log("Seeding cosmetics...")
  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.name.toLowerCase().replace(/\s+/g, '-') },
      update: item,
      create: { id: item.name.toLowerCase().replace(/\s+/g, '-'), icon: "👕", ...item },
    })
  }
  
  // Grant all items to user ID 1 or all users so we can see them
  const users = await prisma.user.findMany()
  for (const user of users) {
    for (const item of items) {
      await prisma.userItem.upsert({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId: item.name.toLowerCase().replace(/\s+/g, '-')
          }
        },
        update: {},
        create: {
          userId: user.id,
          itemId: item.name.toLowerCase().replace(/\s+/g, '-'),
          equipped: false
        }
      })
    }
  }

  console.log("Cosmetics seeded and granted to users.")
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
