import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import {
  MAX_RECRUIT_BATCH, NATIVE, PROTECTED_STORAGE_SHARE, RECALL_WINDOW_SECONDS, RECRUIT_QUEUE_SLOTS, RESOURCES,
  UNITS, UNIT_DEFS, addResources, addUnits, battlePoints, carryCapacity, cityBaseDefense, compact, computeLoot,
  count, distance, isUnitId, luckFromSeed, nativeGarrison, nativeHaul, nightWatchActive, planMovement,
  plannedLevels, populationCap, populationUsed, recruitCost, recruitSeconds, resolveBattle, settle, standingAt,
  storageCapacity, totalUnits, travelSeconds, tributeAccrued,
  type CityEconomy, type Resources, type UnitCounts, type UnitId,
} from '@romavis/shared';
import { economy, lockOwnCity, ordersOf, queueItems, saveEconomy, type CityRow } from './city.ts';
import type { Q, Tx } from './db/client.ts';
import {
  cities, gameEvents, landmasses, movements, nativeRelations, players, recruitOrders, reports, sites, unitStacks, users,
} from './db/schema.ts';
import { GameError } from './errors.ts';
import { addToStack, homeUnitPop, removeFromStack, stacksIn, type Push } from './stacks.ts';
import type { Player, World } from './world.ts';

type Movement = typeof movements.$inferSelect;
type RecruitOrder = typeof recruitOrders.$inferSelect;
type Site = typeof sites.$inferSelect;

// --- Recruitment --------------------------------------------------------------------

async function startRecruit(tx: Tx, city: CityRow, order: RecruitOrder, at: Date, speed: number): Promise<void> {
  const unit = order.unitType as UnitId;
  const seconds = recruitSeconds(unit, order.count, city.levels[UNIT_DEFS[unit].building], speed);
  const [event] = await tx.insert(gameEvents).values({
    worldId: city.worldId, type: 'recruit_done', dueAt: new Date(at.getTime() + seconds * 1000),
    payload: { cityId: city.id, orderId: order.id },
  }).returning({ id: gameEvents.id });
  await tx.update(recruitOrders).set({ startedAt: at, eventId: event!.id }).where(eq(recruitOrders.id, order.id));
}

export async function recruit(
  tx: Tx, now: Date, speed: number, playerId: number, cityId: number, unit: string, n: number,
): Promise<void> {
  const city = await lockOwnCity(tx, playerId, cityId);
  if (!isUnitId(unit)) throw new GameError('unknown_unit', 400);
  if (!Number.isInteger(n) || n < 1 || n > MAX_RECRUIT_BATCH) throw new GameError('invalid_input', 400);
  const def = UNIT_DEFS[unit];
  if (city.levels[def.building] < def.requires) throw new GameError('prerequisite', 409);

  const queue = await tx.select().from(recruitOrders)
    .where(and(eq(recruitOrders.cityId, cityId), eq(recruitOrders.building, def.building))).orderBy(asc(recruitOrders.id));
  if (queue.length >= RECRUIT_QUEUE_SLOTS) throw new GameError('queue_full', 409);

  const settled = settle(economy(city), now.getTime(), speed);
  const cost = recruitCost(unit, n);
  for (const r of RESOURCES) if (settled[r] < cost[r]) throw new GameError('resources', 409);
  // Troops need room that exists now: only built Fundus levels count.
  const buildingPop = populationUsed(plannedLevels(city.levels, queueItems(await ordersOf(tx, cityId))));
  if (buildingPop + (await homeUnitPop(tx, cityId)) + n * def.pop > populationCap(city.levels.fundus)) {
    throw new GameError('population', 409);
  }
  await saveEconomy(tx, cityId, { ...settled, ...addResources(settled, cost, -1) });
  const [order] = await tx.insert(recruitOrders).values({ cityId, building: def.building, unitType: unit, count: n }).returning();
  if (queue.length === 0) await startRecruit(tx, city, order!, now, speed);
}

