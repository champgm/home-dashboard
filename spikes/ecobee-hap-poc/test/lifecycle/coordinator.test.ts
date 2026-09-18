import { LifecycleCoordinator } from '../../src/application/lifecycleCoordinator';
import type { NetworkEndpoint } from '../../src/hap/ports/contracts';
import type { PairingRecord } from '../../src/hap/credentials/record';
import { FakeClock } from '../fakes/clock';
import { ok, failure } from '../../src/application/result';

const endpoint: NetworkEndpoint = { host: '192.168.50.40', port: 12345, interfaceId: 'wifi0', addressFamily: 'ipv4' };
const record = { schemaVersion: 1, accessoryId: b64(16, 1), accessoryLongTermPublicKey: b64(32, 2), controllerId: b64(16, 3), controllerLongTermPublicKey: b64(32, 4), controllerLongTermPrivateKey: b64(64, 5), pairedAtEpochMs: 1 } satisfies PairingRecord;

describe('foreground lifecycle recovery', () => {
  it('uses resolve -> verify -> refresh -> observation order and ignores stale epochs', async () => {
    const clock = new FakeClock();
    const order: string[] = [];
    const coordinator = new LifecycleCoordinator({
      resolvePairedEndpoint: async () => { order.push('resolve'); return endpoint; },
      loadPairing: async () => { order.push('load'); return record; },
      session: { connect: async () => { order.push('verify'); return ok(undefined); }, close: async () => undefined },
      enumerateAndRefresh: async () => { order.push('refresh'); },
      restoreObservation: async () => { order.push('observe'); },
      stopObservation: async () => { order.push('stop-observe'); }
    }, clock);
    expect((await coordinator.foreground()).ok).toBe(true);
    expect(order).toEqual(['resolve', 'load', 'verify', 'refresh', 'observe']);
    await coordinator.background();
    expect(coordinator.snapshot().state).toBe('background');
  });

  it('does not invoke pairing setup and uses bounded retry after a TCP refusal', async () => {
    const clock = new FakeClock();
    let connects = 0;
    const coordinator = new LifecycleCoordinator({
      resolvePairedEndpoint: async () => endpoint,
      loadPairing: async () => record,
      session: { connect: async () => { connects += 1; return { ok: false, error: failure('transport_error', 'tcp-refused', { retryable: true }) }; }, close: async () => undefined },
      enumerateAndRefresh: async () => undefined,
      restoreObservation: async () => undefined,
      stopObservation: async () => undefined
    }, clock);
    expect((await coordinator.foreground()).ok).toBe(false);
    await clock.advance(500);
    expect(connects).toBe(2);
    expect(coordinator.snapshot().retryCount).toBeGreaterThan(0);
  });
});

function b64(length: number, fill: number): string {
  let binary = '';
  for (let index = 0; index < length; index += 1) binary += String.fromCharCode(fill);
  return globalThis.btoa(binary);
}
