/** All game code takes "now" from a clock so tests and tools can control time. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

export class TestClock implements Clock {
  constructor(private t: number = Date.UTC(2026, 0, 1)) {}
  now(): Date {
    return new Date(this.t);
  }
  advance(ms: number): void {
    this.t += ms;
  }
}
