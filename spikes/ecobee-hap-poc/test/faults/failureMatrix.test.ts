import { validateLocalEndpoint } from '../../src/hap/discovery/endpointPolicy';
import { CredentialStoreService } from '../../src/hap/credentials/secureStore';
import { SodiumCryptoProvider } from '../../src/hap/crypto/sodiumProvider';
import { MemorySecureValueStore } from '../fakes/memoryStore';
import { SetpointCommandService, type SetpointWriter } from '../../src/application/setpointCommand';
import { parseAccessoryDatabase } from '../../src/hap/core/accessories/enumeration';
import { projectThermostat } from '../../src/hap/core/accessories/thermostatProjection';
import type { HapSessionApi } from '../../src/hap/ports/contracts';

describe('negative failure matrix', () => {
  it('rejects public, loopback, unspecified, and off-interface endpoints', () => {
    const network = { available: true, activeInterfaceIds: ['wifi0'], ipv4Cidrs: [] };
    expect(validateLocalEndpoint('8.8.8.8', 123, 'wifi0', network).ok).toBe(false);
    expect(validateLocalEndpoint('127.0.0.1', 123, 'wifi0', network).ok).toBe(false);
    expect(validateLocalEndpoint('0.0.0.0', 123, 'wifi0', network).ok).toBe(false);
    expect(validateLocalEndpoint('192.168.1.2', 123, 'other', network).ok).toBe(false);
  });

  it('keeps corrupt protected storage repair-required and does not replace it', async () => {
    const store = new MemorySecureValueStore();
    await store.set('ecobee-hap-poc.v1.controller', '{"schemaVersion":999}');
    const service = new CredentialStoreService(store, new SodiumCryptoProvider());
    const result = await service.ensureControllerIdentity();
    expect(result.ok).toBe(false);
    expect(store.values.get('ecobee-hap-poc.v1.controller')).toContain('999');
  });

  it('does not replay a possible-send command after read-back mismatch', async () => {
    const projection = projectThermostat(parseAccessoryDatabase({ accessories: [{ aid: 1, services: [{ iid: 2, type: '4A', characteristics: [{ iid: 3, type: '11', format: 'float', perms: ['pr'] }, { iid: 4, type: '35', format: 'float', minValue: 10, maxValue: 35, minStep: 0.5, perms: ['pr', 'pw'] }] }] }] }));
    let writes = 0;
    const writer: SetpointWriter = { read: async () => ({ kind: 'value', value: 20 }), write: async () => { writes += 1; return { kind: 'possible-send' }; } };
    const result = await new SetpointCommandService(writer).execute({ generation: 1 } as HapSessionApi, projection, 22, { min: 16, max: 30, unit: 'celsius' }, true, 1);
    expect(result.ok && result.value.status).toBe('ambiguous');
    expect(writes).toBe(1);
  });
});
