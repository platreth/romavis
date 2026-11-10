// Economy simulator: plays a simple scripted player through a round and prints the timeline.
// Run with `pnpm sim [speed]`. Uses the same rules as the server.
import { pathToFileURL } from 'node:url';
import {
  BUILDINGS, BUILDING_DEFS, ROUND_DAYS, START_LEVELS, START_RESOURCES, addResources, buildTimeSeconds,
  buildingPoints, checkBuild, plannedLevels, populationCap, populationUsed, productionRates, settle,
  storageCapacity, type BuildingId, type CityEconomy, type QueueItem,
} from './index.ts';

export interface SimResult {
  /** Seconds at which each building first reached each level. */
  reached: Record<string, number>;
  finalLevels: Record<BuildingId, number>;
  points: number;
}

/** Scripted player: checks in every `checkEverySec`, fills the queue with the lowest-level useful building. */
export function simulate(speed: number, days = ROUND_DAYS, checkEverySec = 1800): SimResult {
  let city: CityEconomy = { ...START_RESOURCES, resourcesAt: 0, levels: { ...START_LEVELS } };
  let queue: (QueueItem & { doneAt: number })[] = [];
  const reached: Record<string, number> = {};
  const end = days * 86400;
  const enabled = BUILDINGS.filter((b) => BUILDING_DEFS[b].enabled);

  const pick = (): BuildingId | null => {
    const planned = plannedLevels(city.levels, queue);
    const candidates = [...enabled].sort((a, b) => planned[a] - planned[b]);
    // Population or storage about to block: fix that first.
    if (populationCap(planned.fundus) - populationUsed(planned) < 6) candidates.unshift('fundus');
    for (const b of candidates) if (checkBuild(city, queue, b).ok) return b;
    return null;
  };

  for (let t = 0; t <= end; t += checkEverySec) {
    // Complete finished orders in order, at their own completion time.
    while (queue[0] && queue[0].doneAt <= t) {
      const done = queue.shift()!;
      city = settle(city, done.doneAt * 1000, speed);
      city = { ...city, levels: { ...city.levels, [done.building]: done.targetLevel } };
      reached[`${done.building}:${done.targetLevel}`] = done.doneAt;
    }
    city = settle(city, t * 1000, speed);
    for (let b = pick(); b; b = pick()) {
      const check = checkBuild(city, queue, b);
      if (!check.ok) break;
      city = { ...city, ...addResources(city, check.cost, -1) };
      const startsAt = queue.length ? queue[queue.length - 1]!.doneAt : t;
      const forum = plannedLevels(city.levels, queue).forum;
      queue.push({ building: b, targetLevel: check.targetLevel, doneAt: startsAt + buildTimeSeconds(b, check.targetLevel, forum, speed) });
    }
  }
  return { reached, finalLevels: city.levels, points: buildingPoints(city.levels) };
}

const fmt = (s: number | undefined) => (s === undefined ? '   never' : `${(s / 86400).toFixed(2).padStart(6)} d`);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const speed = Number(process.argv[2] ?? 1);
  const r = simulate(speed);
  console.log(`Romavis economy simulation: speed ${speed}, ${ROUND_DAYS} days, player checks in every 30 min\n`);
  console.log('level   ' + BUILDINGS.filter((b) => BUILDING_DEFS[b].enabled).map((b) => b.padStart(11)).join(''));
  for (const lvl of [2, 3, 5, 8, 10, 12, 15, 18, 20]) {
    console.log(String(lvl).padEnd(8) + BUILDINGS.filter((b) => BUILDING_DEFS[b].enabled).map((b) => fmt(r.reached[`${b}:${lvl}`]).padStart(11)).join(''));
  }
  const rates = productionRates(r.finalLevels, speed);
  console.log(`\nfinal levels: ${JSON.stringify(r.finalLevels)}`);
  console.log(`final production/h: ${Math.round(rates.timber)} / ${Math.round(rates.stone)} / ${Math.round(rates.iron)}, storage ${storageCapacity(r.finalLevels.horreum)}, points ${r.points}`);
}