export async function handleRecruitDone(tx: Tx, at: Date, speed: number, payload: Record<string, number>): Promise<Push[]> {
  const [city] = await tx.select().from(cities).where(eq(cities.id, payload.cityId ?? -1)).for('update');
  if (!city) return [];
  const [order] = await tx.select().from(recruitOrders).where(eq(recruitOrders.id, payload.orderId ?? -1));
  if (!order || !isUnitId(order.unitType)) return [];
  await addToStack(tx, city.id, city.id, { [order.unitType]: order.count });
  await tx.delete(recruitOrders).where(eq(recruitOrders.id, order.id));
  const [next] = await tx.select().from(recruitOrders)
    .where(and(eq(recruitOrders.cityId, city.id), eq(recruitOrders.building, order.building)))
    .orderBy(asc(recruitOrders.id)).limit(1);
  if (next) await startRecruit(tx, city, next, at, speed);
  return [{ playerId: city.playerId, message: { type: 'city_updated', cityId: city.id } }];
}

// --- Movements ----------------------------------------------------------------------

async function insertMovement(
  tx: Tx, m: Pick<Movement, 'worldId' | 'type' | 'playerId' | 'homeCityId' | 'fromSiteId' | 'toSiteId' | 'units' | 'loot' | 'departAt' | 'arriveAt'>,
): Promise<Movement> {
  const [row] = await tx.insert(movements).values(m).returning();
  const [event] = await tx.insert(gameEvents).values({
    worldId: m.worldId, type: 'movement_arrive', dueAt: m.arriveAt, payload: { movementId: row!.id },
  }).returning({ id: gameEvents.id });
  await tx.update(movements).set({ eventId: event!.id }).where(eq(movements.id, row!.id));
  return { ...row!, eventId: event!.id };
}

const siteById = async (q: Q, id: number): Promise<Site | null> =>
  (await q.select().from(sites).where(eq(sites.id, id)))[0] ?? null;

/** Speed for a trip home: survivors may be ships only, or land troops whose ships are still with them. */
function homewardSpeed(units: UnitCounts, sameLandmass: boolean): number {
  const land = UNITS.filter((id) => UNIT_DEFS[id].class !== 'ship' && count(units, id) > 0);
  if (!sameLandmass || land.length === 0) return UNIT_DEFS.oneraria.speed;
  return Math.min(...land.map((id) => UNIT_DEFS[id].speed));
}

async function sendHome(
  tx: Tx, world: World, base: Pick<Movement, 'playerId' | 'homeCityId'>, fromSite: Site, units: UnitCounts,
  loot: Resources | null, at: Date, fixedSeconds?: number,
): Promise<void> {
  const survivors = compact(units);
  if (totalUnits(survivors) === 0) return;
  const [home] = await tx.select({ site: sites }).from(cities).innerJoin(sites, eq(sites.id, cities.siteId))
    .where(eq(cities.id, base.homeCityId));
  if (!home) return;
  const seconds = fixedSeconds ?? travelSeconds(
    distance(fromSite, home.site), homewardSpeed(survivors, fromSite.landmassId === home.site.landmassId), world.speed);
  await insertMovement(tx, {
    worldId: world.id, type: 'return', playerId: base.playerId, homeCityId: base.homeCityId,
    fromSiteId: fromSite.id, toSiteId: home.site.id, units: survivors, loot, departAt: at,
    arriveAt: new Date(at.getTime() + seconds * 1000),
  });
}

export interface SendInput { fromCityId: number; toSiteId: number; type: 'attack' | 'support' | 'raid'; units: UnitCounts }

export async function sendMovement(tx: Tx, now: Date, world: World, player: Player, input: SendInput): Promise<Push[]> {
  const from = await lockOwnCity(tx, player.id, input.fromCityId);
  const fromSite = await siteById(tx, from.siteId);
  const toSite = await siteById(tx, input.toSiteId);
  if (!fromSite || !toSite) throw new GameError('target_not_found', 404);
  const [toLand] = await tx.select({ worldId: landmasses.worldId }).from(landmasses).where(eq(landmasses.id, toSite.landmassId));
  if (toLand?.worldId !== world.id) throw new GameError('target_not_found', 404);

  const [target] = await tx.select().from(cities).where(eq(cities.siteId, toSite.id));
  const pushes: Push[] = [{ playerId: player.id, message: { type: 'city_updated', cityId: from.id } }];
  if (input.type === 'raid') {
    if (toSite.kind !== 'native') throw new GameError('invalid_target', 409);
  } else {
    if (toSite.kind !== 'city' || !target || target.id === from.id) throw new GameError('invalid_target', 409);
    if (input.type === 'attack') {
      if (target.playerId === player.id) throw new GameError('own_target', 409);
      if (target.playerId !== null) {
        const [owner] = await tx.select().from(players).where(eq(players.id, target.playerId));
        if (owner?.protectedUntil && owner.protectedUntil > now) throw new GameError('target_protected', 409);
        // Attacking another player ends your own protection.
        if (player.protectedUntil && player.protectedUntil > now) {
          await tx.update(players).set({ protectedUntil: null }).where(eq(players.id, player.id));
        }
      }
    }
    pushes.push({ playerId: target.playerId, message: { type: 'incoming', cityId: target.id } });
  }

  const units = compact(input.units);
  const available = (await stacksIn(tx, from.id)).get(from.id) ?? {};
  for (const id of UNITS) if (count(units, id) > count(available, id)) throw new GameError('not_enough_units', 409);
  const plan = planMovement(units, fromSite.landmassId === toSite.landmassId, input.type !== 'support');
  if (!plan.ok) throw new GameError(plan.error, 409);

  await removeFromStack(tx, from.id, from.id, units);
  await insertMovement(tx, {
    worldId: world.id, type: input.type, playerId: player.id, homeCityId: from.id, fromSiteId: fromSite.id,
    toSiteId: toSite.id, units, loot: null, departAt: now,
    arriveAt: new Date(now.getTime() + travelSeconds(distance(fromSite, toSite), plan.speed, world.speed) * 1000),
  });
  return pushes;
}

