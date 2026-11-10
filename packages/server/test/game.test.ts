import { eq, sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { START_RESOURCES, buildTimeSeconds, buildingCost, distance, productionPerHour } from '@romavis/shared';
import { cities, landmasses, sites, users, worlds } from '../src/db/schema.ts';
import { joinWorld } from '../src/world.ts';
import { api, harness, setupDatabase, signup, type Harness } from './helpers.ts';

let conn: Awaited<ReturnType<typeof setupDatabase>>;
let h: Harness;

beforeAll(async () => { conn = await setupDatabase(); });
afterAll(async () => { await conn.pool.end(); });
beforeEach(async () => { h = await harness(conn); });
afterEach(async () => { await h.close(); });

describe('accounts', () => {
  it('registers, identifies, logs out and logs back in', async () => {
    const s = await signup(h, 'marcus');
    const me = await h.app.inject({ url: '/api/auth/me', headers: { cookie: s.cookie } });
    expect(me.json().user.username).toBe('marcus');
    expect(me.body).not.toContain('password');

    await h.app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie: s.cookie } });
    expect((await h.app.inject({ url: '/api/auth/me', headers: { cookie: s.cookie } })).statusCode).toBe(401);

    const bad = await h.app.inject({ method: 'POST', url: '/api/auth/login', payload: { identifier: 'marcus', password: 'wrong' } });
    expect(bad.statusCode).toBe(401);
    const good = await h.app.inject({ method: 'POST', url: '/api/auth/login', payload: { identifier: 'MARCUS@example.test', password: 'correct horse battery' } });
    expect(good.statusCode).toBe(200);
  });

  it('rejects duplicates and invalid input', async () => {
    await signup(h, 'julia');
    const dupe = await h.app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'JULIA', email: 'other@example.test', password: 'long enough pw' } });
    expect(dupe.json()).toEqual({ error: 'username_taken' });
    const email = await h.app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'julia2', email: 'julia@example.test', password: 'long enough pw' } });
    expect(email.json()).toEqual({ error: 'email_taken' });
    for (const payload of [{ username: 'x', email: 'a@b.test', password: 'long enough pw' }, { username: 'okname', email: 'nope', password: 'long enough pw' }, { username: 'okname', email: 'a@b.test', password: 'short' }, {}]) {
      const r = await h.app.inject({ method: 'POST', url: '/api/auth/register', payload });
      expect(r.statusCode).toBe(400);
    }
  });

  it('requires a session for game routes', async () => {
    for (const url of ['/api/world', '/api/world/rings/0', '/api/cities/1']) {
      expect((await h.app.inject({ url })).statusCode).toBe(401);
    }
  });

  it('refuses state-changing requests from foreign origins', async () => {
    await h.close();
    h = await harness(conn, { origins: new Set(['http://localhost:5173']) });
    const payload = { username: 'origin', email: 'o@example.test', password: 'long enough pw' };
    const bad = await h.app.inject({ method: 'POST', url: '/api/auth/register', payload, headers: { origin: 'https://evil.example' } });
    expect(bad.statusCode).toBe(403);
    const ok = await h.app.inject({ method: 'POST', url: '/api/auth/register', payload, headers: { origin: 'http://localhost:5173' } });
    expect(ok.statusCode).toBe(200);
  });
});

