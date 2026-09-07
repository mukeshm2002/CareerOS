const { Client } = require('pg');
const { execSync } = require('child_process');

async function recreateDevDb() {
  console.log('Connecting to postgres to recreate careeros dev database...');
  const client = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
  });
  await client.connect();

  // Terminate any active connections to careeros
  await client.query(`
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = 'careeros'
      AND pid <> pg_backend_pid();
  `);

  await client.query('DROP DATABASE IF EXISTS careeros');
  await client.query('CREATE DATABASE careeros');
  await client.end();
  console.log('Database careeros recreated.');

  console.log('\n--- Running prisma migrate deploy against careeros ---');
  const deployOut = execSync('npx prisma migrate deploy', { encoding: 'utf8' });
  console.log(deployOut);

  console.log('--- Running prisma migrate status against careeros ---');
  const statusOut = execSync('npx prisma migrate status', { encoding: 'utf8' });
  console.log(statusOut);

  console.log('--- Seeding careeros with demo user and data ---');
  const seedOut = execSync('node prisma/seed.js', { encoding: 'utf8' });
  console.log(seedOut);

  console.log('🎉 Development DB transition complete!');
}

recreateDevDb().catch((err) => {
  console.error('Failed to recreate dev db:\n', err.stdout || err.message);
  process.exit(1);
});