export async function recallMovement(tx: Tx, now: Date, world: World, player: Player, movementId: number): Promise<Push[]> {
  const [m] = await tx.select().from(movements)
    .where(and(eq(movements.id, movementId), eq(movements.playerId, player.id))).for('update');
  if (!m || m.state !== 'moving' || m.type === 'return') throw new GameError('movement_not_found', 404);
  const elapsed = now.getTime() - m.departAt.getTime();
  if (elapsed > (RECALL_WINDOW_SECONDS * 1000) / world.speed) throw new GameError('recall_too_late', 409);
  await tx.update(movements).set({ state: 'recalled' }).where(eq(movements.id, m.id));
  if (m.eventId !== null) await tx.update(gameEvents).set({ doneAt: now }).where(eq(gameEvents.id, m.eventId));
  const toSite = await siteById(tx, m.toSiteId);
  // It turns around where it is: the way back takes as long as it has travelled.
  await sendHome(tx, world, m, toSite!, m.units, null, now, Math.max(1, Math.ceil(elapsed / 1000)));
  return [{ playerId: player.id, message: { type: 'movements' } }];
}

/** Send supporting troops back to their own city. Allowed for their owner and for the host. */
export async function returnSupport(
  tx: Tx, now: Date, world: World, player: Player, hostCityId: number, homeCityId: number,
): Promise<Push[]> {
  const [host] = await tx.select().from(cities).where(and(eq(cities.id, hostCityId), eq(cities.worldId, world.id))).for('update');
  const [home] = await tx.select().from(cities).where(and(eq(cities.id, homeCityId), eq(cities.worldId, world.id)));
  if (!host || !home || host.id === home.id || home.playerId === null) throw new GameError('city_not_found', 404);
  if (host.playerId !== player.id && home.playerId !== player.id) throw new GameError('city_not_found', 404);
  const units = (await stacksIn(tx, host.id)).get(home.id);
  if (!units || totalUnits(units) === 0) throw new GameError('no_units', 409);
  await removeFromStack(tx, home.id, host.id, units);
  const hostSite = await siteById(tx, host.siteId);
  await sendHome(tx, world, { playerId: home.playerId, homeCityId: home.id }, hostSite!, units, null, now);
  return [
    { playerId: host.playerId, message: { type: 'city_updated', cityId: host.id } },
    { playerId: home.playerId, message: { type: 'movements' } },
  ];
}

// --- Arrival ------------------------------------------------------------------------

async function playerName(q: Q, playerId: number | null): Promise<string | null> {
  if (playerId === null) return null;
  const [row] = await q.select({ name: users.username }).from(players).innerJoin(users, eq(users.id, players.userId))
    .where(eq(players.id, playerId));
  return row?.name ?? null;
}

async function writeReport(tx: Tx, world: World, playerId: number | null, kind: string, data: Record<string, unknown>, at: Date): Promise<Push[]> {
  if (playerId === null) return [];
  await tx.insert(reports).values({ worldId: world.id, playerId, kind, data, createdAt: at });
  return [{ playerId, message: { type: 'report' } }];
}

const sumUnits = (list: UnitCounts[]): UnitCounts => list.reduce<UnitCounts>((a, b) => addUnits(a, b), {});

