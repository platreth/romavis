import { and, eq, sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  NATIVE, START_LEVELS, UNIT_DEFS, distance, productionPerHour, recruitSeconds, travelSeconds, tributeAccrued,
  type Levels, type UnitCounts,
} from '@romavis/shared';
import { cities, landmasses, nativeRelations, players, sites, unitStacks } from '../src/db/schema.ts';
import { harness, setupDatabase, signup, type Harness, type Session } from './helpers.ts';

let conn: Awaited<ReturnType<typeof setupDatabase>>;
let h: Harness;

beforeAll(async () => { conn = await setupDatabase(); });
afterAll(async () => { await conn.pool.end(); });
beforeEach(async () => { h = await harness(conn); });
afterEach(async () => { await h.close(); });

const HOUR = 3_600_000;

async function grant(cityId: number, opts: { levels?: Partial<Levels>; units?: UnitCounts; resources?: number }) {
  if (opts.levels || opts.resources !== undefined) {
    const [c] = await h.db.select().from(cities).where(eq(cities.id, cityId));
    const r = opts.resources ?? c!.timber;
    await h.db.update(cities).set({
      levels: { ...c!.levels, ...opts.levels }, timber: r, stone: r, iron: r, resourcesAt: h.clock.now(),
    }).where(eq(cities.id, cityId));
  }
  for (const [unitType, count] of Object.entries(opts.units ?? {})) {
    await h.db.insert(unitStacks).values({ homeCityId: cityId, cityId, unitType, count });
  }
}
const unprotect = () => h.db.update(players).set({ protectedUntil: null });
const call = (s: Session, method: 'GET' | 'POST', url: string, payload?: unknown) =>
  h.app.inject({ method, url, headers: { cookie: s.cookie }, payload: payload as object | undefined });
const city = async (s: Session, id = s.cityId) => (await call(s, 'GET', `/api/cities/${id}`)).json().city;
const siteOf = async (cityId: number) => {
  const [row] = await h.db.select({ site: sites }).from(cities).innerJoin(sites, eq(sites.id, cities.siteId)).where(eq(cities.id, cityId));
  return row!.site;
};
const send = (s: Session, toSiteId: number, type: string, units: UnitCounts) =>
  call(s, 'POST', '/api/movements', { fromCityId: s.cityId, toSiteId, type, units });

