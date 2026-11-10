import { and, eq, sql } from 'drizzle-orm';
import { UNITS, UNIT_DEFS, compact, count, isUnitId, unitPopulation, type UnitCounts } from '@romavis/shared';
import type { Q, Tx } from './db/client.ts';
import { movements, players, recruitOrders, unitStacks } from './db/schema.ts';

/** A hint for a player's open clients to refetch something. */
export interface Push {
  playerId: number | null;
  message: { type: 'city_updated' | 'movements' | 'incoming' | 'report'; cityId?: number };
}

export async function userIdOfPlayer(q: Q, playerId: number): Promise<number | null> {
  const [p] = await q.select({ userId: players.userId }).from(players).where(eq(players.id, playerId));
  return p?.userId ?? null;
}

/** Add units to the stack of `homeCityId` standing in `cityId`. Caller holds the lock on `cityId`. */
export async function addToStack(tx: Tx, homeCityId: number, cityId: number, units: UnitCounts): Promise<void> {
  for (const id of UNITS) {
    const n = count(units, id);
    if (n === 0) continue;
    await tx.insert(unitStacks).values({ homeCityId, cityId, unitType: id, count: n })
      .onConflictDoUpdate({
        target: [unitStacks.homeCityId, unitStacks.cityId, unitStacks.unitType],
        set: { count: sql`${unitStacks.count} + ${n}` },
      });
  }
}

/** Remove units from a stack. Caller holds the lock on `cityId` and has checked availability. */
export async function removeFromStack(tx: Tx, homeCityId: number, cityId: number, units: UnitCounts): Promise<void> {
  for (const id of UNITS) {
    const n = count(units, id);
    if (n === 0) continue;
    await tx.update(unitStacks).set({ count: sql`${unitStacks.count} - ${n}` })
      .where(and(eq(unitStacks.homeCityId, homeCityId), eq(unitStacks.cityId, cityId), eq(unitStacks.unitType, id)));
  }
  await tx.delete(unitStacks).where(and(eq(unitStacks.cityId, cityId), sql`${unitStacks.count} <= 0`));
}

/** Units standing in a city, grouped by the city they belong to. */
export async function stacksIn(q: Q, cityId: number): Promise<Map<number, UnitCounts>> {
  const rows = await q.select().from(unitStacks).where(eq(unitStacks.cityId, cityId));
  const byHome = new Map<number, UnitCounts>();
  for (const r of rows) {
    if (!isUnitId(r.unitType)) continue;
    const u = byHome.get(r.homeCityId) ?? {};
    u[r.unitType] = (u[r.unitType] ?? 0) + r.count;
    byHome.set(r.homeCityId, u);
  }
  for (const [k, v] of byHome) byHome.set(k, compact(v));
  return byHome;
}

/** Population used by every unit that belongs to a city: at home, away, on the road, or in training. */
export async function homeUnitPop(q: Q, cityId: number): Promise<number> {
  const stationed = await q.select({ unitType: unitStacks.unitType, count: unitStacks.count })
    .from(unitStacks).where(eq(unitStacks.homeCityId, cityId));
  const moving = await q.select({ units: movements.units }).from(movements)
    .where(and(eq(movements.homeCityId, cityId), eq(movements.state, 'moving')));
  const training = await q.select({ unitType: recruitOrders.unitType, count: recruitOrders.count })
    .from(recruitOrders).where(eq(recruitOrders.cityId, cityId));
  let pop = 0;
  for (const r of [...stationed, ...training]) if (isUnitId(r.unitType)) pop += r.count * UNIT_DEFS[r.unitType].pop;
  for (const m of moving) pop += unitPopulation(m.units);
  return pop;
}
