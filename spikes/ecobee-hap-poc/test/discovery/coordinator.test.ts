import { DiscoveryCoordinator } from '../../src/hap/discovery/coordinator';
import { FakeClock } from '../fakes/clock';

describe('discovery generation and deduplication', () => {
  it('deduplicates repeated service-up events and discards stale generations', async () => {
    let events: Record<string, (service: any) => void> = {};
    const adapter = {
      async start(_type: '_hap._tcp', callbacks: any) { events = callbacks; },
      async stop() { /* no-op */ }
    };
    let network = { available: true, activeInterfaceIds: ['wifi0'], ipv4Cidrs: ['192.168.50.0/24'] };
    const coordinator = new DiscoveryCoordinator(adapter, () => network, new FakeClock());
    await coordinator.start();
    const service = { name: 'mutable', type: '_hap._tcp.', domain: 'local.', hostName: 'thermostat.local.', addresses: ['192.168.50.40'], port: 12345, txt: { 'c#': '1', 's#': '1', sf: '1', id: 'opaque-id', pv: '1.1', ci: '9' }, interfaceId: 'wifi0' };
    events.found(service);
    events.found(service);
    expect(coordinator.snapshot().candidates).toHaveLength(1);
    const endpoint = coordinator.snapshot().candidates[0]!.endpoint;
    expect(coordinator.isEndpointCurrent(endpoint)).toBe(true);
    network = { available: false, activeInterfaceIds: [], ipv4Cidrs: [] };
    expect(coordinator.isEndpointCurrent(endpoint)).toBe(false);
    await coordinator.stop();
    events.found(service);
    expect(coordinator.snapshot().candidates).toHaveLength(0);
  });

  it.each(['1', '8', '17'])('ignores known non-thermostat category %s', async (category) => {
    let found: ((service: any) => void) | undefined;
    const adapter = {
      async start(_type: '_hap._tcp', callbacks: any) { found = callbacks.found; },
      async stop() { /* no-op */ }
    };
    const coordinator = new DiscoveryCoordinator(
      adapter,
      () => ({ available: true, activeInterfaceIds: ['wifi0'], ipv4Cidrs: ['192.168.50.0/24'] }),
      new FakeClock()
    );
    await coordinator.start();
    found?.({ name: 'other', type: '_hap._tcp', domain: 'local.', hostName: 'other.local.', addresses: ['192.168.50.40'], port: 12345, txt: { 'c#': '1', 's#': '1', sf: '1', id: 'other-id', pv: '1.1', ci: category }, interfaceId: 'wifi0' });
    expect(coordinator.snapshot().candidates).toHaveLength(0);
  });

  it('removes an existing candidate when an update is no longer category 9', async () => {
    let changed: ((service: any) => void) | undefined;
    const adapter = {
      async start(_type: '_hap._tcp', callbacks: any) { changed = callbacks.changed; },
      async stop() { /* no-op */ }
    };
    const coordinator = new DiscoveryCoordinator(
      adapter,
      () => ({ available: true, activeInterfaceIds: ['wifi0'], ipv4Cidrs: ['192.168.50.0/24'] }),
      new FakeClock()
    );
    await coordinator.start();
    const base = { name: 'mutable', type: '_hap._tcp', domain: 'local.', hostName: 'mutable.local.', addresses: ['192.168.50.40'], port: 12345, txt: { 'c#': '1', 's#': '1', sf: '1', id: 'mutable-id', pv: '1.1' }, interfaceId: 'wifi0' };
    changed?.({ ...base, txt: { ...base.txt, ci: '9' } });
    expect(coordinator.snapshot().candidates).toHaveLength(1);
    changed?.({ ...base, txt: { ...base.txt, ci: '8' } });
    expect(coordinator.snapshot().candidates).toHaveLength(0);
  });

  it.each([
    ['missing', undefined],
    ['malformed', 'not-a-category'],
    ['unknown numeric', '99']
  ])('fails closed for %s category metadata', async (_label, category) => {
    let found: ((service: any) => void) | undefined;
    const adapter = {
      async start(_type: '_hap._tcp', callbacks: any) { found = callbacks.found; },
      async stop() { /* no-op */ }
    };
    const coordinator = new DiscoveryCoordinator(
      adapter,
      () => ({ available: true, activeInterfaceIds: ['wifi0'], ipv4Cidrs: ['192.168.50.0/24'] }),
      new FakeClock()
    );
    await coordinator.start();
    found?.({ name: 'unclassified', type: '_hap._tcp', domain: 'local.', hostName: 'unclassified.local.', addresses: ['192.168.50.40'], port: 12345, txt: { 'c#': '1', 's#': '1', sf: '1', id: 'unclassified-id', pv: '1.1', ...(category === undefined ? {} : { ci: category }) }, interfaceId: 'wifi0' });
    expect(coordinator.snapshot().candidates).toHaveLength(0);
  });

  it('does not start discovery without an active Wi-Fi snapshot', async () => {
    let started = false;
    const adapter = {
      async start() { started = true; },
      async stop() { /* no-op */ }
    };
    const coordinator = new DiscoveryCoordinator(adapter, () => ({ available: false, activeInterfaceIds: [], ipv4Cidrs: [] }), new FakeClock());
    await expect(coordinator.start()).rejects.toThrow('active Wi-Fi network unavailable');
    expect(started).toBe(false);
    expect(coordinator.snapshot().networkAvailable).toBe(false);
  });

  it('retains resolved candidates when the bounded browse window completes', async () => {
    let found: ((service: any) => void) | undefined;
    let stops = 0;
    const adapter = {
      async start(_type: '_hap._tcp', callbacks: any) { found = callbacks.found; },
      async stop() { stops += 1; }
    };
    const clock = new FakeClock();
    const coordinator = new DiscoveryCoordinator(
      adapter,
      () => ({ available: true, activeInterfaceIds: ['wifi0'], ipv4Cidrs: ['192.168.50.0/24'] }),
      clock,
      undefined,
      15_000
    );
    await coordinator.start();
    found?.({ name: 'target', type: '_hap._tcp', domain: 'local.', hostName: 'target.local.', addresses: ['192.168.50.40'], port: 12345, txt: { 'c#': '1', 's#': '1', sf: '1', id: 'target-id', pv: '1.1', ci: '9' }, interfaceId: 'wifi0' });

    await clock.advance(15_000);

    expect(stops).toBe(1);
    expect(coordinator.snapshot()).toMatchObject({ running: false, candidates: [{ key: 'target-id' }] });
  });
});
