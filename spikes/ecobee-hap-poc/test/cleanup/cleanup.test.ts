import { PairingCleanupService, type AccessoryPairingAdministration } from '../../src/application/pairingCleanup';
import { CredentialStoreService } from '../../src/hap/credentials/secureStore';
import { SodiumCryptoProvider } from '../../src/hap/crypto/sodiumProvider';
import { MemorySecureValueStore } from '../fakes/memoryStore';

describe('explicit pairing cleanup', () => {
  const approval = { removalApproved: true, removalConsequenceAcknowledged: true, restorationProcedureRecorded: true };

  it('requires consequence acknowledgement before accessory removal', async () => {
    const service = new PairingCleanupService(new CredentialStoreService(new MemorySecureValueStore(), new SodiumCryptoProvider()));
    const admin: AccessoryPairingAdministration = { removeController: jest.fn(async () => 'removed') };
    const result = await service.removeAccessoryController(admin, { ...approval, removalConsequenceAcknowledged: false }, true);
    expect(result.ok).toBe(false);
    expect(admin.removeController).not.toHaveBeenCalled();
  });

  it('keeps ambiguous accessory removal distinct from local deletion', async () => {
    const store = new MemorySecureValueStore();
    const credentials = new CredentialStoreService(store, new SodiumCryptoProvider());
    const service = new PairingCleanupService(credentials);
    const result = await service.removeAccessoryController({ removeController: async () => 'ambiguous' }, approval, true);
    expect(result.ok && result.value).toBe('ambiguous');
    expect((await credentials.inspectPairing()).state).toBe('repair-required');
    const local = await service.deleteLocalCredentials(true);
    expect(local.ok).toBe(true);
  });

  it('does not run restoration or reset work without explicit confirmation', async () => {
    const service = new PairingCleanupService(new CredentialStoreService(new MemorySecureValueStore(), new SodiumCryptoProvider()));
    const restore = jest.fn(async () => 'restored' as const);
    expect((await service.restorePriorAssociation({ restore }, approval, false)).ok).toBe(false);
    expect(restore).not.toHaveBeenCalled();
  });
});
