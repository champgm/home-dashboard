import { PocController } from '../../src/application/pocController';
import type { DiscoverySnapshot } from '../../src/hap/discovery/coordinator';
import type { HapCandidate } from '../../src/hap/ports/contracts';

function candidate(key: string): HapCandidate {
  return {
    key,
    displayName: 'Thermostat 1',
    serviceType: '_hap._tcp',
    endpoint: {
      host: '192.168.50.40',
      port: 12345,
      interfaceId: 'wifi',
      addressFamily: 'ipv4',
      networkCidr: '192.168.50.0/24'
    },
    pairing: 'already-associated',
    generation: 1
  };
}

describe('POC controller candidate presentation', () => {
  it('keeps changing accessory identities uniquely selectable and clears stale selection on a fresh browse', () => {
    let publishSnapshot: (snapshot: DiscoverySnapshot) => void = () => undefined;
    const discovery = {
      subscribe(listener: (snapshot: DiscoverySnapshot) => void) {
        publishSnapshot = listener;
        listener({ generation: 0, candidates: [], running: false, networkAvailable: true });
        return () => undefined;
      },
      async start() {
        return { generation: 2, candidates: [], running: true, networkAvailable: true };
      },
      async stop() {}
    };
    const credentials = { loadPairing: async () => ({ ok: true as const, value: undefined }) };
    const controller = new PocController({ discovery, credentials } as never);

    publishSnapshot({ generation: 1, candidates: [candidate('old-id')], running: true, networkAvailable: true });
    controller.selectCandidate('Thermostat 1');
    expect(controller.getState().selected?.key).toBe('Thermostat 1');

    publishSnapshot({ generation: 1, candidates: [candidate('old-id'), candidate('new-id')], running: true, networkAvailable: true });
    expect(controller.getState().candidates.map((item) => item.key)).toEqual(['Thermostat 1', 'Thermostat 2']);

    controller.startDiscovery();
    expect(controller.getState().selected).toBeUndefined();
  });

  it('puts the stored paired accessory first and identifies it without exposing its identity', async () => {
    let publishSnapshot: (snapshot: DiscoverySnapshot) => void = () => undefined;
    const discovery = {
      subscribe(listener: (snapshot: DiscoverySnapshot) => void) {
        publishSnapshot = listener;
        listener({ generation: 0, candidates: [], running: false, networkAvailable: true });
        return () => undefined;
      },
      async start() {
        return { generation: 2, candidates: [], running: true, networkAvailable: true };
      },
      async stop() {}
    };
    const credentials = {
      loadPairing: async () => ({
        ok: true as const,
        value: { accessoryId: Buffer.from('paired-id').toString('base64') }
      })
    };
    const controller = new PocController({ discovery, credentials } as never);

    controller.startDiscovery();
    await Promise.resolve();
    await Promise.resolve();
    publishSnapshot({ generation: 2, candidates: [candidate('other-id'), candidate('paired-id')], running: true, networkAvailable: true });

    expect(controller.getState().candidates.map((item) => ({ label: item.label, paired: item.pairedToThisApp }))).toEqual([
      { label: 'Paired thermostat', paired: true },
      { label: 'Thermostat 1', paired: false }
    ]);
  });
});
