// Game data. Every number here is a starting value tuned with the economy simulator (sim.ts).

export const RESOURCES = ['timber', 'stone', 'iron'] as const;
export type ResourceId = (typeof RESOURCES)[number];
export type Resources = Record<ResourceId, number>;

export const BUILDINGS = [
  'forum', 'lignarium', 'lapicidina', 'ferraria', 'fundus', 'horreum', 'castra', 'murus', 'portus',
] as const;
export type BuildingId = (typeof BUILDINGS)[number];
export type Levels = Record<BuildingId, number>;

export interface BuildingDef {
  baseCost: Resources;
  /** Seconds for level 1 at speed 1 with Forum 0. */
  baseTime: number;
  /** Population used per level. */
  pop: number;
  maxLevel: number;
  requires?: Partial<Record<BuildingId, number>>;
  /** False until the milestone that introduces the building. */
  enabled: boolean;
  produces?: ResourceId;
}

export const BUILDING_DEFS: Record<BuildingId, BuildingDef> = {
  forum:      { baseCost: { timber: 80, stone: 90, iron: 60 }, baseTime: 100, pop: 2, maxLevel: 20, enabled: true },
  lignarium:  { baseCost: { timber: 40, stone: 55, iron: 30 }, baseTime: 60, pop: 2, maxLevel: 20, enabled: true, produces: 'timber' },
  lapicidina: { baseCost: { timber: 55, stone: 35, iron: 35 }, baseTime: 60, pop: 2, maxLevel: 20, enabled: true, produces: 'stone' },
  ferraria:   { baseCost: { timber: 60, stone: 50, iron: 30 }, baseTime: 70, pop: 2, maxLevel: 20, enabled: true, produces: 'iron' },
  fundus:     { baseCost: { timber: 50, stone: 40, iron: 25 }, baseTime: 70, pop: 0, maxLevel: 20, enabled: true },
  horreum:    { baseCost: { timber: 60, stone: 45, iron: 20 }, baseTime: 70, pop: 1, maxLevel: 20, enabled: true },
  castra:     { baseCost: { timber: 120, stone: 100, iron: 140 }, baseTime: 100, pop: 3, maxLevel: 20, requires: { forum: 3 }, enabled: false },
  murus:      { baseCost: { timber: 50, stone: 150, iron: 40 }, baseTime: 90, pop: 2, maxLevel: 20, requires: { forum: 5 }, enabled: false },
  portus:     { baseCost: { timber: 300, stone: 150, iron: 200 }, baseTime: 240, pop: 4, maxLevel: 10, requires: { forum: 8 }, enabled: false },
};

export const COST_GROWTH = 1.32;
export const TIME_GROWTH = 1.48;
export const FORUM_SPEEDUP_PER_LEVEL = 0.05;
export const PRODUCTION_BASE = 30;
export const PRODUCTION_GROWTH = 1.08;
export const STORAGE_BASE = 1200;
export const STORAGE_GROWTH = 1.22;
export const POP_BASE = 80;
export const POP_GROWTH = 1.17;
export const BUILD_QUEUE_SLOTS = 3;

export const START_RESOURCES: Resources = { timber: 400, stone: 400, iron: 400 };
export const START_LEVELS: Levels = {
  forum: 1, lignarium: 1, lapicidina: 1, ferraria: 1, fundus: 1, horreum: 1, castra: 0, murus: 0, portus: 0,
};

export const ROUND_DAYS = 28;