describe('recruitment', () => {
  it('trains a batch, charges for it and delivers it on time', async () => {
    const s = await signup(h, 'trainer');
    await grant(s.cityId, { levels: { castra: 1 }, resources: 1000 });
    const res = await call(s, 'POST', `/api/cities/${s.cityId}/recruit`, { unit: 'hastatus', count: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.json().city.timber).toBe(1000 - 5 * UNIT_DEFS.hastatus.cost.timber);
    expect(res.json().city.recruitQueue).toHaveLength(1);
    expect(res.json().city.unitPop).toBe(5);

    h.clock.advance(recruitSeconds('hastatus', 5, 1, 1) * 1000 - 1);
    expect((await city(s)).units).toEqual({});
    h.clock.advance(1);
    const done = await city(s);
    expect(done.units).toEqual({ hastatus: 5 });
    expect(done.recruitQueue).toEqual([]);
  });

  it('rejects what the city cannot train', async () => {
    const s = await signup(h, 'refused');
    const recruit = (unit: string, count: number) => call(s, 'POST', `/api/cities/${s.cityId}/recruit`, { unit, count });
    expect((await recruit('hastatus', 1)).json()).toEqual({ error: 'prerequisite' });
    await grant(s.cityId, { levels: { castra: 1 }, resources: 100 });
    expect((await recruit('elephant', 1)).json()).toEqual({ error: 'unknown_unit' });
    expect((await recruit('eques', 1)).json()).toEqual({ error: 'prerequisite' });
    expect((await recruit('hastatus', 5)).json()).toEqual({ error: 'resources' });
    expect((await recruit('hastatus', 0)).statusCode).toBe(400);
    await grant(s.cityId, { resources: 100_000 });
    expect((await recruit('hastatus', 500)).json()).toEqual({ error: 'population' });
    for (let i = 0; i < 5; i++) expect((await recruit('hastatus', 1)).statusCode).toBe(200);
    expect((await recruit('hastatus', 1)).json()).toEqual({ error: 'queue_full' });
  });
});

describe('attacks', () => {
  it('respects beginner protection, then fights, loots and brings the survivors home', async () => {
    const a = await signup(h, 'attacker');
    const d = await signup(h, 'defender');
    await grant(a.cityId, { units: { hastatus: 100 } });
    await grant(d.cityId, { units: { triarius: 10 }, resources: 1000 });
    const target = await siteOf(d.cityId);
    const home = await siteOf(a.cityId);

    expect((await send(a, target.id, 'attack', { hastatus: 100 })).json()).toEqual({ error: 'target_protected' });
    await unprotect();
    expect((await send(a, target.id, 'attack', { hastatus: 101 })).json()).toEqual({ error: 'not_enough_units' });
    expect((await send(a, home.id, 'attack', { hastatus: 1 })).json()).toEqual({ error: 'invalid_target' });
    const sent = await send(a, target.id, 'attack', { hastatus: 100 });
    expect(sent.statusCode).toBe(200);
    const seconds = travelSeconds(distance(home, target), UNIT_DEFS.hastatus.speed, 1);
    expect(sent.json().own).toEqual([expect.objectContaining({ type: 'attack', units: { hastatus: 100 }, arriveAt: h.clock.now().getTime() + seconds * 1000 })]);
    expect((await city(a)).units).toEqual({});

    // The defender sees that something is coming and when, never what.
    const incoming = (await call(d, 'GET', '/api/movements')).json().incoming;
    expect(incoming).toEqual([{ id: expect.any(Number), type: 'attack', toSiteId: target.id, cityId: d.cityId, arriveAt: expect.any(Number) }]);

    h.clock.advance(seconds * 1000);
    const afterBattle = await city(d);
    expect(afterBattle.units).toEqual({});
    expect(afterBattle.timber).toBeLessThan(1000);
    const [report] = (await call(a, 'GET', '/api/reports')).json().reports;
    expect(report).toMatchObject({ kind: 'attack', read: false, data: { attackerWins: true, attacker: 'attacker', defender: 'defender', attackers: { hastatus: 100 }, defenderLosses: { triarius: 10 } } });
    expect(Math.abs(report.data.luck)).toBeLessThanOrEqual(0.1);
    const lost = report.data.attackerLosses.hastatus ?? 0;
    expect(lost).toBeGreaterThan(0);
    expect(lost).toBeLessThan(30);
    const loot = report.data.loot;
    expect(loot.timber + loot.stone + loot.iron).toBeGreaterThan(0);
    expect(loot.timber + loot.stone + loot.iron).toBeLessThanOrEqual((100 - lost) * UNIT_DEFS.hastatus.carry);
    // The defender kept producing until the battle.
    expect(afterBattle.timber).toBe(Math.min(1200, 1000 + Math.floor(productionPerHour(1, 1) * seconds / 3600)) - loot.timber);
    expect((await call(d, 'GET', '/api/reports')).json().reports[0]).toMatchObject({ kind: 'defense', data: { attackerWins: true } });

    const back = (await call(a, 'GET', '/api/movements')).json().own;
    expect(back).toEqual([expect.objectContaining({ type: 'return', units: { hastatus: 100 - lost }, loot })]);
    const before = await city(a);
    h.clock.advance(seconds * 1000);
    const homeAgain = await city(a);
    expect(homeAgain.units).toEqual({ hastatus: 100 - lost });
    expect(homeAgain.timber).toBeGreaterThanOrEqual(Math.min(1200, before.timber + loot.timber));

    const scores = await h.db.select({ id: players.id, g: players.gloriaBattle, p: players.protectedUntil }).from(players).orderBy(players.id);
    expect(scores.map((s) => s.g)).toEqual([10, lost]);
  });

  it('a failed attack costs the attacker and leaves the city unlooted', async () => {
    const a = await signup(h, 'weak');
    const d = await signup(h, 'strong');
    await unprotect();
    await grant(a.cityId, { units: { eques: 10 } });
    await grant(d.cityId, { units: { triarius: 100 }, levels: { murus: 10 }, resources: 900 });
    await send(a, (await siteOf(d.cityId)).id, 'attack', { eques: 10 });
    h.clock.advance(24 * HOUR);
    expect((await city(d)).timber).toBeGreaterThanOrEqual(900);
    expect((await city(d)).units.triarius).toBeGreaterThan(95);
    expect((await city(a)).units).toEqual({});
    expect((await call(a, 'GET', '/api/reports')).json().reports[0].data).toMatchObject({ attackerWins: false, loot: null, attackerLosses: { eques: 10 } });
  });

  it('settles battle and return in order after long downtime', async () => {
    const a = await signup(h, 'sleepy');
    const d = await signup(h, 'victim');
    await unprotect();
    await grant(a.cityId, { units: { hastatus: 50 } });
    await send(a, (await siteOf(d.cityId)).id, 'attack', { hastatus: 50 });
    await h.restart();
    h.clock.advance(48 * HOUR);
    const home = await city(a);
    expect(home.units.hastatus).toBeGreaterThan(40);
    expect((await call(a, 'GET', '/api/movements')).json().own).toEqual([]);
  });

  it('doubles defence during the night watch, which can be set only once', async () => {
    const a = await signup(h, 'nightowl');
    const d = await signup(h, 'sleeper');
    await unprotect();
    const hour = h.clock.now().getUTCHours();
    expect((await call(d, 'POST', '/api/player/night-watch', { startHour: hour })).statusCode).toBe(200);
    expect((await call(d, 'POST', '/api/player/night-watch', { startHour: 3 })).json()).toEqual({ error: 'night_watch_set' });
    expect((await call(d, 'POST', '/api/player/night-watch', { startHour: 24 })).statusCode).toBe(400);
    await grant(a.cityId, { units: { eques: 20 } });
    await grant(d.cityId, { units: { hastatus: 30 } });
    await send(a, (await siteOf(d.cityId)).id, 'attack', { eques: 20 });
    h.clock.advance(HOUR);
    const data = (await call(a, 'GET', '/api/reports')).json().reports[0].data;
    expect(data.nightWatch).toBe(true);
    expect(data.defense).toBe(30 * 6 * 2 + 20);
  });

  it('recalls only within the window', async () => {
    const a = await signup(h, 'recaller');
    const d = await signup(h, 'target');
    await unprotect();
    await grant(a.cityId, { units: { hastatus: 20 } });
    const target = (await siteOf(d.cityId)).id;
    const first = (await send(a, target, 'attack', { hastatus: 10 })).json().own[0];
    h.clock.advance(120_000);
    const recalled = await call(a, 'POST', `/api/movements/${first.id}/recall`);
    expect(recalled.json().own).toEqual([expect.objectContaining({ type: 'return', arriveAt: h.clock.now().getTime() + 120_000 })]);
    h.clock.advance(120_000);
    expect((await city(a)).units).toEqual({ hastatus: 20 });
    expect((await call(d, 'GET', '/api/reports')).json().reports).toEqual([]);

    const second = (await send(a, target, 'attack', { hastatus: 10 })).json().own[0];
    h.clock.advance(301_000);
    expect((await call(a, 'POST', `/api/movements/${second.id}/recall`)).json()).toEqual({ error: 'recall_too_late' });
    expect((await call(d, 'POST', `/api/movements/${second.id}/recall`)).statusCode).toBe(404);
  });
});

describe('support', () => {
  it('stations troops that defend the host and can be sent home by either side', async () => {
    const a = await signup(h, 'ally');
    const d = await signup(h, 'host');
    const e = await signup(h, 'enemy');
    await unprotect();
    await grant(a.cityId, { units: { triarius: 40 } });
    await grant(e.cityId, { units: { eques: 10 } });
    const hostSite = (await siteOf(d.cityId)).id;
    expect((await send(a, hostSite, 'support', { triarius: 40 })).statusCode).toBe(200);
    h.clock.advance(6 * HOUR);
    const hosted = await city(d);
    expect(hosted.support).toEqual([{ homeCityId: a.cityId, cityName: 'ally', playerName: 'ally', units: { triarius: 40 } }]);
    const owner = await city(a);
    expect(owner.away).toEqual([{ cityId: d.cityId, cityName: 'host', units: { triarius: 40 } }]);
    expect(owner.unitPop).toBe(40);

    await send(e, hostSite, 'attack', { eques: 10 });
    h.clock.advance(6 * HOUR);
    expect((await call(e, 'GET', '/api/reports')).json().reports[0].data).toMatchObject({ attackerWins: false, defenders: { triarius: 40 } });

    expect((await call(e, 'POST', '/api/support/return', { hostCityId: d.cityId, homeCityId: a.cityId })).statusCode).toBe(404);
    expect((await call(d, 'POST', '/api/support/return', { hostCityId: d.cityId, homeCityId: a.cityId })).statusCode).toBe(200);
    expect((await city(d)).support).toEqual([]);
    h.clock.advance(6 * HOUR);
    // 40 sent; luck decides whether 4 or 5 fall.
    expect((await city(a)).units.triarius).toBeGreaterThanOrEqual(35);
  });
});

describe('natives and the sea', () => {
  it('pays tribute up to the cap and resets on collection', async () => {
    const s = await signup(h, 'collector');
    h.clock.advance(2 * HOUR);
    const before = await city(s);
    expect(before.natives).toHaveLength(3);
    const each = 3 * tributeAccrued(NATIVE.startStanding + NATIVE.standingPerHour * 2, 2 * HOUR, 1);
    const after = (await call(s, 'POST', `/api/cities/${s.cityId}/collect-tribute`)).json().city;
    expect(after.timber).toBe(Math.min(1200, before.timber + Math.floor(2 * 32.4) + each));
    const again = (await call(s, 'POST', `/api/cities/${s.cityId}/collect-tribute`)).json().city;
    expect(again.timber).toBe(after.timber);
  });

  it('raids a native settlement for a haul at the cost of standing', async () => {
    const s = await signup(h, 'raider');
    await grant(s.cityId, { units: { hastatus: 60 }, resources: 0 });
    const home = await siteOf(s.cityId);
    const [native] = await h.db.select().from(sites).where(and(eq(sites.landmassId, home.landmassId), eq(sites.kind, 'native')));
    expect((await send(s, native!.id, 'attack', { hastatus: 60 })).json()).toEqual({ error: 'invalid_target' });
    expect((await send(s, native!.id, 'raid', { hastatus: 60 })).statusCode).toBe(200);
    h.clock.advance(12 * HOUR);
    const report = (await call(s, 'GET', '/api/reports')).json().reports[0];
    expect(report).toMatchObject({ kind: 'raid', data: { attackerWins: true } });
    expect(report.data.loot.timber).toBeGreaterThan(100);
    expect((await city(s)).timber).toBeGreaterThanOrEqual(report.data.loot.timber);
    const [rel] = await h.db.select().from(nativeRelations).where(eq(nativeRelations.siteId, native!.id));
    expect(rel!.standing).toBeLessThan(NATIVE.startStanding);
  });

  it('needs transports to cross the sea and travels at ship speed', async () => {
    const s = await signup(h, 'sailor');
    await grant(s.cityId, { units: { hastatus: 30, oneraria: 2 } });
    const home = await siteOf(s.cityId);
    const [far] = await h.db.select({ site: sites }).from(sites).innerJoin(landmasses, eq(landmasses.id, sites.landmassId))
      .where(and(eq(sites.kind, 'native'), sql`${sites.landmassId} <> ${home.landmassId}`)).limit(1);
    expect((await send(s, far!.site.id, 'raid', { hastatus: 30 })).json()).toEqual({ error: 'not_enough_ships' });
    expect((await send(s, far!.site.id, 'raid', { hastatus: 30, oneraria: 1 })).json()).toEqual({ error: 'not_enough_ships' });
    const [near] = await h.db.select().from(sites).where(and(eq(sites.landmassId, home.landmassId), eq(sites.kind, 'native')));
    expect((await send(s, near!.id, 'raid', { hastatus: 5, oneraria: 1 })).json()).toEqual({ error: 'ships_not_needed' });
    const sent = (await send(s, far!.site.id, 'raid', { hastatus: 30, oneraria: 2 })).json().own[0];
    expect(sent.arriveAt - sent.departAt).toBe(travelSeconds(distance(home, far!.site), UNIT_DEFS.oneraria.speed, 1) * 1000);
    h.clock.advance(72 * HOUR);
    expect((await city(s)).units.oneraria).toBe(2);
  });
});

describe('population', () => {
  it('counts troops against the limit for buildings too', async () => {
    const s = await signup(h, 'crowded');
    await grant(s.cityId, { levels: { ...START_LEVELS, castra: 1 }, units: { hastatus: 68 }, resources: 5000 });
    expect((await call(s, 'POST', `/api/cities/${s.cityId}/build`, { building: 'forum' })).json()).toEqual({ error: 'population' });
    expect((await call(s, 'POST', `/api/cities/${s.cityId}/build`, { building: 'fundus' })).statusCode).toBe(200);
  });
});
