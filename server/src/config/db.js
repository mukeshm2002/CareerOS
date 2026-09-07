const { PrismaClient } = require('@prisma/client');
const config = require('./index');

let prisma;

try {
  prisma = new PrismaClient({
    log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });
} catch (error) {
  console.warn('[Prisma] Client initialization warning:', error.message);
  prisma = null;
}

module.exports = prisma;
