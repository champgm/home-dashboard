export interface MonotonicClock {
  now(): number;
  setInterval(callback: () => void, ms: number): unknown;
  clearInterval(handle: unknown): void;
}

const realClock: MonotonicClock = {
  now: () => (globalThis.performance?.now ? globalThis.performance.now() : Date.now()),
  setInterval: (callback, ms) => setInterval(callback, ms),
  clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

export class RefreshScheduler {
  private readonly clock: MonotonicClock;
  private readonly refresh: () => Promise<void> | void;
  private interval?: unknown;
  private lastOpportunity?: number;

  constructor(refresh: () => Promise<void> | void, clock: MonotonicClock = realClock) {
    this.refresh = refresh;
    this.clock = clock;
  }

  start(): void {
    this.stop();
    this.lastOpportunity = this.clock.now();
    this.interval = this.clock.setInterval(() => {
      this.lastOpportunity = this.clock.now();
      void this.refresh();
    }, 5000);
  }

  stop(): void {
    if (this.interval !== undefined) {
      this.clock.clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  get running(): boolean {
    return this.interval !== undefined;
  }

  get lastOpportunityAt(): number | undefined {
    return this.lastOpportunity;
  }
}
