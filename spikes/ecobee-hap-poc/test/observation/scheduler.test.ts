import { ForegroundPollScheduler } from '../../src/hap/core/events/observation';
import { FakeClock } from '../fakes/clock';

describe('foreground observation polling', () => {
  it('does not overlap, stops cleanly, and backs off boundedly', async () => {
    const clock = new FakeClock();
    let reads = 0;
    let release!: () => void;
    const blocker = new Promise<void>((resolve) => { release = resolve; });
    const scheduler = new ForegroundPollScheduler({ intervalMs: 100, maxIntervalMs: 400, clock, read: async () => { reads += 1; if (reads === 1) await blocker; } });
    scheduler.start();
    await clock.advance(0);
    expect(reads).toBe(1);
    await clock.advance(400);
    expect(reads).toBe(1);
    release();
    await Promise.resolve();
    await Promise.resolve();
    await clock.advance(100);
    expect(reads).toBe(2);
    scheduler.stop();
    expect(clock.pendingCount()).toBe(0);
  });

  it('does not create a second timer when started twice', () => {
    const clock = new FakeClock();
    const scheduler = new ForegroundPollScheduler({ intervalMs: 100, maxIntervalMs: 400, clock, read: async () => undefined });
    scheduler.start();
    scheduler.start();
    expect(clock.pendingCount()).toBe(1);
    scheduler.stop();
  });
});