async function arriveAttack(tx: Tx, at: Date, world: World, m: Movement, toSite: Site): Promise<Push[]> {
  const [city] = await tx.select().from(cities).where(eq(cities.siteId, toSite.id)).for('update');
  if (!city) {
    await sendHome(tx, world, m, toSite, m.units, null, at);
    return [];
  }
  const [defender] = city.playerId === null ? [] : await tx.select().from(players).where(eq(players.id, city.playerId));
  const stacks = [...(await stacksIn(tx, city.id)).entries()];
  const luck = luckFromSeed(Math.imul(world.seed ^ m.id, 2654435761));
  const nightWatch = nightWatchActive(defender?.nightWatchStart ?? null, at.getTime());
  const result = resolveBattle({
    attackers: m.units, defenders: stacks.map(([, u]) => u), murusLevel: city.levels.murus, nightWatch, luck,
    baseDefense: cityBaseDefense(city.levels.murus),
  });

  for (const [i, [homeId]] of stacks.entries()) await removeFromStack(tx, homeId, city.id, result.defenderLosses[i] ?? {});

  const settled = settle(economy(city), at.getTime(), world.speed);
  let loot: Resources | null = null;
  let after: CityEconomy = settled;
  if (result.attackerWins) {
    loot = computeLoot(settled, storageCapacity(city.levels.horreum), PROTECTED_STORAGE_SHARE, carryCapacity(result.attackerSurvivors));
    after = { ...settled, ...addResources(settled, loot, -1) };
  }
  await saveEconomy(tx, city.id, after);

  const killedByAttacker = battlePoints(result.defenderLosses);
  const killedByDefender = battlePoints([result.attackerLosses]);
  if (killedByAttacker > 0) {
    await tx.update(players).set({ gloriaBattle: sql`${players.gloriaBattle} + ${killedByAttacker}` }).where(eq(players.id, m.playerId));
  }
  if (killedByDefender > 0 && city.playerId !== null) {
    await tx.update(players).set({ gloriaBattle: sql`${players.gloriaBattle} + ${killedByDefender}` }).where(eq(players.id, city.playerId));
  }
  await sendHome(tx, world, m, toSite, result.attackerSurvivors, loot, at);

  const data = {
    cityId: city.id, cityName: city.name, siteId: toSite.id,
    attacker: await playerName(tx, m.playerId), defender: await playerName(tx, city.playerId),
    attackerWins: result.attackerWins, attack: Math.round(result.attack), defense: Math.round(result.defense),
    luck, nightWatch, murus: city.levels.murus,
    attackers: m.units, attackerLosses: result.attackerLosses,
    defenders: sumUnits(stacks.map(([, u]) => u)), defenderLosses: sumUnits(result.defenderLosses), loot,
  };
  return [
    ...(await writeReport(tx, world, m.playerId, 'attack', data, at)),
    ...(await writeReport(tx, world, city.playerId, 'defense', data, at)),
    { playerId: city.playerId, message: { type: 'city_updated', cityId: city.id } },
    { playerId: m.playerId, message: { type: 'movements' } },
  ];
}

async function relationFor(tx: Tx, player: Pick<Player, 'id' | 'joinedAt'>, siteId: number) {
  await tx.insert(nativeRelations).values({
    playerId: player.id, siteId, standing: NATIVE.startStanding, standingAt: player.joinedAt, tributeAt: player.joinedAt,
  }).onConflictDoNothing();
  const [rel] = await tx.select().from(nativeRelations)
    .where(and(eq(nativeRelations.playerId, player.id), eq(nativeRelations.siteId, siteId))).for('update');
  return rel!;
}

