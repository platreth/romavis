import { sql } from 'drizzle-orm';
import {
  boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { Levels } from '@romavis/shared';

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
