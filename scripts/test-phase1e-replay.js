const { Client } = require('pg');
const { execSync } = require('child_process');

async function testPhase1eReplay() {
  console.log('Connecting to postgres to create careeros_phase1e_test...');
  const client = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
  });
  await client.connect();

  await client.query('DROP DATABASE IF EXISTS careeros_phase1e_test');
  await client.query('CREATE DATABASE careeros_phase1e_test');
  await client.end();
  console.log('Database careeros_phase1e_test created.');

  const testDbUrl = 'postgresql://postgres:password@localhost:5432/careeros_phase1e_test?schema=public';

  console.log('\n--- Step 1: prisma migrate deploy (baseline + phase1e) ---');
  const deployOut = execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    encoding: 'utf8',
  });
  console.log(deployOut);

  console.log('--- Step 2: prisma migrate status check ---');
  const statusOut = execSync('npx prisma migrate status', {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    encoding: 'utf8',
  });
  console.log(statusOut);

  console.log('--- Step 3: Schema drift diff check against datamodel ---');
  const diffOut = execSync(`npx prisma migrate diff --from-url "${testDbUrl}" --to-schema-datamodel prisma/schema.prisma --script`, {
    encoding: 'utf8',
  });
  console.log(diffOut);

  console.log('--- Step 4: Seed clean migrated DB ---');
  const seedOut = execSync('node prisma/seed.js', {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    encoding: 'utf8',
  });
  console.log(seedOut);

  console.log('🎉 PHASE 1E CLEAN REPLAY & SEED: 100% PASS!');
}

testPhase1eReplay().catch(err => {
  console.error('Phase 1E clean replay failed:\n', err.stdout || err.message);
  process.exit(1);
});
