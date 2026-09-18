import { LifecycleCoordinator } from '../../src/application/lifecycleCoordinator';
import { FakeClock } from '../fakes/clock';

describe('recovery generation ownership', () => {
  it('does not publish old work after background invalidates the epoch', async () => {
    let resolveEndpoint!: (value: undefined) => void;
    const endpoint = new Promise<undefined>((resolve) => { resolveEndpoint = resolve; });
    const coordinator = new LifecycleCoordinator({
      resolvePairedEndpoint: async () => endpoint,
      loadPairing: async () => undefined,
      session: { connect: async () => { throw new Error('must not connect'); }, close: async () => undefined },
      enumerateAndRefresh: async () => undefined,
      restoreObservation: async () => undefined,
      stopObservation: async () => undefined
    }, new FakeClock());
    const foreground = coordinator.foreground();
    await coordinator.background();
    resolveEndpoint(undefined);
    expect((await foreground).ok).toBe(false);
    expect(coordinator.snapshot().state).toBe('background');
  });
});
