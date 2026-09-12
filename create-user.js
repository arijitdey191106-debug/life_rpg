const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    await prisma.user.upsert({
      where: { username: 'testuser' },
      update: { passwordHash: hash },
      create: {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: hash
      }
    });
    console.log('User created!');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
