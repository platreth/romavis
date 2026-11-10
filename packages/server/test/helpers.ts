import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { buildApp } from '../src/app.ts';
import { TestClock } from '../src/clock.ts';
import { connect, type Db } from '../src/db/client.ts';
import { runMigrations } from '../src/db/migrate.ts';
import { createWorld } from '../src/world.ts';

const BASE = process.env.DATABASE_URL ?? 'postgres://romavis:romavis@localhost:5433/romavis';
const TEST_DB = 'romavis_test';

export interface Harness {
  db: Db;
  pool: pg.Pool;
  clock: TestClock;
  app: FastifyInstance;
  /** Simulates a server restart: a brand new app and scheduler on the same database. */
  restart(): Promise<void>;
  close(): Promise<void>;
}

export async function setupDatabase(): Promise<{ db: Db; pool: pg.Pool }> {
  const admin = new pg.Client({ connectionString: BASE });
  await admin.connect();
  const exists = await admin.query('select 1 from pg_database where datname = $1', [TEST_DB]);
  if (exists.rowCount === 0) await admin.query(`create database ${TEST_DB}`);
  // Tests do not need durability; without this every commit waits on a disk sync.
  await admin.query(`alter database ${TEST_DB} set synchronous_commit = off`);
  await admin.end();
  const url = new URL(BASE);
  url.pathname = `/${TEST_DB}`;
  const conn = connect(url.toString());
  await runMigrations(conn.db);
  return conn;
}

export async function harness(conn: { db: Db; pool: pg.Pool }, opts: { speed?: number; origins?: Set<string> } = {}): Promise<Harness> {
  const { db, pool } = conn;
  // DELETE rather than TRUNCATE: truncate forces a file sync per table, which can take seconds.
  for (const table of ['reports', 'native_relations', 'movements', 'unit_stacks', 'recruit_orders', 'build_orders', 'game_events',
    'cities', 'sites', 'landmasses', 'players', 'sessions', 'users', 'worlds']) {
    await db.execute(sql.raw(`delete from ${table}`));
  }
  const clock = new TestClock();
  await createWorld(db, clock, { slug: 'test', seed: 42, speed: opts.speed ?? 1 });
  const make = async () => (await buildApp({ db, clock, rateLimit: false, allowedOrigins: opts.origins })).app;
  const h: Harness = {
    db, pool, clock, app: await make(),
    async restart() {
      await h.app.close();
      h.app = await make();
    },
    async close() {
      await h.app.close();
    },
  };
  return h;
}

export interface Session { cookie: string; cityId: number }

export async function signup(h: Harness, username: string): Promise<Session> {
  const res = await h.app.inject({
    method: 'POST', url: '/api/auth/register',
    payload: { username, email: `${username}@example.test`, password: 'correct horse battery' },
  });
  if (res.statusCode !== 200) throw new Error(`register failed: ${res.body}`);
  const cookie = String(res.headers['set-cookie']).split(';')[0]!;
  const join = await h.app.inject({ method: 'POST', url: '/api/world/join', headers: { cookie } });
  if (join.statusCode !== 200) throw new Error(`join failed: ${join.body}`);
  return { cookie, cityId: join.json().player.cityIds[0] };
}

export const api = (h: Harness, s: { cookie: string }) => ({
  city: async (id: number) => (await h.app.inject({ url: `/api/cities/${id}`, headers: { cookie: s.cookie } })),
  build: async (id: number, building: string) =>
    h.app.inject({ method: 'POST', url: `/api/cities/${id}/build`, headers: { cookie: s.cookie }, payload: { building } }),
  cancel: async (id: number, orderId: number) =>
    h.app.inject({ method: 'DELETE', url: `/api/cities/${id}/build/${orderId}`, headers: { cookie: s.cookie } }),
});
