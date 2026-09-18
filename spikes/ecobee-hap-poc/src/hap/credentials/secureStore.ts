import * as SecureStore from 'expo-secure-store';
import type { CryptoProvider, SecureValueStore, SafeLogger } from '../ports/contracts';
import { failure, err, ok, type Result } from '../../application/result';
import {
  CREDENTIAL_SCHEMA_VERSION,
  decodeControllerRecord,
  decodePairingRecord,
  encodeRecord,
  toBase64,
  redactedRecordSummary,
  type ControllerIdentity,
  type CredentialInspection,
  type PairingRecord
} from './record';

export const STORAGE_KEYS = {
  controller: 'ecobee-hap-poc.v1.controller',
  pairingCommitted: 'ecobee-hap-poc.v1.pairing.committed',
  pairingStaged: 'ecobee-hap-poc.v1.pairing.staged',
  repair: 'ecobee-hap-poc.v1.pairing.repair'
} as const;

export class ExpoSecureValueStore implements SecureValueStore {
  get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  }

  set(key: string, value: string): Promise<void> {
    return SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  }

  delete(key: string): Promise<void> {
    return SecureStore.deleteItemAsync(key);
  }
}

export type CredentialServiceResult<T> = Result<T, ReturnType<typeof failure>>;

export class CredentialStoreService {
  private mutationTail: Promise<void> = Promise.resolve();

  constructor(
    private readonly store: SecureValueStore = new ExpoSecureValueStore(),
    private readonly crypto: CryptoProvider,
    private readonly logger?: SafeLogger
  ) {}

  async inspectController(): Promise<CredentialInspection> {
    return this.inspect('controller');
  }

  async inspectPairing(): Promise<CredentialInspection> {
    try {
      const [committed, staged, repair] = await Promise.all([
        this.store.get(STORAGE_KEYS.pairingCommitted),
        this.store.get(STORAGE_KEYS.pairingStaged),
        this.store.get(STORAGE_KEYS.repair)
      ]);
      if (repair !== null) return { state: 'repair-required', reason: repair };
      if (staged !== null) return { state: 'repair-required', reason: 'staged pairing record is present' };
      if (committed === null) return { state: 'missing' };
      return decodePairingRecord(committed);
    } catch {
      return { state: 'corrupt', reason: 'invalid-shape' };
    }
  }

  async loadController(): Promise<CredentialServiceResult<ControllerIdentity | null>> {
    const inspection = await this.inspectController();
    if (inspection.state === 'missing') return ok(null);
    if (inspection.state !== 'ready' || !('controllerId' in inspection.record)) {
      return err(failure('repair_required', `controller-record-${inspection.state}`, { repairRequired: true }));
    }
    return ok(inspection.record as ControllerIdentity);
  }

  async loadPairing(): Promise<CredentialServiceResult<PairingRecord | null>> {
    const inspection = await this.inspectPairing();
    if (inspection.state === 'missing') return ok(null);
    if (inspection.state !== 'ready' || !('accessoryId' in inspection.record)) {
      return err(failure('repair_required', `pairing-record-${inspection.state}`, { repairRequired: true }));
    }
    return ok(inspection.record);
  }

  async ensureControllerIdentity(): Promise<CredentialServiceResult<ControllerIdentity>> {
    const existing = await this.loadController();
    if (!existing.ok) return existing;
    if (existing.value) return ok(existing.value);
    return this.serialize(async () => {
      const afterLock = await this.loadController();
      if (!afterLock.ok) return afterLock;
      if (afterLock.value) return ok(afterLock.value);
      try {
        const id = await this.crypto.randomBytes(16);
        const keys = await this.crypto.ed25519KeyPair();
        const identity: ControllerIdentity = {
          schemaVersion: CREDENTIAL_SCHEMA_VERSION,
          controllerId: toBase64(id),
          longTermPublicKey: toBase64(keys.publicKey),
          longTermPrivateKey: toBase64(keys.privateKey)
        };
        await this.store.set(STORAGE_KEYS.controller, encodeRecord(identity));
        this.logger?.event('credentials.controller-created', { operation: 'controller-identity', result: 'success' });
        return ok(identity);
      } catch {
        return err(failure('storage_error', 'controller-create-failed', { repairRequired: true }));
      }
    });
  }

