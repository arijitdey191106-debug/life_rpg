const { PrismaClient } = require('@prisma/client');
const globalForPrisma = globalThis;
const prisma = new Proxy({}, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient();
    }
    return globalForPrisma.prisma[prop];
  }
});
async function main() {
  try {
    const u = await prisma.user.findFirst();
    console.log('SUCCESS WITHOUT BIND');
    process.exit(0);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
}
main();
