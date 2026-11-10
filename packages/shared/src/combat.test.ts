import { describe, expect, it } from 'vitest';
import {
  UNITS, UNIT_DEFS, addUnits, battlePoints, cityBaseDefense, computeLoot, count, luckFromSeed, nativeGarrison,
  nightWatchActive, planMovement, recruitSeconds, resolveBattle, standingAt, totalUnits, travelSeconds,
  tributeAccrued, unitPopulation, type UnitCounts,
} from './index.ts';

const battle = (attackers: UnitCounts, defenders: UnitCounts[], over: Partial<Parameters<typeof resolveBattle>[0]> = {}) =>
  resolveBattle({ attackers, defenders, murusLevel: 0, nightWatch: false, luck: 0, baseDefense: 0, ...over });

describe('battle formula', () => {
  it('an even fight costs both sides half and the attacker does not win', () => {
    // 100 hastati attack 100 hastati: attack 1000 vs defence vs infantry 1000.
    const r = battle({ hastatus: 100 }, [{ hastatus: 100 }]);
    expect(r.ratio).toBeCloseTo(1);
    expect(r.attackerWins).toBe(false);
    expect(r.attackerLosses).toEqual({ hastatus: 50 });
    expect(r.defenderLosses).toEqual([{ hastatus: 50 }]);
  });

  it('wipes out the loser at a ratio of about 1.6 and spares most of the winner', () => {
    const r = battle({ hastatus: 200 }, [{ hastatus: 100 }]);
    expect(r.attackerWins).toBe(true);
    expect(r.defenderLosses).toEqual([{ hastatus: 100 }]);
    expect(count(r.attackerLosses, 'hastatus')).toBe(Math.round(200 * 0.5 * 2 ** -1.5));
  });

  it('weights defence by what is attacking', () => {
    const vsCavalry = battle({ eques: 50 }, [{ triarius: 100 }]);
    const vsArchers = battle({ sagittarius: 175 }, [{ triarius: 100 }]);
    expect(vsCavalry.defense).toBe(2000);
    expect(vsArchers.defense).toBe(600);
  });

  it('applies wall, night watch, base defence and luck', () => {
    const plain = battle({ hastatus: 100 }, [{ hastatus: 50 }]);
    expect(battle({ hastatus: 100 }, [{ hastatus: 50 }], { murusLevel: 10 }).defense).toBeCloseTo(plain.defense * 1.4);
    expect(battle({ hastatus: 100 }, [{ hastatus: 50 }], { nightWatch: true }).defense).toBe(plain.defense * 2);
    expect(battle({ hastatus: 100 }, [], { baseDefense: cityBaseDefense(3) }).defense).toBe(80);
    expect(battle({ hastatus: 100 }, [{ hastatus: 50 }], { luck: 0.1 }).attack).toBeCloseTo(1100);
  });

  it('never loses more than was sent, never loses ships, and is monotonic in strength', () => {
    let previous = Infinity;
    for (let n = 10; n <= 400; n += 10) {
      const r = battle({ hastatus: n, eques: 5, oneraria: 4 }, [{ triarius: 60 }, { sagittarius: 40 }], { baseDefense: 40 });
      for (const id of UNITS) {
        expect(count(r.attackerLosses, id)).toBeLessThanOrEqual(count({ hastatus: n, eques: 5, oneraria: 4 }, id));
        expect(count(r.attackerSurvivors, id)).toBeGreaterThanOrEqual(0);
      }
      expect(count(r.attackerSurvivors, 'oneraria')).toBe(4);
      expect(totalUnits(addUnits(r.attackerSurvivors, r.attackerLosses))).toBe(n + 9);
      expect(r.attackerLossShare).toBeLessThanOrEqual(previous + 1e-9);
      previous = r.attackerLossShare;
    }
  });

  it('an undefended, wall-less target falls without losses', () => {
    const r = battle({ hastatus: 10 }, []);
    expect(r.attackerWins).toBe(true);
    expect(r.attackerLosses).toEqual({});
  });

  it('counts battle points as population destroyed', () => {
    expect(battlePoints([{ hastatus: 10 }, { eques: 2 }])).toBe(16);
    expect(unitPopulation({ oneraria: 2 })).toBe(10);
  });

  it('luck is deterministic and within range', () => {
    for (let s = 0; s < 500; s++) {
      expect(Math.abs(luckFromSeed(s))).toBeLessThanOrEqual(0.1);
      expect(luckFromSeed(s)).toBe(luckFromSeed(s));
    }
    expect(new Set(Array.from({ length: 50 }, (_, s) => luckFromSeed(s))).size).toBeGreaterThan(40);
  });
});

