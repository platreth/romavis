import type { Resources } from './data.ts';
import { RESOURCES } from './data.ts';
import {
  COMBAT_CLASSES, LUCK_RANGE, NATIVE, NIGHT_WATCH_HOURS, NIGHT_WATCH_MULTIPLIER, RECRUIT_SPEEDUP_PER_LEVEL,
  TRANSPORT_CAPACITY, UNITS, UNIT_DEFS, type CombatClass, type UnitCounts, type UnitId,
} from './units.ts';
import { wallBonus } from './rules.ts';

export const count = (u: UnitCounts, id: UnitId): number => Math.max(0, Math.floor(u[id] ?? 0));

/** Drops zero entries so stored compositions stay small. */
export function compact(u: UnitCounts): UnitCounts {
  const out: UnitCounts = {};
  for (const id of UNITS) if (count(u, id) > 0) out[id] = count(u, id);
  return out;
}

export function addUnits(a: UnitCounts, b: UnitCounts, sign: 1 | -1 = 1): UnitCounts {
  const out: UnitCounts = {};
  for (const id of UNITS) out[id] = count(a, id) + sign * count(b, id);
  return compact(out);
}

export const totalUnits = (u: UnitCounts): number => UNITS.reduce((n, id) => n + count(u, id), 0);
export const unitPopulation = (u: UnitCounts): number => UNITS.reduce((n, id) => n + count(u, id) * UNIT_DEFS[id].pop, 0);
export const carryCapacity = (u: UnitCounts): number => UNITS.reduce((n, id) => n + count(u, id) * UNIT_DEFS[id].carry, 0);
const landUnits = (u: UnitCounts): UnitId[] => UNITS.filter((id) => UNIT_DEFS[id].class !== 'ship' && count(u, id) > 0);

export function attackPower(u: UnitCounts): Record<CombatClass, number> {
  const out = { infantry: 0, cavalry: 0, ranged: 0 };
  for (const id of UNITS) {
    const def = UNIT_DEFS[id];
    if (def.class !== 'ship') out[def.class] += count(u, id) * def.attack;
  }
  return out;
}

export function recruitCost(unit: UnitId, n: number): Resources {
  const c = UNIT_DEFS[unit].cost;
  return { timber: c.timber * n, stone: c.stone * n, iron: c.iron * n };
}

/** Whole seconds to recruit a batch of `n`. */
export function recruitSeconds(unit: UnitId, n: number, buildingLevel: number, speed: number): number {
  const perUnit = UNIT_DEFS[unit].time / (1 + RECRUIT_SPEEDUP_PER_LEVEL * Math.max(0, buildingLevel - 1)) / speed;
  return Math.max(1, Math.ceil(perUnit * n));
}

export function cityBaseDefense(murusLevel: number): number {
  return 20 * (1 + murusLevel);
}

/** Deterministic luck in [-LUCK_RANGE, +LUCK_RANGE] from an integer seed. */
export function luckFromSeed(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const u = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return (u * 2 - 1) * LUCK_RANGE;
}

export interface BattleInput {
  attackers: UnitCounts;
  /** One entry per defending stack (the city's own troops and each supporter). */
  defenders: UnitCounts[];
  murusLevel: number;
  nightWatch: boolean;
  luck: number;
  /** Defence that exists without troops: the city's own, or a native garrison. */
  baseDefense: number;
}

export interface BattleResult {
  attackerWins: boolean;
  attack: number;
  defense: number;
  ratio: number;
  attackerLossShare: number;
  defenderLossShare: number;
  attackerLosses: UnitCounts;
  attackerSurvivors: UnitCounts;
  defenderLosses: UnitCounts[];
}

function applyLosses(u: UnitCounts, share: number): UnitCounts {
  const out: UnitCounts = {};
  for (const id of landUnits(u)) out[id] = Math.min(count(u, id), Math.round(count(u, id) * share));
  return compact(out);
}

/**
 * The Romavis battle formula. Defence is weighted by the mix of what attacks; an even
 * fight costs both sides half; at a ratio of about 1.6 the loser is wiped out.
 * Ships do not fight and are never lost here.
 */
export function resolveBattle(input: BattleInput): BattleResult {
  const a = attackPower(input.attackers);
  const attackTotal = a.infantry + a.cavalry + a.ranged;
  let unitDefense = 0;
  if (attackTotal > 0) {
    for (const cls of COMBAT_CLASSES) {
      let d = 0;
      for (const stack of input.defenders) for (const id of UNITS) d += count(stack, id) * UNIT_DEFS[id].defense[cls];
      unitDefense += (a[cls] / attackTotal) * d;
    }
  }
  const defense = unitDefense * (1 + wallBonus(input.murusLevel)) * (input.nightWatch ? NIGHT_WATCH_MULTIPLIER : 1) + input.baseDefense;
  const attack = attackTotal * (1 + input.luck);
  const ratio = defense > 0 ? attack / defense : Number.POSITIVE_INFINITY;
  const attackerWins = ratio > 1;
  const q = ratio === 0 ? Number.POSITIVE_INFINITY : Math.max(ratio, 1 / ratio);
  const winnerShare = Number.isFinite(q) ? 0.5 * q ** -1.5 : 0;
  const loserShare = Number.isFinite(q) ? Math.min(1, 0.5 * q ** 1.5) : 1;
  const attackerLossShare = attackerWins ? winnerShare : loserShare;
  const defenderLossShare = attackerWins ? loserShare : winnerShare;
  const attackerLosses = applyLosses(input.attackers, attackerLossShare);
  return {
    attackerWins, attack, defense, ratio, attackerLossShare, defenderLossShare, attackerLosses,
    attackerSurvivors: addUnits(input.attackers, attackerLosses, -1),
    defenderLosses: input.defenders.map((d) => applyLosses(d, defenderLossShare)),
  };
}

