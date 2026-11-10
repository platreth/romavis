// Usage: pnpm world:create <slug> [speed] [seed]
import { z } from 'zod';
import { systemClock } from '../clock.ts';
import { connect } from '../db/client.ts';
import { runMigrations } from '../db/migrate.ts';
import { env } from '../env.ts';
import { createWorld } from '../world.ts';

const args = z.tuple([
  z.string().regex(/^[a-z0-9-]{2,20}$/),
  z.coerce.number().int().min(1).max(4).default(1),
  z.coerce.number().int().default(() => Math.floor(Math.random() * 2 ** 31)),
]).safeParse([process.argv[2], process.argv[3], process.argv[4]]);
if (!args.success) {
  console.error('Usage: pnpm world:create <slug: a-z 0-9 -> [speed 1-4] [seed]');
  process.exit(1);
}
const [slug, speed, seed] = args.data;
const { db, pool } = connect(env.DATABASE_URL);
await runMigrations(db);
const world = await createWorld(db, systemClock, { slug, speed, seed });
console.log(`world "${world.slug}" created: speed ${world.speed}, seed ${world.seed}, ends ${world.endsAt.toISOString()}`);
await pool.end();