describe('loot', () => {
  it('splits capacity evenly and leaves the protected share', () => {
    expect(computeLoot({ timber: 1000, stone: 1000, iron: 1000 }, 1200, 0.1, 300)).toEqual({ timber: 100, stone: 100, iron: 100 });
    expect(computeLoot({ timber: 1000, stone: 1000, iron: 1000 }, 1200, 0.1, 1e6)).toEqual({ timber: 880, stone: 880, iron: 880 });
  });
  it('gives what one resource lacks to the others and never exceeds capacity', () => {
    const loot = computeLoot({ timber: 150, stone: 1000, iron: 1000 }, 1000, 0.1, 600);
    expect(loot.timber).toBe(50);
    expect(loot.timber + loot.stone + loot.iron).toBeLessThanOrEqual(600);
    expect(loot.timber + loot.stone + loot.iron).toBeGreaterThanOrEqual(598);
    expect(computeLoot({ timber: 50, stone: 50, iron: 50 }, 1000, 0.1, 600)).toEqual({ timber: 0, stone: 0, iron: 0 });
  });
});

describe('movement', () => {
  it('travels by land at the slowest unit, by sea at ship speed', () => {
    expect(planMovement({ hastatus: 10, eques: 5 }, true, true)).toEqual({ ok: true, speed: UNIT_DEFS.hastatus.speed });
    expect(planMovement({ triarius: 1, eques: 5 }, true, true)).toEqual({ ok: true, speed: 5 });
    expect(planMovement({ hastatus: 25, oneraria: 1 }, false, true)).toEqual({ ok: true, speed: 10 });
  });
  it('rejects bad compositions', () => {
    expect(planMovement({}, true, true)).toEqual({ ok: false, error: 'no_units' });
    expect(planMovement({ oneraria: 2 }, false, true)).toEqual({ ok: false, error: 'no_combat_units' });
    expect(planMovement({ hastatus: 5, oneraria: 1 }, true, true)).toEqual({ ok: false, error: 'ships_not_needed' });
    expect(planMovement({ hastatus: 26, oneraria: 1 }, false, true)).toEqual({ ok: false, error: 'not_enough_ships' });
    expect(planMovement({ eques: 9, oneraria: 1 }, false, true)).toEqual({ ok: false, error: 'not_enough_ships' });
  });
  it('computes travel and recruitment times', () => {
    expect(travelSeconds(12, 6, 1)).toBe(7200);
    expect(travelSeconds(12, 6, 2)).toBe(3600);
    expect(recruitSeconds('hastatus', 10, 1, 1)).toBe(3000);
    expect(recruitSeconds('hastatus', 10, 11, 2)).toBeLessThan(1500);
  });
});

describe('night watch and natives', () => {
  it('covers eight hours from the chosen hour, across midnight', () => {
    const at = (h: number) => Date.UTC(2026, 0, 1, h, 30);
    expect(nightWatchActive(null, at(3))).toBe(false);
    expect(nightWatchActive(22, at(22))).toBe(true);
    expect(nightWatchActive(22, at(5))).toBe(true);
    expect(nightWatchActive(22, at(6))).toBe(false);
    expect(nightWatchActive(22, at(21))).toBe(false);
  });
  it('tribute accrues with standing and stops at the cap', () => {
    expect(tributeAccrued(100, 3_600_000, 1)).toBe(12);
    expect(tributeAccrued(50, 3_600_000, 1)).toBe(6);
    expect(tributeAccrued(100, 100 * 3_600_000, 1)).toBe(96);
    expect(standingAt(60, 10 * 3_600_000, 1)).toBe(75);
    expect(standingAt(60, 1000 * 3_600_000, 1)).toBe(100);
    expect(nativeGarrison(10 * 86_400_000, 1)).toBeGreaterThan(nativeGarrison(0, 1));
  });
});
