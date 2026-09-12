const { PrismaClient } = require('@prisma/client');
const globalForPrisma = globalThis;
const prisma = new Proxy({}, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient();
    }
    const val = globalForPrisma.prisma[prop];
    if (typeof val === 'function') {
      return val.bind(globalForPrisma.prisma);
    }
    return val;
  }
});
async function main() {
  try {
    const u = await prisma.user.findFirst();
    console.log('SUCCESS');
    process.exit(0);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
}
main();
