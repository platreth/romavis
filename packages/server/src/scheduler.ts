import { and, asc, eq, isNull, lte, min } from 'drizzle-orm';
import { handleBuildDone } from './city.ts';
import { handleMovementArrive, handleRecruitDone } from './military.ts';
import { userIdOfPlayer, type Push } from './stacks.ts';
import type { Clock } from './clock.ts';
import type { Db } from './db/client.ts';
import { gameEvents, worlds } from './db/schema.ts';

export type Notify = (userId: number, message: Push['message']) => void;

const MAX_SLEEP_MS = 30_000;

/**
 * Processes due events one at a time, in (due_at, id) order, each in its own transaction,
 * using the event's due time as the effective time. Postgres is the only state: after a
 * restart, or after downtime, the same loop simply catches up in order.
 */
export class Scheduler {
  private chain: Promise<void> = Promise.resolve();
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private db: Db, private clock: Clock, private notify: Notify = () => {}) {}

  /** Process everything due now. Calls are serialised; callers can await to be sure the world is caught up. */
  processDue(): Promise<void> {
    const run = this.chain.then(() => this.drain());
    this.chain = run.catch(() => {});
    return run;
  }

  private async drain(): Promise<void> {
    for (;;) {
      const now = this.clock.now();
      const outcome = await this.db.transaction(async (tx) => {
        const [event] = await tx.select().from(gameEvents)
          .where(and(isNull(gameEvents.doneAt), lte(gameEvents.dueAt, now)))
          .orderBy(asc(gameEvents.dueAt), asc(gameEvents.id)).limit(1)
          .for('update', { skipLocked: true });
        if (!event) return null;
        const [world] = await tx.select().from(worlds).where(eq(worlds.id, event.worldId));
        let pushes: Push[] = [];
        if (world) {
          if (event.type === 'build_done') pushes = await handleBuildDone(tx, event.dueAt, world.speed, event.payload);
          else if (event.type === 'recruit_done') pushes = await handleRecruitDone(tx, event.dueAt, world.speed, event.payload);
          else if (event.type === 'movement_arrive') pushes = await handleMovementArrive(tx, event.dueAt, world, event.payload);
        }
        await tx.update(gameEvents).set({ doneAt: now }).where(eq(gameEvents.id, event.id));
        return { pushes };
      });
      if (!outcome) return;
      await this.push(outcome.pushes);
    }
  }

  /** Deliver refetch hints to the players' open clients. */
  async push(pushes: Push[]): Promise<void> {
    const seen = new Set<string>();
    for (const p of pushes) {
      const key = `${p.playerId}:${p.message.type}:${p.message.cityId ?? ''}`;
      if (p.playerId === null || seen.has(key)) continue;
      seen.add(key);
      const userId = await userIdOfPlayer(this.db, p.playerId);
      if (userId !== null) this.notify(userId, p.message);
    }
  }

  /** Start the background loop: process, then sleep until the next event is due. */
  start(): void {
    this.running = true;
    void this.tick();
  }

  /** Call after inserting an event that may be due sooner than the current sleep. */
  wake(): void {
    if (this.running) void this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    try {
      await this.processDue();
    } catch (err) {
      console.error('scheduler error', err);
    }
    if (!this.running) return;
    let delay = MAX_SLEEP_MS;
    try {
      const [next] = await this.db.select({ at: min(gameEvents.dueAt) }).from(gameEvents).where(isNull(gameEvents.doneAt));
      if (next?.at) delay = Math.min(MAX_SLEEP_MS, Math.max(0, new Date(next.at).getTime() - this.clock.now().getTime()));
    } catch (err) {
      console.error('scheduler error', err);
    }
    if (!this.running) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.tick(), delay + 5);
  }
}
