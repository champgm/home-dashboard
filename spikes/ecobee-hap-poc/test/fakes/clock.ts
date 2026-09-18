import type { Clock } from '../../src/hap/ports/contracts';

export class FakeClock implements Clock {
  nowValue = 0;
  private nextId = 1;
  private timers = new Map<number, { at: number; callback: () => void }>();
  now(): number { return this.nowValue; }
  setTimeout(callback: () => void, delayMs: number): number {
    const id = this.nextId++;
    this.timers.set(id, { at: this.nowValue + delayMs, callback });
    return id;
  }
  clearTimeout(handle: unknown): void { this.timers.delete(handle as number); }
  async advance(ms: number): Promise<void> {
    this.nowValue += ms;
    const due = [...this.timers.entries()].filter(([, timer]) => timer.at <= this.nowValue).sort(([, a], [, b]) => a.at - b.at);
    for (const [id, timer] of due) {
      this.timers.delete(id);
      timer.callback();
      await Promise.resolve();
    }
  }
  pendingCount(): number { return this.timers.size; }
}
