const { Client } = require('pg');
const { execSync } = require('child_process');

async function testReplay() {
  console.log('Connecting to postgres to create careeros_migration_test...');
  const client = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
  });
  await client.connect();

  await client.query('DROP DATABASE IF EXISTS careeros_migration_test');
  await client.query('CREATE DATABASE careeros_migration_test');
  await client.end();
  console.log('Database careeros_migration_test created.');

  const testDbUrl = 'postgresql://postgres:password@localhost:5432/careeros_migration_test?schema=public';

  try {
    console.log('Running prisma migrate deploy against careeros_migration_test...');
    const output = execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      encoding: 'utf8',
    });
    console.log('Output:\n', output);
    console.log('Replay successful!');
  } catch (err) {
    console.error('Replay failed:\n', err.stdout || err.message);
  }
}

testReplay();
