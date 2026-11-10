import { buildApp } from './app.ts';
import { systemClock } from './clock.ts';
import { connect } from './db/client.ts';
import { runMigrations } from './db/migrate.ts';
import { allowedOrigins, env } from './env.ts';

const { db, pool } = connect(env.DATABASE_URL);
await runMigrations(db);
const { app, scheduler } = await buildApp({
  db, clock: systemClock, allowedOrigins, secureCookies: env.NODE_ENV === 'production',
});
await app.listen({ port: env.PORT, host: env.HOST });
scheduler.start();
console.log(`romavis server on http://${env.HOST}:${env.PORT}`);

const shutdown = async () => {
  scheduler.stop();
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