async function arriveRaid(tx: Tx, at: Date, world: World, m: Movement, toSite: Site): Promise<Push[]> {
  const [player] = await tx.select().from(players).where(eq(players.id, m.playerId));
  const rel = await relationFor(tx, player!, toSite.id);
  const standing = standingAt(rel.standing, at.getTime() - rel.standingAt.getTime(), world.speed);
  const roundElapsed = at.getTime() - world.startsAt.getTime();
  const luck = luckFromSeed(Math.imul(world.seed ^ m.id, 2654435761));
  const result = resolveBattle({
    attackers: m.units, defenders: [], murusLevel: 0, nightWatch: false, luck,
    baseDefense: nativeGarrison(roundElapsed, world.speed),
  });
  let loot: Resources | null = null;
  if (result.attackerWins) {
    const each = Math.min(nativeHaul(roundElapsed, world.speed, standing), Math.floor(carryCapacity(result.attackerSurvivors) / 3));
    loot = { timber: each, stone: each, iron: each };
  }
  await tx.update(nativeRelations).set({ standing: Math.max(0, standing - NATIVE.raidStandingLoss), standingAt: at })
    .where(and(eq(nativeRelations.playerId, m.playerId), eq(nativeRelations.siteId, toSite.id)));
  await sendHome(tx, world, m, toSite, result.attackerSurvivors, loot, at);
  const data = {
    siteId: toSite.id, attacker: await playerName(tx, m.playerId), defender: null,
    attackerWins: result.attackerWins, attack: Math.round(result.attack), defense: Math.round(result.defense),
    luck, nightWatch: false, murus: 0, attackers: m.units, attackerLosses: result.attackerLosses,
    defenders: {}, defenderLosses: {}, loot,
  };
  return [
    ...(await writeReport(tx, world, m.playerId, 'raid', data, at)),
    { playerId: m.playerId, message: { type: 'movements' } },
  ];
}

export async function handleMovementArrive(tx: Tx, at: Date, world: World, payload: Record<string, number>): Promise<Push[]> {
  const [m] = await tx.select().from(movements).where(eq(movements.id, payload.movementId ?? -1)).for('update');
  if (!m || m.state !== 'moving') return [];
  await tx.update(movements).set({ state: 'done' }).where(eq(movements.id, m.id));
  const toSite = await siteById(tx, m.toSiteId);
  if (!toSite) return [];
  if (m.type === 'attack') return arriveAttack(tx, at, world, m, toSite);
  if (m.type === 'raid') return arriveRaid(tx, at, world, m, toSite);

  const [city] = await tx.select().from(cities).where(eq(cities.siteId, toSite.id)).for('update');
  if (!city) return [];
  if (m.type === 'support') {
    await addToStack(tx, m.homeCityId, city.id, m.units);
    return [
      { playerId: city.playerId, message: { type: 'city_updated', cityId: city.id } },
      { playerId: m.playerId, message: { type: 'movements' } },
    ];
  }
  // Return: troops rejoin their city and unload.
  await addToStack(tx, city.id, city.id, m.units);
  if (m.loot) {
    const settled = settle(economy(city), at.getTime(), world.speed);
    const cap = storageCapacity(city.levels.horreum);
    const next = { ...settled };
    for (const r of RESOURCES) next[r] = Math.max(settled[r], Math.min(cap, settled[r] + m.loot[r]));
    await saveEconomy(tx, city.id, next);
  }
  return [
    { playerId: city.playerId, message: { type: 'city_updated', cityId: city.id } },
    { playerId: m.playerId, message: { type: 'movements' } },
  ];
}

// --- Natives ------------------------------------------------------------------------

export async function collectTribute(tx: Tx, now: Date, world: World, player: Player, cityId: number): Promise<void> {
  const city = await lockOwnCity(tx, player.id, cityId);
  const [own] = await tx.select({ landmassId: sites.landmassId }).from(sites).where(eq(sites.id, city.siteId));
  const natives = await tx.select().from(sites).where(and(eq(sites.landmassId, own!.landmassId), eq(sites.kind, 'native')));
  let each = 0;
  for (const site of natives) {
    const rel = await relationFor(tx, player, site.id);
    const standing = standingAt(rel.standing, now.getTime() - rel.standingAt.getTime(), world.speed);
    each += tributeAccrued(standing, now.getTime() - rel.tributeAt.getTime(), world.speed);
    await tx.update(nativeRelations).set({ standing, standingAt: now, tributeAt: now })
      .where(and(eq(nativeRelations.playerId, player.id), eq(nativeRelations.siteId, site.id)));
  }
  const settled = settle(economy(city), now.getTime(), world.speed);
  const cap = storageCapacity(city.levels.horreum);
  const next = { ...settled };
  for (const r of RESOURCES) next[r] = Math.max(settled[r], Math.min(cap, settled[r] + each));
  await saveEconomy(tx, cityId, next);
}

// --- Views --------------------------------------------------------------------------