describe('joining the world', () => {
  it('places the first two players on the same landmass, on different sites', async () => {
    const a = await signup(h, 'aaa');
    const b = await signup(h, 'bbb');
    const rows = await h.db.select({ id: cities.id, siteId: cities.siteId, landmassId: sites.landmassId, x: sites.x, y: sites.y })
      .from(cities).innerJoin(sites, eq(sites.id, cities.siteId));
    const ca = rows.find((r) => r.id === a.cityId)!;
    const cb = rows.find((r) => r.id === b.cityId)!;
    expect(ca.siteId).not.toBe(cb.siteId);
    expect(ca.landmassId).toBe(cb.landmassId);
    expect(distance(ca, cb)).toBeGreaterThanOrEqual(2);
  });

  it('refuses a second join and exposes the map', async () => {
    const a = await signup(h, 'aaa');
    const again = await h.app.inject({ method: 'POST', url: '/api/world/join', headers: { cookie: a.cookie } });
    expect(again.json()).toEqual({ error: 'already_joined' });
    const ring = (await h.app.inject({ url: '/api/world/rings/1', headers: { cookie: a.cookie } })).json();
    expect(ring.landmasses.length).toBeGreaterThan(5);
    const owned = (await h.app.inject({ url: '/api/world/rings/0/cities', headers: { cookie: a.cookie } })).json();
    expect(owned.cities).toEqual([expect.objectContaining({ cityId: a.cityId, playerName: 'aaa', points: 6 })]);
  });

  it('never double-books a site under concurrent joins and grows when crowded', async () => {
    const [world] = await h.db.select().from(worlds);
    const before = await h.db.select({ n: sql<number>`count(*)::int` }).from(landmasses);
    const made = await h.db.insert(users).values(Array.from({ length: 90 }, (_, i) => ({
      username: `u${i}`, email: `u${i}@example.test`, passwordHash: 'x', createdAt: h.clock.now(),
    }))).returning();
    for (let i = 0; i < made.length; i += 10) {
      await Promise.all(made.slice(i, i + 10).map((u) => joinWorld(h.db, h.clock, u, world!.id)));
    }
    const all = await h.db.select({ siteId: cities.siteId }).from(cities);
    expect(new Set(all.map((c) => c.siteId)).size).toBe(90);
    const after = await h.db.select({ n: sql<number>`count(*)::int` }).from(landmasses);
    expect(after[0]!.n).toBeGreaterThan(before[0]!.n);
    expect((await h.db.select().from(worlds))[0]!.ringsGenerated).toBe(3);
  });
});

