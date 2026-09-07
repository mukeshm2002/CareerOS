const { Client } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');

async function testFixAndSeed() {
  const migPath = 'prisma/migrations/20260907143000_phase1c_career_planning/migration.sql';
  const originalContent = fs.readFileSync(migPath, 'utf8');

  // Add the 3 missing column definitions that Phase 1C omitted
  let fixedContent = originalContent.replace(
    '-- AlterTable\nALTER TABLE "skills" ALTER COLUMN "normalizedName" SET NOT NULL;',
    '-- AlterTable\nALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "normalizedName" TEXT;\nUPDATE "skills" SET "normalizedName" = LOWER(TRIM("name")) WHERE "normalizedName" IS NULL;\nALTER TABLE "skills" ALTER COLUMN "normalizedName" SET NOT NULL;'
  );
  fixedContent = fixedContent.replace(
    '-- AlterTable\nALTER TABLE "schedule_blocks" ADD COLUMN IF NOT EXISTS "description" TEXT,\nALTER COLUMN "recurrence" SET DEFAULT \'NONE\';',
    '-- AlterTable\nALTER TABLE "schedule_blocks" ADD COLUMN IF NOT EXISTS "description" TEXT,\nADD COLUMN IF NOT EXISTS "taskId" TEXT,\nADD COLUMN IF NOT EXISTS "goalId" TEXT,\nALTER COLUMN "recurrence" SET DEFAULT \'NONE\';'
  );

  try {
    fs.writeFileSync(migPath, fixedContent);

    // Recreate careeros_migration_test
    const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/postgres' });
    await client.connect();
    await client.query('DROP DATABASE IF EXISTS careeros_migration_test');
    await client.query('CREATE DATABASE careeros_migration_test');
    await client.end();

    const testDbUrl = 'postgresql://postgres:password@localhost:5432/careeros_migration_test?schema=public';
    console.log('Testing migrate deploy with self-contained Phase 1C migration on clean DB...');
    const deployOut = execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      encoding: 'utf8',
    });
    console.log('Deploy Output:\n', deployOut);

    console.log('Testing seed against clean migrated DB...');
    const seedOut = execSync('node prisma/seed.js', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      encoding: 'utf8',
    });
    console.log('Seed Output:\n', seedOut);
    console.log('SUCCESS: When Phase 1C is self-contained, clean DB deploy + seed is 100% functional!');
  } catch (err) {
    console.error('Error during testFixAndSeed:', err.stdout || err.message);
  } finally {
    // ALWAYS RESTORE the original immutable content!
    fs.writeFileSync(migPath, originalContent);
    console.log('Restored original immutable Phase 1C migration file.');
  }
}

testFixAndSeed();
