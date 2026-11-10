import { and, asc, eq } from 'drizzle-orm';
import {
  addResources, buildTimeSeconds, buildingCost, canCancel, checkBuild, isBuildingId, settle,
  type BuildingId, type CityEconomy, type QueueItem,
} from '@romavis/shared';
import type { Q, Tx } from './db/client.ts';
import { buildOrders, cities, gameEvents, players, sites } from './db/schema.ts';
import { GameError } from './errors.ts';
import { homeUnitPop, type Push } from './stacks.ts';

export type CityRow = typeof cities.$inferSelect;
type OrderRow = typeof buildOrders.$inferSelect;

export const economy = (c: CityRow): CityEconomy => ({
  timber: c.timber, stone: c.stone, iron: c.iron, resourcesAt: c.resourcesAt.getTime(), levels: c.levels,
});

export const queueItems = (orders: OrderRow[]): QueueItem[] =>
  orders.map((o) => ({ building: o.building as BuildingId, targetLevel: o.targetLevel }));

export async function lockOwnCity(tx: Tx, playerId: number, cityId: number): Promise<CityRow> {
  const [city] = await tx.select().from(cities).where(and(eq(cities.id, cityId), eq(cities.playerId, playerId))).for('update');
  if (!city) throw new GameError('city_not_found', 404);
  return city;
}

export const ordersOf = (q: Q, cityId: number) =>
  q.select().from(buildOrders).where(eq(buildOrders.cityId, cityId)).orderBy(asc(buildOrders.id));

export async function saveEconomy(tx: Tx, cityId: number, e: CityEconomy): Promise<void> {
  await tx.update(cities).set({
    timber: e.timber, stone: e.stone, iron: e.iron, resourcesAt: new Date(e.resourcesAt), levels: e.levels,
  }).where(eq(cities.id, cityId));
}

/** Put `order` under construction starting at `at`. */
async function startOrder(tx: Tx, city: CityRow, e: CityEconomy, order: OrderRow, at: Date, speed: number): Promise<void> {
  const seconds = buildTimeSeconds(order.building as BuildingId, order.targetLevel, e.levels.forum, speed);
  const [event] = await tx.insert(gameEvents).values({
    worldId: city.worldId, type: 'build_done', dueAt: new Date(at.getTime() + seconds * 1000),
    payload: { cityId: city.id, orderId: order.id },
  }).returning({ id: gameEvents.id });
  await tx.update(buildOrders).set({ startedAt: at, eventId: event!.id }).where(eq(buildOrders.id, order.id));
}

export async function queueBuild(tx: Tx, now: Date, speed: number, playerId: number, cityId: number, building: string): Promise<void> {
  const city = await lockOwnCity(tx, playerId, cityId);
  const orders = await ordersOf(tx, cityId);
  const settled = settle(economy(city), now.getTime(), speed);
  const check = checkBuild(settled, queueItems(orders), building, await homeUnitPop(tx, cityId));
  if (!check.ok) throw new GameError(check.error, check.error === 'unknown_building' ? 400 : 409);
  const paid = { ...settled, ...addResources(settled, check.cost, -1) };
  await saveEconomy(tx, cityId, paid);
  const [order] = await tx.insert(buildOrders).values({ cityId, building, targetLevel: check.targetLevel }).returning();
  if (orders.length === 0) await startOrder(tx, city, paid, order!, now, speed);
}

export async function cancelBuild(tx: Tx, now: Date, speed: number, playerId: number, cityId: number, orderId: number): Promise<void> {
  const city = await lockOwnCity(tx, playerId, cityId);
  const orders = await ordersOf(tx, cityId);
  const index = orders.findIndex((o) => o.id === orderId);
  const order = orders[index];
  if (!order) throw new GameError('order_not_found', 404);
  if (!canCancel(city.levels, queueItems(orders), index, await homeUnitPop(tx, cityId))) throw new GameError('order_has_dependents', 409);

  const settled = settle(economy(city), now.getTime(), speed);
  const refunded = { ...settled, ...addResources(settled, buildingCost(order.building as BuildingId, order.targetLevel)) };
  await saveEconomy(tx, cityId, refunded);
  await tx.delete(buildOrders).where(eq(buildOrders.id, order.id));
  if (order.eventId !== null) {
    // It was under construction: retire its event and start whatever is next.
    await tx.update(gameEvents).set({ doneAt: now }).where(eq(gameEvents.id, order.eventId));
    const next = orders[index + 1];
    if (next) await startOrder(tx, city, refunded, next, now, speed);
  }
}

/** Event handler. `at` is the event's due time, which is the effective time of the change. */
export async function handleBuildDone(
  tx: Tx, at: Date, speed: number, payload: Record<string, number>,
): Promise<Push[]> {
  const [city] = await tx.select().from(cities).where(eq(cities.id, payload.cityId ?? -1)).for('update');
  if (!city) return [];
  const orders = await ordersOf(tx, city.id);
  const order = orders.find((o) => o.id === payload.orderId);
  if (!order || !isBuildingId(order.building)) return [];

  const settled = settle(economy(city), at.getTime(), speed);
  const built: CityEconomy = { ...settled, levels: { ...settled.levels, [order.building]: order.targetLevel } };
  await saveEconomy(tx, city.id, built);
  await tx.delete(buildOrders).where(eq(buildOrders.id, order.id));
  const next = orders.find((o) => o.id !== order.id);
  if (next) await startOrder(tx, city, built, next, at, speed);
  return [{ playerId: city.playerId, message: { type: 'city_updated', cityId: city.id } }];
}

/** Stored state of a city plus its queue. The client derives live values with the shared rules. */
export async function cityView(q: Q, playerId: number, cityId: number) {
  const [row] = await q.select({ city: cities, x: sites.x, y: sites.y, landmassId: sites.landmassId }).from(cities)
    .innerJoin(sites, eq(sites.id, cities.siteId))
    .where(and(eq(cities.id, cityId), eq(cities.playerId, playerId)));
  if (!row) throw new GameError('city_not_found', 404);
  const orders = await q.select({ order: buildOrders, dueAt: gameEvents.dueAt }).from(buildOrders)
    .leftJoin(gameEvents, eq(gameEvents.id, buildOrders.eventId))
    .where(eq(buildOrders.cityId, cityId)).orderBy(asc(buildOrders.id));
  const c = row.city;
  return {
    id: c.id, name: c.name, siteId: c.siteId, landmassId: row.landmassId, x: row.x, y: row.y,
    timber: c.timber, stone: c.stone, iron: c.iron, resourcesAt: c.resourcesAt.getTime(), levels: c.levels,
    queue: orders.map(({ order, dueAt }) => ({
      id: order.id, building: order.building as BuildingId, targetLevel: order.targetLevel,
      startedAt: order.startedAt?.getTime() ?? null, dueAt: dueAt?.getTime() ?? null,
    })),
  };
}

export async function playerCityIds(q: Q, playerId: number): Promise<number[]> {
  const rows = await q.select({ id: cities.id }).from(cities).where(eq(cities.playerId, playerId)).orderBy(asc(cities.id));
  return rows.map((r) => r.id);
}