/** Everything military about one of the player's cities. */
export async function armyView(q: Q, player: Player, cityId: number, landmassId: number) {
  const here = await stacksIn(q, cityId);
  const supportHomes = [...here.keys()].filter((id) => id !== cityId);
  const names = supportHomes.length === 0 ? [] : await q.select({ id: cities.id, name: cities.name, playerId: cities.playerId })
    .from(cities).where(inArray(cities.id, supportHomes));
  const awayRows = await q.select({ cityId: unitStacks.cityId, name: cities.name, unitType: unitStacks.unitType, count: unitStacks.count })
    .from(unitStacks).innerJoin(cities, eq(cities.id, unitStacks.cityId))
    .where(and(eq(unitStacks.homeCityId, cityId), ne(unitStacks.cityId, cityId)));
  const away = new Map<number, { cityId: number; cityName: string; units: UnitCounts }>();
  for (const r of awayRows) {
    if (!isUnitId(r.unitType)) continue;
    const entry = away.get(r.cityId) ?? { cityId: r.cityId, cityName: r.name, units: {} };
    entry.units[r.unitType] = r.count;
    away.set(r.cityId, entry);
  }
  const training = await q.select({ order: recruitOrders, dueAt: gameEvents.dueAt }).from(recruitOrders)
    .leftJoin(gameEvents, eq(gameEvents.id, recruitOrders.eventId))
    .where(eq(recruitOrders.cityId, cityId)).orderBy(asc(recruitOrders.id));
  const nativeSites = await q.select({ id: sites.id }).from(sites).where(and(eq(sites.landmassId, landmassId), eq(sites.kind, 'native')));
  const rels = await q.select().from(nativeRelations).where(eq(nativeRelations.playerId, player.id));
  return {
    units: here.get(cityId) ?? {},
    support: await Promise.all(supportHomes.map(async (id) => {
      const c = names.find((n) => n.id === id);
      return { homeCityId: id, cityName: c?.name ?? '?', playerName: await playerName(q, c?.playerId ?? null), units: here.get(id)! };
    })),
    away: [...away.values()],
    unitPop: await homeUnitPop(q, cityId),
    recruitQueue: training.map(({ order, dueAt }) => ({
      id: order.id, building: order.building, unit: order.unitType as UnitId, count: order.count,
      startedAt: order.startedAt?.getTime() ?? null, dueAt: dueAt?.getTime() ?? null,
    })),
    natives: nativeSites.map((s) => {
      const rel = rels.find((r) => r.siteId === s.id);
      return {
        siteId: s.id, standing: rel?.standing ?? NATIVE.startStanding,
        standingAt: (rel?.standingAt ?? player.joinedAt).getTime(), tributeAt: (rel?.tributeAt ?? player.joinedAt).getTime(),
      };
    }),
  };
}

/** The player's own movements in full, and only type and arrival time of what is coming at them. */
export async function movementsView(q: Q, player: Player) {
  const own = await q.select().from(movements)
    .where(and(eq(movements.playerId, player.id), eq(movements.state, 'moving'))).orderBy(asc(movements.arriveAt));
  const incoming = await q.select({ id: movements.id, type: movements.type, toSiteId: movements.toSiteId, arriveAt: movements.arriveAt, cityId: cities.id })
    .from(movements).innerJoin(cities, eq(cities.siteId, movements.toSiteId))
    .where(and(eq(cities.playerId, player.id), eq(movements.state, 'moving'), ne(movements.playerId, player.id),
      inArray(movements.type, ['attack', 'support'])))
    .orderBy(asc(movements.arriveAt));
  return {
    own: own.map((m) => ({
      id: m.id, type: m.type, homeCityId: m.homeCityId, fromSiteId: m.fromSiteId, toSiteId: m.toSiteId,
      units: m.units, loot: m.loot, departAt: m.departAt.getTime(), arriveAt: m.arriveAt.getTime(),
    })),
    incoming: incoming.map((m) => ({ id: m.id, type: m.type, toSiteId: m.toSiteId, cityId: m.cityId, arriveAt: m.arriveAt.getTime() })),
  };
}

export async function listReports(q: Q, player: Player) {
  const rows = await q.select().from(reports).where(eq(reports.playerId, player.id)).orderBy(desc(reports.id)).limit(50);
  return rows.map((r) => ({ id: r.id, kind: r.kind, data: r.data, createdAt: r.createdAt.getTime(), read: r.readAt !== null }));
}

export async function markReportsRead(q: Q, player: Player, now: Date): Promise<void> {
  await q.update(reports).set({ readAt: now }).where(and(eq(reports.playerId, player.id), sql`${reports.readAt} is null`));
}
