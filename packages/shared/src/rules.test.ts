import { describe, expect, it } from 'vitest';
import {
  BUILD_QUEUE_SLOTS, COST_GROWTH, START_LEVELS, START_RESOURCES, buildTimeSeconds, buildingCost, canCancel, checkBuild,
  distance, generateRing, plannedLevels, populationCap, populationUsed, productionPerHour, settle, storageCapacity,
  type CityEconomy,
} from './index.ts';

const city = (over: Partial<CityEconomy> = {}): CityEconomy => ({
  ...START_RESOURCES, resourcesAt: 0, levels: { ...START_LEVELS }, ...over,
});
const HOUR = 3_600_000;

describe('formulas', () => {
  it('costs and times grow with level and are integers', () => {
    expect(buildingCost('forum', 1)).toEqual({ timber: 80, stone: 90, iron: 60 });
    expect(buildingCost('forum', 2).timber).toBe(Math.round(80 * COST_GROWTH));
    for (let l = 1; l < 20; l++) {
      expect(buildTimeSeconds('forum', l + 1, 1, 1)).toBeGreaterThan(buildTimeSeconds('forum', l, 1, 1));
      expect(Number.isInteger(buildTimeSeconds('forum', l, 3, 2))).toBe(true);
    }
  });
  it('forum level and world speed shorten construction', () => {
    expect(buildTimeSeconds('horreum', 5, 10, 1)).toBeLessThan(buildTimeSeconds('horreum', 5, 1, 1));
    expect(buildTimeSeconds('horreum', 5, 1, 2)).toBeLessThan(buildTimeSeconds('horreum', 5, 1, 1));
  });
  it('production scales with speed and is zero at level 0', () => {
    expect(productionPerHour(0, 1)).toBe(0);
    expect(productionPerHour(3, 2)).toBeCloseTo(2 * productionPerHour(3, 1));
  });
});

describe('settle', () => {
  it('accrues integer production over time', () => {
    const s = settle(city(), HOUR, 1);
    expect(s.timber).toBe(400 + Math.floor(productionPerHour(1, 1)));
    expect(s.resourcesAt).toBe(HOUR);
  });
  it('caps at storage and never moves backwards', () => {
    const s = settle(city(), 1000 * HOUR, 1);
    expect(s.timber).toBe(storageCapacity(1));
    expect(settle(s, 0, 1)).toBe(s);
  });
  it('does not remove resources already above the cap', () => {
    const s = settle(city({ timber: 5000 }), HOUR, 1);
    expect(s.timber).toBe(5000);
  });
  it('settling in two steps never yields more than one step', () => {
    const one = settle(city(), 10 * HOUR, 1);
    const two = settle(settle(city(), 3 * HOUR + 1234, 1), 10 * HOUR, 1);
    expect(two.timber).toBeLessThanOrEqual(one.timber);
    expect(one.timber - two.timber).toBeLessThanOrEqual(1);
  });
});

describe('build queue rules', () => {
  it('accepts an affordable building and targets the next level', () => {
    const r = checkBuild(city(), [], 'forum');
    expect(r).toEqual({ ok: true, targetLevel: 2, cost: buildingCost('forum', 2) });
  });
  it('stacks levels of the same building in the queue', () => {
    const r = checkBuild(city({ timber: 9999, stone: 9999, iron: 9999 }), [{ building: 'forum', targetLevel: 2 }], 'forum');
    expect(r.ok && r.targetLevel).toBe(3);
  });
  it('rejects for each reason', () => {
    const rich = { timber: 1e9, stone: 1e9, iron: 1e9 };
    expect(checkBuild(city(), [], 'nope')).toEqual({ ok: false, error: 'unknown_building' });
    expect(checkBuild(city(rich), [], 'castra')).toEqual({ ok: false, error: 'not_available' });
    expect(checkBuild(city({ timber: 0 }), [], 'forum')).toEqual({ ok: false, error: 'resources' });
    const full = Array.from({ length: BUILD_QUEUE_SLOTS }, (_, i) => ({ building: 'forum' as const, targetLevel: i + 2 }));
    expect(checkBuild(city(rich), full, 'forum')).toEqual({ ok: false, error: 'queue_full' });
    expect(checkBuild(city({ ...rich, levels: { ...START_LEVELS, forum: 20 } }), [], 'forum')).toEqual({ ok: false, error: 'max_level' });
    const crowded = { ...START_LEVELS, lignarium: 13, lapicidina: 13, ferraria: 13 };
    expect(populationUsed(crowded)).toBeGreaterThan(populationCap(1));
    expect(checkBuild(city({ ...rich, levels: crowded }), [], 'forum')).toEqual({ ok: false, error: 'population' });
  });
  it('only allows cancelling orders nothing later depends on', () => {
    const queue = [{ building: 'forum' as const, targetLevel: 2 }, { building: 'forum' as const, targetLevel: 3 }, { building: 'horreum' as const, targetLevel: 2 }];
    expect(canCancel(START_LEVELS, queue, 0)).toBe(false);
    expect(canCancel(START_LEVELS, queue, 1)).toBe(true);
    expect(canCancel(START_LEVELS, queue, 2)).toBe(true);
    expect(canCancel(START_LEVELS, queue, 9)).toBe(false);
    expect(plannedLevels(START_LEVELS, queue).forum).toBe(3);
  });
});

describe('world generation', () => {
  it('is deterministic per seed and ring', () => {
    expect(generateRing(42, 1)).toEqual(generateRing(42, 1));
    expect(generateRing(42, 1)).not.toEqual(generateRing(43, 1));
  });
  it('rings 0 and 1 give about a dozen landmasses and a hundred city sites', () => {
    const lm = [...generateRing(7, 0), ...generateRing(7, 1)];
    expect(lm.length).toBe(12);
    const sites = lm.flatMap((l) => l.sites).filter((s) => s.kind === 'city').length;
    expect(sites).toBeGreaterThanOrEqual(72);
    expect(sites).toBeLessThanOrEqual(120);
  });
  it('respects spacing between landmasses and between sites', () => {
    for (const seed of [1, 2, 3, 99, 12345]) {
      const lm = [0, 1, 2, 3].flatMap((r) => generateRing(seed, r));
      for (let i = 0; i < lm.length; i++) {
        for (let j = i + 1; j < lm.length; j++) expect(distance(lm[i]!, lm[j]!)).toBeGreaterThanOrEqual(18);
        const s = lm[i]!.sites;
        expect(s.filter((x) => x.kind === 'native').length).toBe(3);
        for (let a = 0; a < s.length; a++) for (let b = a + 1; b < s.length; b++) expect(distance(s[a]!, s[b]!)).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
