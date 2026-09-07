const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT id, checksum, migration_name, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations ORDER BY finished_at ASC'
  );
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
