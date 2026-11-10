import { sql } from 'drizzle-orm';
import {
  boolean, doublePrecision, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { Levels, Resources, UnitCounts } from '@romavis/shared';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  locale: text('locale').notNull().default('en'),
  isAdmin: boolean('is_admin').notNull().default(false),
  status: text('status').notNull().default('active'),
  createdAt: ts('created_at').notNull(),
}, (t) => [
  uniqueIndex('users_username_lower').on(sql`lower(${t.username})`),
  uniqueIndex('users_email_lower').on(sql`lower(${t.email})`),
]);

export const sessions = pgTable('sessions', {
  /** SHA-256 of the cookie token; the token itself is never stored. */
  tokenHash: text('token_hash').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: ts('expires_at').notNull(),
  createdAt: ts('created_at').notNull(),
});

export const worlds = pgTable('worlds', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  seed: integer('seed').notNull(),
  speed: integer('speed').notNull().default(1),
  startsAt: ts('starts_at').notNull(),
  endsAt: ts('ends_at').notNull(),
  status: text('status').notNull().default('open'),
  ringsGenerated: integer('rings_generated').notNull().default(0),
});

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  worldId: integer('world_id').notNull().references(() => worlds.id),
  joinedAt: ts('joined_at').notNull(),
  lastSeenAt: ts('last_seen_at').notNull(),
  /** Other players cannot attack before this time. Cleared when the player attacks someone. */
  protectedUntil: ts('protected_until'),
  /** UTC hour at which the player's 8-hour night watch starts. Chosen once per round. */
  nightWatchStart: integer('night_watch_start'),
  gloriaBattle: integer('gloria_battle').notNull().default(0),
}, (t) => [uniqueIndex('players_user_world').on(t.userId, t.worldId)]);

export const landmasses = pgTable('landmasses', {
  id: serial('id').primaryKey(),
  worldId: integer('world_id').notNull().references(() => worlds.id),
  ring: integer('ring').notNull(),
  idx: integer('idx').notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  radius: integer('radius').notNull(),
}, (t) => [uniqueIndex('landmasses_world_ring_idx').on(t.worldId, t.ring, t.idx)]);

export const sites = pgTable('sites', {
  id: serial('id').primaryKey(),
  landmassId: integer('landmass_id').notNull().references(() => landmasses.id),
  kind: text('kind').$type<'city' | 'native'>().notNull(),
  slot: integer('slot').notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
}, (t) => [index('sites_landmass').on(t.landmassId)]);

export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  worldId: integer('world_id').notNull().references(() => worlds.id),
  siteId: integer('site_id').notNull().references(() => sites.id).unique(),
  playerId: integer('player_id').references(() => players.id),
  name: text('name').notNull(),
  timber: integer('timber').notNull(),
  stone: integer('stone').notNull(),
  iron: integer('iron').notNull(),
  resourcesAt: ts('resources_at').notNull(),
  levels: jsonb('levels').$type<Levels>().notNull(),
}, (t) => [index('cities_player').on(t.playerId), index('cities_world').on(t.worldId)]);

export const gameEvents = pgTable('game_events', {
  id: serial('id').primaryKey(),
  worldId: integer('world_id').notNull().references(() => worlds.id),
  type: text('type').notNull(),
  dueAt: ts('due_at').notNull(),
  payload: jsonb('payload').$type<Record<string, number>>().notNull(),
  doneAt: ts('done_at'),
}, (t) => [index('game_events_due').on(t.dueAt, t.id).where(sql`${t.doneAt} is null`)]);

export const buildOrders = pgTable('build_orders', {
  /** Queue order is id order. */
  id: serial('id').primaryKey(),
  cityId: integer('city_id').notNull().references(() => cities.id),
  building: text('building').notNull(),
  targetLevel: integer('target_level').notNull(),
  /** Set while this order is the one under construction. */
  startedAt: ts('started_at'),
  eventId: integer('event_id').references(() => gameEvents.id),
}, (t) => [index('build_orders_city').on(t.cityId)]);

export const recruitOrders = pgTable('recruit_orders', {
  /** Queue order is id order, per building. */
  id: serial('id').primaryKey(),
  cityId: integer('city_id').notNull().references(() => cities.id),
  building: text('building').notNull(),
  unitType: text('unit_type').notNull(),
  count: integer('count').notNull(),
  startedAt: ts('started_at'),
  eventId: integer('event_id').references(() => gameEvents.id),
}, (t) => [index('recruit_orders_city').on(t.cityId)]);

/** Units standing in a city. `homeCityId` is the city that pays their population. */
export const unitStacks = pgTable('unit_stacks', {
  id: serial('id').primaryKey(),
  homeCityId: integer('home_city_id').notNull().references(() => cities.id),
  cityId: integer('city_id').notNull().references(() => cities.id),
  unitType: text('unit_type').notNull(),
  count: integer('count').notNull(),
}, (t) => [
  uniqueIndex('unit_stacks_home_city_type').on(t.homeCityId, t.cityId, t.unitType),
  index('unit_stacks_city').on(t.cityId),
]);

/** Units on the road. They are not in `unit_stacks` while moving. */
export const movements = pgTable('movements', {
  id: serial('id').primaryKey(),
  worldId: integer('world_id').notNull().references(() => worlds.id),
  type: text('type').$type<'attack' | 'support' | 'raid' | 'return'>().notNull(),
  playerId: integer('player_id').notNull().references(() => players.id),
  homeCityId: integer('home_city_id').notNull().references(() => cities.id),
  fromSiteId: integer('from_site_id').notNull().references(() => sites.id),
  toSiteId: integer('to_site_id').notNull().references(() => sites.id),
  units: jsonb('units').$type<UnitCounts>().notNull(),
  loot: jsonb('loot').$type<Resources>(),
  departAt: ts('depart_at').notNull(),
  arriveAt: ts('arrive_at').notNull(),
  state: text('state').$type<'moving' | 'done' | 'recalled'>().notNull().default('moving'),
  eventId: integer('event_id').references(() => gameEvents.id),
}, (t) => [
  index('movements_player').on(t.playerId).where(sql`${t.state} = 'moving'`),
  index('movements_target').on(t.toSiteId).where(sql`${t.state} = 'moving'`),
  index('movements_home').on(t.homeCityId).where(sql`${t.state} = 'moving'`),
]);

/** A player's private relationship with a native settlement. */
export const nativeRelations = pgTable('native_relations', {
  playerId: integer('player_id').notNull().references(() => players.id),
  siteId: integer('site_id').notNull().references(() => sites.id),
  standing: doublePrecision('standing').notNull(),
  standingAt: ts('standing_at').notNull(),
  tributeAt: ts('tribute_at').notNull(),
}, (t) => [primaryKey({ columns: [t.playerId, t.siteId] })]);

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  worldId: integer('world_id').notNull().references(() => worlds.id),
  playerId: integer('player_id').notNull().references(() => players.id),
  kind: text('kind').notNull(),
  data: jsonb('data').$type<Record<string, unknown>>().notNull(),
  createdAt: ts('created_at').notNull(),
  readAt: ts('read_at'),
}, (t) => [index('reports_player').on(t.playerId, t.id)]);
