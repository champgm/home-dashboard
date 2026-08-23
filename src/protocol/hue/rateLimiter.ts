export type HuePacingChannel = "light-state" | "group-action";

export interface PacingClock {
  now(): number;
  sleep(ms: number): Promise<void>;
}

const realClock: PacingClock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

export class HueRateLimiter {
  private readonly clock: PacingClock;
  private readonly minimumMs: Record<HuePacingChannel, number>;
  private lastDispatch: Partial<Record<HuePacingChannel, number>> = {};
  private queues: Record<HuePacingChannel, Promise<void>> = {
    "light-state": Promise.resolve(),
    "group-action": Promise.resolve(),
  };

  constructor(clock: PacingClock = realClock) {
    this.clock = clock;
    this.minimumMs = { "light-state": 100, "group-action": 1000 };
  }

  async wait(channel: HuePacingChannel): Promise<void> {
    const prior = this.queues[channel];
    let release!: () => void;
    this.queues[channel] = new Promise<void>((resolve) => { release = resolve; });
    await prior;
    try {
      const previous = this.lastDispatch[channel];
      if (previous !== undefined) {
        const remaining = this.minimumMs[channel] - (this.clock.now() - previous);
        if (remaining > 0) {
          await this.clock.sleep(remaining);
        }
      }
      // Set the timestamp at dispatch, before the caller starts the request.
      this.lastDispatch[channel] = this.clock.now();
    } finally {
      release();
    }
  }

  async dispatch<T>(channel: HuePacingChannel, operation: () => Promise<T>): Promise<T> {
    await this.wait(channel);
    return operation();
  }

  getLastDispatch(channel: HuePacingChannel): number | undefined {
    return this.lastDispatch[channel];
  }
}
