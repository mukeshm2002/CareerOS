const { Client } = require('pg');
const { execSync } = require('child_process');

async function testFinalReleaseReplay() {
  console.log('Connecting to postgres to create careeros_release_replay...');
  const client = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
  });
  await client.connect();

  await client.query('DROP DATABASE IF EXISTS careeros_release_replay');
  await client.query('CREATE DATABASE careeros_release_replay');
  await client.end();
  console.log('Database careeros_release_replay created.');

  const testDbUrl = 'postgresql://postgres:password@localhost:5432/careeros_release_replay?schema=public';

  console.log('\n--- Step 1: prisma migrate deploy against clean DB ---');
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

  console.log('--- Step 3: seed clean migrated DB ---');
  const seedOut = execSync('node prisma/seed.js', {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    encoding: 'utf8',
  });
  console.log(seedOut);

  console.log('🎉 FINAL CLEAN RELEASE REPLAY: 100% PASS!');
}

testFinalReleaseReplay().catch(err => {
  console.error('Final clean replay failed:\n', err.stdout || err.message);
  process.exit(1);
});
