import type { BuildingId, Resources } from './data.ts';

// Units. All numbers are starting values to be tuned by play.

export const UNITS = ['hastatus', 'triarius', 'sagittarius', 'eques', 'oneraria'] as const;
export type UnitId = (typeof UNITS)[number];
export type UnitCounts = Partial<Record<UnitId, number>>;

export const COMBAT_CLASSES = ['infantry', 'cavalry', 'ranged'] as const;
export type CombatClass = (typeof COMBAT_CLASSES)[number];

export interface UnitDef {
  class: CombatClass | 'ship';
  attack: number;
  defense: Record<CombatClass, number>;
  /** World units per hour at speed 1. */
  speed: number;
  /** Resources one unit can carry home. */
  carry: number;
  pop: number;
  cost: Resources;
  /** Seconds per unit with the building at level 1, speed 1. */
  time: number;
  building: Extract<BuildingId, 'castra' | 'portus'>;
  /** Building level needed to recruit. */
  requires: number;
}

const noDef = { infantry: 0, cavalry: 0, ranged: 0 };

export const UNIT_DEFS: Record<UnitId, UnitDef> = {
  hastatus:    { class: 'infantry', attack: 10, defense: { infantry: 10, cavalry: 6, ranged: 8 }, speed: 6, carry: 20, pop: 1, cost: { timber: 60, stone: 30, iron: 40 }, time: 300, building: 'castra', requires: 1 },
  sagittarius: { class: 'ranged', attack: 8, defense: { infantry: 6, cavalry: 4, ranged: 16 }, speed: 6, carry: 10, pop: 1, cost: { timber: 80, stone: 20, iron: 40 }, time: 330, building: 'castra', requires: 3 },
  triarius:    { class: 'infantry', attack: 5, defense: { infantry: 14, cavalry: 20, ranged: 6 }, speed: 5, carry: 10, pop: 1, cost: { timber: 50, stone: 40, iron: 70 }, time: 360, building: 'castra', requires: 5 },
  eques:       { class: 'cavalry', attack: 28, defense: { infantry: 8, cavalry: 10, ranged: 4 }, speed: 12, carry: 60, pop: 3, cost: { timber: 120, stone: 60, iron: 180 }, time: 900, building: 'castra', requires: 8 },
  oneraria:    { class: 'ship', attack: 0, defense: noDef, speed: 10, carry: 0, pop: 5, cost: { timber: 300, stone: 100, iron: 150 }, time: 1200, building: 'portus', requires: 1 },
};

/** Population of land troops one transport ship carries. */
export const TRANSPORT_CAPACITY = 25;
export const RECRUIT_QUEUE_SLOTS = 5;
export const RECRUIT_SPEEDUP_PER_LEVEL = 0.06;
export const MAX_RECRUIT_BATCH = 500;

export const LUCK_RANGE = 0.1;
export const NIGHT_WATCH_HOURS = 8;
export const NIGHT_WATCH_MULTIPLIER = 2;
export const PROTECTION_HOURS = 72;
export const RECALL_WINDOW_SECONDS = 300;
/** Share of storage capacity that can never be looted. */
export const PROTECTED_STORAGE_SHARE = 0.1;

export const NATIVE = {
  startStanding: 60,
  standingPerHour: 1.5,
  raidStandingLoss: 30,
  tributePerHour: 12,
  tributeCapHours: 8,
  garrisonBase: 120,
  garrisonGrowthPerDay: 0.4,
  haulBase: 150,
  haulGrowthPerDay: 0.25,
};

export function isUnitId(v: unknown): v is UnitId {
  return typeof v === 'string' && (UNITS as readonly string[]).includes(v);
}
