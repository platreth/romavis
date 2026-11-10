import {
  BUILDING_DEFS, BUILDINGS, BUILD_QUEUE_SLOTS, COST_GROWTH, FORUM_SPEEDUP_PER_LEVEL, POP_BASE, POP_GROWTH,
  PRODUCTION_BASE, PRODUCTION_GROWTH, RESOURCES, STORAGE_BASE, STORAGE_GROWTH, TIME_GROWTH,
  type BuildingId, type Levels, type Resources,
} from './data.ts';

export function isBuildingId(v: unknown): v is BuildingId {
  return typeof v === 'string' && (BUILDINGS as readonly string[]).includes(v);
}

/** Cost to build `level` of a building (level >= 1). */
export function buildingCost(building: BuildingId, level: number): Resources {
  const f = COST_GROWTH ** (level - 1);
  const b = BUILDING_DEFS[building].baseCost;
  return { timber: Math.round(b.timber * f), stone: Math.round(b.stone * f), iron: Math.round(b.iron * f) };
}

/** Whole seconds to build `level`, given the Forum level when construction starts. */
export function buildTimeSeconds(building: BuildingId, level: number, forumLevel: number, speed: number): number {
  const raw = BUILDING_DEFS[building].baseTime * TIME_GROWTH ** (level - 1);
  return Math.max(1, Math.ceil(raw / (1 + FORUM_SPEEDUP_PER_LEVEL * forumLevel) / speed));
}

/** Units per hour for a producer at `level`. */
export function productionPerHour(level: number, speed: number): number {
  if (level <= 0) return 0;
  return PRODUCTION_BASE * level * PRODUCTION_GROWTH ** level * speed;
}

export function storageCapacity(horreumLevel: number): number {
  return Math.round(STORAGE_BASE * STORAGE_GROWTH ** (Math.max(1, horreumLevel) - 1));
}

export function populationCap(fundusLevel: number): number {
  return Math.round(POP_BASE * POP_GROWTH ** (Math.max(1, fundusLevel) - 1));
}

export function populationUsed(levels: Levels): number {
  let used = 0;
  for (const b of BUILDINGS) used += levels[b] * BUILDING_DEFS[b].pop;
  return used;
}

export function productionRates(levels: Levels, speed: number): Resources {
  return {
    timber: productionPerHour(levels.lignarium, speed),
    stone: productionPerHour(levels.lapicidina, speed),
    iron: productionPerHour(levels.ferraria, speed),
  };
}

export interface CityEconomy extends Resources {
  /** Epoch milliseconds the stored amounts are valid at. */
  resourcesAt: number;
  levels: Levels;
}

/**
 * Lazy production: amounts at time `t`, capped at storage. Amounts are integers; the
 * fraction of a unit accrued since `resourcesAt` is dropped when the result is persisted,
 * which only happens on commands and events.
 */
export function settle<T extends CityEconomy>(city: T, t: number, speed: number): T {
  if (t <= city.resourcesAt) return city;
  const hours = (t - city.resourcesAt) / 3_600_000;
  const cap = storageCapacity(city.levels.horreum);
  const rates = productionRates(city.levels, speed);
  const next = { ...city, resourcesAt: t };
  for (const r of RESOURCES) {
    // Never reduce an amount that is already above the cap (e.g. after a refund).
    const grown = Math.min(cap, city[r] + Math.floor(rates[r] * hours));
    next[r] = Math.max(city[r], grown);
  }
  return next;
}

export interface QueueItem {
  building: BuildingId;
  targetLevel: number;
}

/** Levels as they will be once everything in the queue has finished. */
export function plannedLevels(levels: Levels, queue: readonly QueueItem[]): Levels {
  const out = { ...levels };
  for (const q of queue) out[q.building] = Math.max(out[q.building], q.targetLevel);
  return out;
}

export type BuildError =
  | 'unknown_building' | 'not_available' | 'queue_full' | 'max_level'
  | 'prerequisite' | 'resources' | 'population';

export type BuildCheck =
  | { ok: true; targetLevel: number; cost: Resources }
  | { ok: false; error: BuildError };

/** Can `building` be added to the queue of a (settled) city? */
export function checkBuild(city: CityEconomy, queue: readonly QueueItem[], building: string): BuildCheck {
  if (!isBuildingId(building)) return { ok: false, error: 'unknown_building' };
  const def = BUILDING_DEFS[building];
  if (!def.enabled) return { ok: false, error: 'not_available' };
  if (queue.length >= BUILD_QUEUE_SLOTS) return { ok: false, error: 'queue_full' };
  const planned = plannedLevels(city.levels, queue);
  const targetLevel = planned[building] + 1;
  if (targetLevel > def.maxLevel) return { ok: false, error: 'max_level' };
  for (const [req, lvl] of Object.entries(def.requires ?? {})) {
    if (planned[req as BuildingId] < (lvl ?? 0)) return { ok: false, error: 'prerequisite' };
  }
  const cost = buildingCost(building, targetLevel);
  for (const r of RESOURCES) if (city[r] < cost[r]) return { ok: false, error: 'resources' };
  const after = { ...planned, [building]: targetLevel };
  if (populationUsed(after) > populationCap(planned.fundus)) return { ok: false, error: 'population' };
  return { ok: true, targetLevel, cost };
}

/**
 * An order can be cancelled only if nothing queued after it depends on it:
 * a higher level of the same building, or a building whose prerequisite it provides.
 */
export function canCancel(levels: Levels, queue: readonly QueueItem[], index: number): boolean {
  const item = queue[index];
  if (!item) return false;
  const remaining = queue.filter((_, i) => i !== index);
  const planned = { ...levels };
  for (const q of remaining) {
    if (q.targetLevel !== planned[q.building] + 1) return false;
    for (const [req, lvl] of Object.entries(BUILDING_DEFS[q.building].requires ?? {})) {
      if (planned[req as BuildingId] < (lvl ?? 0)) return false;
    }
    planned[q.building] = q.targetLevel;
    if (populationUsed(planned) > populationCap(planned.fundus)) return false;
  }
  return true;
}

export function addResources(a: Resources, b: Resources, sign: 1 | -1 = 1): Resources {
  return { timber: a.timber + sign * b.timber, stone: a.stone + sign * b.stone, iron: a.iron + sign * b.iron };
}

/** Gloria from buildings: sum of level squared. */
export function buildingPoints(levels: Levels): number {
  let p = 0;
  for (const b of BUILDINGS) p += levels[b] ** 2;
  return p;
}
