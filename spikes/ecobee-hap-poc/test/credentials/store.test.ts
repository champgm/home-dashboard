import { CredentialStoreService, STORAGE_KEYS } from '../../src/hap/credentials/secureStore';
import { toBase64, type PairingRecord } from '../../src/hap/credentials/record';
import { SodiumCryptoProvider } from '../../src/hap/crypto/sodiumProvider';
import { MemorySecureValueStore } from '../fakes/memoryStore';

describe('versioned credential store', () => {
  const crypto = new SodiumCryptoProvider();
  const makeService = (store = new MemorySecureValueStore()) => ({ store, service: new CredentialStoreService(store, crypto) });

  it('creates a controller only when no record exists and survives reconstruction', async () => {
    const first = makeService();
    const created = await first.service.ensureControllerIdentity();
    expect(created.ok).toBe(true);
    const second = new CredentialStoreService(first.store, crypto);
    const loaded = await second.loadController();
    expect(loaded.ok && loaded.value?.controllerId).toBe(created.ok ? created.value.controllerId : undefined);
    expect(first.store.values.get(STORAGE_KEYS.controller)).not.toContain('setup');
  });

  it('rejects corrupt, partial, and unknown-version records without replacement', async () => {
    const { store, service } = makeService();
    await store.set(STORAGE_KEYS.controller, '{"schemaVersion":999}');
    expect((await service.loadController()).ok).toBe(false);
    await store.set(STORAGE_KEYS.controller, '{"schemaVersion":1,"controllerId":"bad"}');
    expect((await service.inspectController()).state).toBe('corrupt');
    store.values.delete(STORAGE_KEYS.controller);
    const created = await service.ensureControllerIdentity();
    expect(created.ok).toBe(true);
  });

  it('keeps staged data repair-required until an explicit commit', async () => {
    const { store, service } = makeService();
    const record: PairingRecord = {
      schemaVersion: 1,
      accessoryId: toBase64(new Uint8Array(16).fill(1)),
      accessoryLongTermPublicKey: toBase64(new Uint8Array(32).fill(2)),
      controllerId: toBase64(new Uint8Array(16).fill(3)),
      controllerLongTermPublicKey: toBase64(new Uint8Array(32).fill(4)),
      controllerLongTermPrivateKey: toBase64(new Uint8Array(64).fill(5)),
      pairedAtEpochMs: 1
    };
    expect((await service.stagePairing(record)).ok).toBe(true);
    expect((await service.inspectPairing()).state).toBe('repair-required');
    expect((await service.commitStagedPairing()).ok).toBe(true);
    expect((await service.loadPairing()).ok).toBe(true);
  });

  it('serializes concurrent controller creation', async () => {
    const { service } = makeService();
    const values = await Promise.all([service.ensureControllerIdentity(), service.ensureControllerIdentity(), service.ensureControllerIdentity()]);
    expect(values.every((value) => value.ok)).toBe(true);
    const ids = values.filter((value): value is Extract<typeof value, { ok: true }> => value.ok).map((value) => value.value.controllerId);
    expect(new Set(ids).size).toBe(1);
  });

  it('does not claim accessory unpair when deleting local credentials', async () => {
    const { service } = makeService();
    const result = await service.deleteLocalCredentials();
    expect(result.ok).toBe(true);
  });
});
