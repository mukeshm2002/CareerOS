const { Client } = require('pg');
const { execSync } = require('child_process');

async function testBaselineReplay() {
  console.log('Connecting to postgres to create careeros_baseline_test...');
  const client = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
  });
  await client.connect();

  await client.query('DROP DATABASE IF EXISTS careeros_baseline_test');
  await client.query('CREATE DATABASE careeros_baseline_test');
  await client.end();
  console.log('Database careeros_baseline_test created.');

  const testDbUrl = 'postgresql://postgres:password@localhost:5432/careeros_baseline_test?schema=public';

  try {
    console.log('\n--- Running prisma migrate deploy against careeros_baseline_test ---');
    const deployOutput = execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      encoding: 'utf8',
    });
    console.log(deployOutput);

    console.log('--- Running prisma migrate status against careeros_baseline_test ---');
    const statusOutput = execSync('npx prisma migrate status', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      encoding: 'utf8',
    });
    console.log(statusOutput);

    console.log('🎉 First proof: Clean baseline replay successful!');
  } catch (err) {
    console.error('Replay failed:\n', err.stdout || err.message);
    process.exit(1);
  }
}

testBaselineReplay();