/** Up to `capacity` resources, split evenly, leaving the protected share behind. */
export function computeLoot(stock: Resources, storage: number, protectedShare: number, capacity: number): Resources {
  const keep = Math.floor(storage * protectedShare);
  const available: Resources = { timber: 0, stone: 0, iron: 0 };
  for (const r of RESOURCES) available[r] = Math.max(0, Math.floor(stock[r]) - keep);
  const loot: Resources = { timber: 0, stone: 0, iron: 0 };
  let left = Math.max(0, Math.floor(capacity));
  // Hand out equal shares; whatever a resource cannot supply is offered to the others.
  for (let pass = 0; pass < 3 && left > 0; pass++) {
    const open = RESOURCES.filter((r) => available[r] > loot[r]);
    if (open.length === 0) break;
    const share = Math.max(1, Math.floor(left / open.length));
    for (const r of open) {
      const take = Math.min(share, available[r] - loot[r], left);
      loot[r] += take;
      left -= take;
    }
  }
  return loot;
}

export type MovementError = 'no_units' | 'no_combat_units' | 'ships_not_needed' | 'not_enough_ships';
export type MovementPlan = { ok: true; speed: number } | { ok: false; error: MovementError };

/** Checks an army's composition for a trip and gives its travel speed (world units per hour, speed 1). */
export function planMovement(units: UnitCounts, sameLandmass: boolean, needsCombatUnits: boolean): MovementPlan {
  const land = landUnits(units);
  const ships = count(units, 'oneraria');
  if (land.length === 0) return { ok: false, error: totalUnits(units) === 0 ? 'no_units' : 'no_combat_units' };
  if (needsCombatUnits && !land.some((id) => UNIT_DEFS[id].attack > 0)) return { ok: false, error: 'no_combat_units' };
  if (sameLandmass) {
    if (ships > 0) return { ok: false, error: 'ships_not_needed' };
    return { ok: true, speed: Math.min(...land.map((id) => UNIT_DEFS[id].speed)) };
  }
  const landPop = land.reduce((n, id) => n + count(units, id) * UNIT_DEFS[id].pop, 0);
  if (ships * TRANSPORT_CAPACITY < landPop) return { ok: false, error: 'not_enough_ships' };
  return { ok: true, speed: UNIT_DEFS.oneraria.speed };
}

export function travelSeconds(distanceUnits: number, speed: number, worldSpeed: number): number {
  return Math.max(1, Math.ceil((distanceUnits / speed / worldSpeed) * 3600));
}

/** Is `at` inside the 8-hour window starting at `startHour` (UTC)? */
export function nightWatchActive(startHour: number | null, at: number): boolean {
  if (startHour === null) return false;
  const hour = new Date(at).getUTCHours() + new Date(at).getUTCMinutes() / 60;
  return (hour - startHour + 24) % 24 < NIGHT_WATCH_HOURS;
}

/** Population value of destroyed units: the battle part of Gloria. */
export const battlePoints = (losses: UnitCounts[]): number => losses.reduce((n, l) => n + unitPopulation(l), 0);

// --- Native settlements -------------------------------------------------------------

const roundDays = (elapsedMs: number, speed: number) => Math.max(0, (elapsedMs * speed) / 86_400_000);

export function nativeGarrison(roundElapsedMs: number, speed: number): number {
  return Math.round(NATIVE.garrisonBase * (1 + NATIVE.garrisonGrowthPerDay * roundDays(roundElapsedMs, speed)));
}

/** Most a raid can bring back, per resource. */
export function nativeHaul(roundElapsedMs: number, speed: number, standing: number): number {
  const base = NATIVE.haulBase * (1 + NATIVE.haulGrowthPerDay * roundDays(roundElapsedMs, speed));
  return Math.round(base * (0.5 + standing / 200));
}

export function standingAt(standing: number, sinceMs: number, speed: number): number {
  return Math.min(100, standing + (NATIVE.standingPerHour * speed * Math.max(0, sinceMs)) / 3_600_000);
}

/** Tribute one settlement has accumulated, per resource, capped at 8 hours (divided by speed). */
export function tributeAccrued(standing: number, sinceMs: number, speed: number): number {
  const hours = Math.min(NATIVE.tributeCapHours / speed, Math.max(0, sinceMs) / 3_600_000);
  return Math.floor(NATIVE.tributePerHour * speed * (standing / 100) * hours);
}
