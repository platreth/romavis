import { and, desc, eq, sql } from 'drizzle-orm';
import { ROUND_DAYS, START_LEVELS, START_RESOURCES, buildingPoints, generateRing } from '@romavis/shared';
import type { User } from './auth.ts';
import type { Clock } from './clock.ts';
import type { Db, Q, Tx } from './db/client.ts';
import { cities, landmasses, players, sites, users, worlds } from './db/schema.ts';
import { GameError } from './errors.ts';

export type World = typeof worlds.$inferSelect;
export type Player = typeof players.$inferSelect;

/** Generate the next ring when fewer than this share of city sites is free. */
const FREE_SITE_THRESHOLD = 0.2;

async function insertRing(tx: Tx, world: World, ring: number): Promise<void> {
  for (const lm of generateRing(world.seed, ring)) {
    const [row] = await tx.insert(landmasses)
      .values({ worldId: world.id, ring, idx: lm.index, x: lm.x, y: lm.y, radius: lm.radius })
      .returning({ id: landmasses.id });
    await tx.insert(sites).values(lm.sites.map((s) => ({ landmassId: row!.id, kind: s.kind, slot: s.slot, x: s.x, y: s.y })));
  }
  await tx.update(worlds).set({ ringsGenerated: ring + 1 }).where(eq(worlds.id, world.id));
}

export async function createWorld(
  db: Db, clock: Clock, input: { slug: string; seed: number; speed: number; days?: number },
): Promise<World> {
  return db.transaction(async (tx) => {
    const now = clock.now();
    const [world] = await tx.insert(worlds).values({
      slug: input.slug, seed: input.seed, speed: input.speed, startsAt: now,
      endsAt: new Date(now.getTime() + (input.days ?? ROUND_DAYS) * 86_400_000 / input.speed),
    }).returning();
    await insertRing(tx, world!, 0);
    await insertRing(tx, world!, 1);
    return { ...world!, ringsGenerated: 2 };
  });
}

/** The MVP runs one world at a time: the most recent open one. */
export async function currentWorld(q: Q): Promise<World | null> {
  const [world] = await q.select().from(worlds).where(eq(worlds.status, 'open')).orderBy(desc(worlds.id)).limit(1);
  return world ?? null;
}

export async function findPlayer(q: Q, userId: number, worldId: number): Promise<Player | null> {
  const [p] = await q.select().from(players).where(and(eq(players.userId, userId), eq(players.worldId, worldId)));
  return p ?? null;
}

async function growIfCrowded(tx: Tx, world: World): Promise<void> {
  const res = await tx.execute<{ total: string; free: string }>(sql`
    select count(*) as total, count(*) filter (where c.id is null) as free
    from ${sites} s join ${landmasses} l on l.id = s.landmass_id
    left join ${cities} c on c.site_id = s.id
    where l.world_id = ${world.id} and s.kind = 'city'`);
  const { total, free } = res.rows[0]!;
  if (Number(free) < Number(total) * FREE_SITE_THRESHOLD) await insertRing(tx, world, world.ringsGenerated);
}

/** Join the world: create the player and their first city on the best free site. */
export async function joinWorld(db: Db, clock: Clock, user: User, worldId: number): Promise<{ player: Player; cityId: number }> {
  return db.transaction(async (tx) => {
    // Locking the world row serialises joins so two players never get the same site.
    const [world] = await tx.select().from(worlds).where(eq(worlds.id, worldId)).for('update');
    const now = clock.now();
    if (!world || world.status !== 'open' || now >= world.endsAt) throw new GameError('world_closed', 409);
    if (await findPlayer(tx, user.id, world.id)) throw new GameError('already_joined', 409);

    // Closest free site to the centre, preferring landmasses that already have a player.
    const pick = await tx.execute<{ id: number }>(sql`
      select s.id from ${sites} s join ${landmasses} l on l.id = s.landmass_id
      where l.world_id = ${world.id} and s.kind = 'city'
        and not exists (select 1 from ${cities} c where c.site_id = s.id)
      order by exists (
          select 1 from ${cities} c2 join ${sites} s2 on s2.id = c2.site_id
          where s2.landmass_id = l.id and c2.player_id is not null) desc,
        (l.x::bigint * l.x + l.y::bigint * l.y) asc, l.id asc, s.slot asc
      limit 1`);
    const siteId = pick.rows[0]?.id;
    if (siteId === undefined) throw new GameError('world_full', 409);

    const [player] = await tx.insert(players).values({ userId: user.id, worldId: world.id, joinedAt: now, lastSeenAt: now }).returning();
    const [city] = await tx.insert(cities).values({
      worldId: world.id, siteId, playerId: player!.id, name: user.username,
      ...START_RESOURCES, resourcesAt: now, levels: { ...START_LEVELS },
    }).returning({ id: cities.id });
    await growIfCrowded(tx, world);
    return { player: player!, cityId: city!.id };
  });
}

export async function ringMap(q: Q, worldId: number, ring: number) {
  const lms = await q.select().from(landmasses).where(and(eq(landmasses.worldId, worldId), eq(landmasses.ring, ring)));
  const ss = await q.select({ id: sites.id, landmassId: sites.landmassId, kind: sites.kind, x: sites.x, y: sites.y })
    .from(sites).innerJoin(landmasses, eq(landmasses.id, sites.landmassId))
    .where(and(eq(landmasses.worldId, worldId), eq(landmasses.ring, ring)));
  return lms.map((l) => ({
    id: l.id, ring: l.ring, x: l.x, y: l.y, radius: l.radius,
    sites: ss.filter((s) => s.landmassId === l.id).map(({ landmassId: _, ...s }) => s),
  }));
}

/** Who owns what in a ring. Public information only. */
export async function ringCities(q: Q, worldId: number, ring: number) {
  const rows = await q.select({
    cityId: cities.id, siteId: cities.siteId, name: cities.name, playerId: cities.playerId,
    playerName: users.username, levels: cities.levels,
  }).from(cities)
    .innerJoin(sites, eq(sites.id, cities.siteId))
    .innerJoin(landmasses, eq(landmasses.id, sites.landmassId))
    .leftJoin(players, eq(players.id, cities.playerId))
    .leftJoin(users, eq(users.id, players.userId))
    .where(and(eq(cities.worldId, worldId), eq(landmasses.ring, ring)));
  return rows.map(({ levels, ...r }) => ({ ...r, points: buildingPoints(levels) }));
}
