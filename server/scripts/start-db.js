const path = require('path');
const fs = require('fs');
const EmbeddedPostgres = require('embedded-postgres').default;

const dbDir = path.resolve(__dirname, '../../.postgres-data');

const pg = new EmbeddedPostgres({
  databaseDir: dbDir,
  port: 5432,
  user: 'postgres',
  password: 'password',
  persistent: true,
  authMethod: 'password',
});

async function main() {
  console.log('[PostgreSQL] Initializing local database at:', dbDir);
  const isInit = fs.existsSync(path.join(dbDir, 'PG_VERSION'));
  if (!isInit) {
    console.log('[PostgreSQL] Initializing cluster via initdb...');
    await pg.initialise();
    console.log('[PostgreSQL] Initialization complete.');
  }

  console.log('[PostgreSQL] Starting PostgreSQL server on port 5432...');
  await pg.start();
  console.log('[PostgreSQL] PostgreSQL is RUNNING on port 5432.');

  try {
    console.log('[PostgreSQL] Ensuring "careeros" database exists...');
    await pg.createDatabase('careeros');
    console.log('[PostgreSQL] Database "careeros" created.');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('[PostgreSQL] Database "careeros" already exists.');
    } else {
      console.log('[PostgreSQL] Notice during createDatabase:', err.message);
    }
  }

  console.log('[PostgreSQL] Ready for connections at postgresql://postgres:password@localhost:5432/careeros?schema=public');
}

main().catch((err) => {
  console.error('[PostgreSQL] Fatal error:', err);
  process.exit(1);
});
