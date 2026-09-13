const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst();
  console.log('User XP before:', user.xp);
  console.log('User Gold before:', user.gold);
  
  const quest = await prisma.quest.create({
    data: {
      userId: user.id,
      title: 'Test Quest',
      description: 'Test',
      category: 'INTELLECT',
      difficulty: 'EASY',
      duration: null,
      xpReward: 50,
      goldReward: 25,
      status: 'PENDING',
      type: 'PERSONAL',
      dueDate: null,
      isRecurring: false,
      recurringInterval: null
    }
  });
  
  console.log('Created quest with xpReward:', quest.xpReward, 'goldReward:', quest.goldReward);

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      let transactionSourceId = quest.id;
      await tx.rewardTransaction.create({
        data: { 
          userId: quest.userId, 
          sourceId: transactionSourceId, 
          sourceType: 'QUEST', 
          xpGranted: quest.xpReward, 
          goldGranted: quest.goldReward 
        }
      });

      await tx.quest.update({
        where: { id: quest.id },
        data: { status: 'CLAIMED', completedAt: new Date() }
      });

      const categoryAttr = quest.category.toLowerCase();

      const updated = await tx.user.update({
        where: { id: quest.userId },
        data: {
          xp: { increment: quest.xpReward },
          gold: { increment: quest.goldReward },
          [categoryAttr]: { increment: 1 }
        }
      });
      return updated;
    });

    console.log('User XP after:', updatedUser.xp);
    console.log('User Gold after:', updatedUser.gold);
  } catch (e) {
    console.error(e);
  }
}
test();
