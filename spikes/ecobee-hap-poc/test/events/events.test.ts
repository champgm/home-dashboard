import { ObservationCoordinator } from '../../src/hap/core/events/observation';
import { FakeClock } from '../fakes/clock';

describe('HAP event observation', () => {
  it('subscribes only to event-capable characteristics and falls back when rejected', async () => {
    const calls: string[] = [];
    const events = { subscribe: async (targets: readonly { iid: number }[]) => { calls.push(`subscribe:${targets.map((target) => target.iid).join(',')}`); throw new Error('rejected'); }, unsubscribe: async () => { calls.push('unsubscribe'); }, onEvent: () => () => undefined };
    const coordinator = new ObservationCoordinator(events, new FakeClock(), async () => undefined);
    const policy = await coordinator.start({ aid: 1, serviceIid: 2, capabilities: [
      { key: 'currentTemperature', characteristic: { aid: 1, iid: 3, type: 'temperature', format: 'float', perms: ['pr', 'ev'], eventCapable: true }, status: 'available' },
      { key: 'targetTemperature', characteristic: { aid: 1, iid: 4, type: 'target', format: 'float', perms: ['pr'], eventCapable: false }, status: 'available' }
    ] }, 7);
    expect(policy.mode).toBe('foreground-polling');
    expect(calls).toEqual(['subscribe:3']);
    await coordinator.stop();
  });
});
