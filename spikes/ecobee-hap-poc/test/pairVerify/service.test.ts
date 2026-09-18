import { PairVerifyService } from '../../src/hap/core/pairVerify/pairVerifyService';
import { CredentialStoreService } from '../../src/hap/credentials/secureStore';
import { MemorySecureValueStore } from '../fakes/memoryStore';
import { SodiumCryptoProvider } from '../../src/hap/crypto/sodiumProvider';
import type { PairingRecord } from '../../src/hap/credentials/record';
import type { HapResponse } from '../../src/hap/ports/contracts';
import type { PairVerifyTransport } from '../../src/hap/core/pairVerify/pairVerifyService';

const record: PairingRecord = {
  schemaVersion: 1,
  accessoryId: b64(16, 1),
  accessoryLongTermPublicKey: b64(32, 2),
  controllerId: b64(16, 3),
  controllerLongTermPublicKey: b64(32, 4),
  controllerLongTermPrivateKey: b64(64, 5),
  pairedAtEpochMs: 1
};

describe('Pair Verify failure semantics', () => {
  it('preserves the durable record and marks repair-required on rejection', async () => {
    const store = new MemorySecureValueStore();
    const credentials = new CredentialStoreService(store, new SodiumCryptoProvider());
    await credentials.stagePairing(record);
    await credentials.commitStagedPairing();
    const transport = new FakeTransport();
    const result = await new PairVerifyService(new SodiumCryptoProvider(), credentials).run(transport, record);
    expect(result.ok).toBe(false);
    expect((await credentials.inspectPairing()).state).toBe('repair-required');
    expect(store.values.has('ecobee-hap-poc.v1.pairing.committed')).toBe(true);
    expect(transport.closed).toBe(true);
  });
});

class FakeTransport implements PairVerifyTransport {
  generation = 1;
  closed = false;
  async request(): Promise<HapResponse> { return { statusCode: 200, headers: {}, body: new Uint8Array([6, 1, 2]) }; }
  async close(): Promise<void> { this.closed = true; }
  setSessionKeys(): void { /* not reached */ }
}

function b64(length: number, fill: number): string {
  let binary = '';
  for (let index = 0; index < length; index += 1) binary += String.fromCharCode(fill);
  return globalThis.btoa(binary);
}