  async stagePairing(record: PairingRecord): Promise<CredentialServiceResult<void>> {
    return this.serialize(async () => {
      try {
        await this.store.set(STORAGE_KEYS.pairingStaged, encodeRecord(record));
        this.logger?.event('credentials.pairing-staged', { operation: 'pairing-record', result: 'success' });
        return ok(undefined);
      } catch {
        return err(failure('storage_error', 'pairing-stage-failed', { repairRequired: true }));
      }
    });
  }

  async commitStagedPairing(): Promise<CredentialServiceResult<void>> {
    return this.serialize(async () => {
      const staged = await this.store.get(STORAGE_KEYS.pairingStaged);
      if (staged === null) return err(failure('repair_required', 'pairing-stage-missing', { repairRequired: true }));
      const decoded = decodePairingRecord(staged);
      if (decoded.state !== 'ready' || !('accessoryId' in decoded.record)) {
        return err(failure('repair_required', 'pairing-stage-invalid', { repairRequired: true }));
      }
      try {
        await this.store.set(STORAGE_KEYS.pairingCommitted, encodeRecord(decoded.record));
        await this.store.delete(STORAGE_KEYS.pairingStaged);
        await this.store.delete(STORAGE_KEYS.repair);
        this.logger?.event('credentials.pairing-committed', { operation: 'pairing-record', result: 'success' });
        return ok(undefined);
      } catch {
        await this.safeMarkRepair('accessory pairing succeeded but local commit is uncertain');
        return err(failure('repair_required', 'pairing-commit-unknown', { repairRequired: true }));
      }
    });
  }

  async markRepair(reason: string): Promise<CredentialServiceResult<void>> {
    return this.serialize(async () => {
      try {
        await this.store.set(STORAGE_KEYS.repair, reason.slice(0, 120));
        this.logger?.error('credentials.repair-required', { operation: 'credential-store', result: 'repair-required', errorCategory: 'repair-required' });
        return ok(undefined);
      } catch {
        return err(failure('storage_error', 'repair-marker-failed', { repairRequired: true }));
      }
    });
  }

  async deleteLocalCredentials(): Promise<CredentialServiceResult<void>> {
    return this.serialize(async () => {
      try {
        await this.store.delete(STORAGE_KEYS.controller);
        await this.store.delete(STORAGE_KEYS.pairingCommitted);
        await this.store.delete(STORAGE_KEYS.pairingStaged);
        await this.store.delete(STORAGE_KEYS.repair);
        this.logger?.event('credentials.local-delete', { operation: 'local-credential-delete', result: 'success' });
        return ok(undefined);
      } catch {
        return err(failure('storage_error', 'local-delete-failed', { repairRequired: true }));
      }
    });
  }

  async redactedInspect(): Promise<{ controller: CredentialInspection['state']; pairing: CredentialInspection['state'] }> {
    const controller = await this.inspectController();
    const pairing = await this.inspectPairing();
    if (controller.state === 'ready' && 'record' in controller) redactedRecordSummary(controller.record);
    if (pairing.state === 'ready' && 'record' in pairing) redactedRecordSummary(pairing.record);
    return { controller: controller.state, pairing: pairing.state };
  }

  private async inspect(kind: 'controller' | 'pairing'): Promise<CredentialInspection> {
    try {
      const input = await this.store.get(kind === 'controller' ? STORAGE_KEYS.controller : STORAGE_KEYS.pairingCommitted);
      if (input === null) return { state: 'missing' };
      return kind === 'controller' ? decodeControllerRecord(input) : decodePairingRecord(input);
    } catch {
      return { state: 'corrupt', reason: 'invalid-shape' };
    }
  }

  private async safeMarkRepair(reason: string): Promise<void> {
    try {
      await this.store.set(STORAGE_KEYS.repair, reason.slice(0, 120));
    } catch {
      // The returned repair-required result remains authoritative if the marker cannot be written.
    }
  }

  private async serialize<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.mutationTail;
    let release!: () => void;
    this.mutationTail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
}
