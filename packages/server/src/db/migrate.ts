import { fileURLToPath, pathToFileURL } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { env } from '../env.ts';
import { connect, type Db } from './client.ts';

const migrationsFolder = fileURLToPath(new URL('../../migrations', import.meta.url));

export async function runMigrations(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { db, pool } = connect(env.DATABASE_URL);
  await runMigrations(db);
  await pool.end();
  console.log('migrations applied');
}