describe('build queue', () => {
  it('deducts the cost, completes on time and accrues production', async () => {
    const s = await signup(h, 'builder');
    const a = api(h, s);
    const res = await a.build(s.cityId, 'forum');
    expect(res.statusCode).toBe(200);
    const cost = buildingCost('forum', 2);
    const city = res.json().city;
    expect(city.timber).toBe(START_RESOURCES.timber - cost.timber);
    const seconds = buildTimeSeconds('forum', 2, 1, 1);
    expect(city.queue).toEqual([expect.objectContaining({ building: 'forum', targetLevel: 2, dueAt: h.clock.now().getTime() + seconds * 1000 })]);

    h.clock.advance(seconds * 1000 - 1);
    expect((await a.city(s.cityId)).json().city.levels.forum).toBe(1);
    h.clock.advance(1);
    const done = (await a.city(s.cityId)).json().city;
    expect(done.levels.forum).toBe(2);
    expect(done.queue).toEqual([]);
    expect(done.timber).toBe(START_RESOURCES.timber - cost.timber + Math.floor(productionPerHour(1, 1) * seconds / 3600));
  });

  it('runs orders one after another at their own times, even after long downtime', async () => {
    const s = await signup(h, 'chain');
    const a = api(h, s);
    const t0 = h.clock.now().getTime();
    for (const b of ['forum', 'lignarium', 'horreum']) expect((await a.build(s.cityId, b)).statusCode).toBe(200);
    expect((await a.build(s.cityId, 'fundus')).json()).toEqual({ error: 'queue_full' });

    const t1 = buildTimeSeconds('forum', 2, 1, 1);
    const t2 = buildTimeSeconds('lignarium', 2, 2, 1); // Forum is level 2 by the time this starts.
    const t3 = buildTimeSeconds('horreum', 2, 2, 1);
    h.clock.advance(86_400_000);
    const city = (await a.city(s.cityId)).json().city;
    expect(city.levels).toMatchObject({ forum: 2, lignarium: 2, horreum: 2 });
    const events = await h.db.execute<{ due_at: Date }>(sql`select due_at from game_events order by id`);
    expect(events.rows.map((e) => new Date(e.due_at).getTime() - t0)).toEqual([t1 * 1000, (t1 + t2) * 1000, (t1 + t2 + t3) * 1000]);
  });

  it('loses nothing across a server restart', async () => {
    const s = await signup(h, 'restart');
    await api(h, s).build(s.cityId, 'forum');
    await api(h, s).build(s.cityId, 'ferraria');
    await h.restart();
    h.clock.advance(3_600_000);
    const city = (await api(h, s).city(s.cityId)).json().city;
    expect(city.levels).toMatchObject({ forum: 2, ferraria: 2 });
    expect(city.queue).toEqual([]);
  });

  it('refunds a cancelled order and starts the next one', async () => {
    const s = await signup(h, 'cancel');
    const a = api(h, s);
    await a.build(s.cityId, 'forum');
    const queued = (await a.build(s.cityId, 'horreum')).json().city;
    h.clock.advance(10_000);
    const after = (await a.cancel(s.cityId, queued.queue[0].id)).json().city;
    const horreum = buildingCost('horreum', 2);
    expect(after.timber).toBe(START_RESOURCES.timber - horreum.timber + Math.floor(productionPerHour(1, 1) * 10 / 3600));
    expect(after.queue).toEqual([expect.objectContaining({ building: 'horreum', startedAt: h.clock.now().getTime() })]);

    h.clock.advance(3_600_000);
    const done = (await a.city(s.cityId)).json().city;
    expect(done.levels).toMatchObject({ forum: 1, horreum: 2 });
  });

  it('refuses to cancel an order a later one depends on', async () => {
    const s = await signup(h, 'deps');
    const a = api(h, s);
    await a.build(s.cityId, 'lignarium');
    const city = (await a.build(s.cityId, 'lignarium')).json().city;
    expect(city.queue.map((q: { targetLevel: number }) => q.targetLevel)).toEqual([2, 3]);
    expect((await a.cancel(s.cityId, city.queue[0].id)).json()).toEqual({ error: 'order_has_dependents' });
    expect((await a.cancel(s.cityId, city.queue[1].id)).statusCode).toBe(200);
    expect((await a.cancel(s.cityId, 999999)).statusCode).toBe(404);
  });

  it('cannot double-spend under concurrent requests', async () => {
    const s = await signup(h, 'racer');
    const a = api(h, s);
    const results = await Promise.all(Array.from({ length: 8 }, () => a.build(s.cityId, 'lignarium')));
    const ok = results.filter((r) => r.statusCode === 200).length;
    const city = (await a.city(s.cityId)).json().city;
    expect(city.queue.length).toBe(ok);
    expect(ok).toBeGreaterThan(0);
    expect(ok).toBeLessThanOrEqual(3);
    let spent = 0;
    for (const q of city.queue) spent += buildingCost('lignarium', q.targetLevel).timber;
    expect(city.timber).toBe(START_RESOURCES.timber - spent);
    expect(Math.min(city.timber, city.stone, city.iron)).toBeGreaterThanOrEqual(0);
    expect(new Set(city.queue.map((q: { targetLevel: number }) => q.targetLevel)).size).toBe(ok);
  });

  it('rejects unaffordable, unknown and unavailable buildings, and other players’ cities', async () => {
    const s = await signup(h, 'owner');
    const other = await signup(h, 'thief');
    const a = api(h, s);
    expect((await a.build(s.cityId, 'colosseum')).json()).toEqual({ error: 'unknown_building' });
    expect((await a.build(s.cityId, 'castra')).json()).toEqual({ error: 'not_available' });
    await h.db.update(cities).set({ timber: 0 }).where(eq(cities.id, s.cityId));
    await h.db.update(cities).set({ resourcesAt: h.clock.now() }).where(eq(cities.id, s.cityId));
    expect((await a.build(s.cityId, 'forum')).json()).toEqual({ error: 'resources' });
    expect((await api(h, other).city(s.cityId)).statusCode).toBe(404);
    expect((await api(h, other).build(s.cityId, 'forum')).statusCode).toBe(404);
  });

  it('stops accepting commands once the round is over', async () => {
    const s = await signup(h, 'late');
    h.clock.advance(29 * 86_400_000);
    expect((await api(h, s).build(s.cityId, 'forum')).json()).toEqual({ error: 'round_over' });
  });
});
