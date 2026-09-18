import type { SafeLogger, CancellationToken, Bytes } from '../../ports/contracts';
import { err, failure, ok, type Result } from '../../../application/result';
import { CredentialStoreService } from '../../credentials/secureStore';
import { PairMethods, PairingProtocol, PairingProtocolError } from './pairingProtocol';

export interface PairingOwnershipPreflight {
  readonly advertisedPairing: 'available' | 'already-associated' | 'unknown';
  readonly existingAssociation: 'confirmed' | 'none-known' | 'unknown';
  readonly removalApproved: boolean;
  readonly restorationProcedureRecorded: boolean;
}

export interface PairSetupTransport {
  post(path: '/pair-setup', body: Bytes, contentType: 'application/pairing+tlv8'): Promise<Bytes>;
  close(): Promise<void>;
}

export type PairSetupStatus = 'paired' | 'rejected' | 'indeterminate' | 'cancelled';

export interface PairSetupResult {
  readonly status: PairSetupStatus;
  readonly accessoryPairingEstablished: boolean;
  readonly localRecordCommitted: boolean;
  readonly errorCategory?: string;
}

export class PairSetupService {
  private active = false;

  constructor(
    private readonly protocolFactory: () => PairingProtocol,
    private readonly credentials: CredentialStoreService,
    private readonly logger?: SafeLogger
  ) {}

  async run(
    transport: PairSetupTransport,
    preflight: PairingOwnershipPreflight,
    setupCode: string,
    confirmed: boolean,
    token?: CancellationToken
  ): Promise<Result<PairSetupResult, ReturnType<typeof failure>>> {
    if (this.active) return err(failure('unavailable', 'pair-setup-already-active'));
    if (!confirmed) return err(failure('invalid_input', 'pair-setup-confirmation-required'));
    if (preflight.existingAssociation === 'unknown') {
      return err(failure('unavailable', 'pairing-ownership-state-unknown', { repairRequired: true }));
    }
    if (preflight.existingAssociation === 'confirmed' && (!preflight.removalApproved || !preflight.restorationProcedureRecorded)) {
      return err(failure('unavailable', 'pairing-ownership-approval-required', { repairRequired: true }));
    }
    try {
      PairingProtocol.validateSetupCode(setupCode);
    } catch {
      return err(failure('invalid_input', 'setup-code-rejected'));
    }
    this.active = true;
    const protocol = this.protocolFactory();
    this.logger?.event('pairing.setup-started', { operation: 'pair-setup', result: 'started' });
    try {
      const controller = await this.credentials.ensureControllerIdentity();
      if (!controller.ok) return err(controller.error);
      protocol.loadControllerIdentity(controller.value);
      if (token?.aborted) return err(failure('cancelled', 'pair-setup-cancelled'));
      const m1 = await protocol.buildPairSetupM1(preflight.advertisedPairing === 'available' ? PairMethods.pairSetupWithAuth : PairMethods.pairSetup);
      const m2 = protocol.parsePairSetupM2(await transport.post('/pair-setup', m1, 'application/pairing+tlv8'));
      const m3 = await protocol.buildPairSetupM3(m2, setupCode);
      protocol.parsePairSetupM4(await transport.post('/pair-setup', m3, 'application/pairing+tlv8'));
      const m5 = await protocol.buildPairSetupM5();
      const state = await protocol.parsePairSetupM6(await transport.post('/pair-setup', m5, 'application/pairing+tlv8'));
      const staged = await this.credentials.stagePairing(protocol.getPairingRecord());
      if (!staged.ok) {
        await this.credentials.markRepair('accessory pairing succeeded but local staging failed');
        return ok({ status: 'indeterminate', accessoryPairingEstablished: true, localRecordCommitted: false, errorCategory: 'local-stage-failed' });
      }
      const committed = await this.credentials.commitStagedPairing();
      if (!committed.ok) {
        await this.credentials.markRepair('accessory pairing succeeded but local commit is uncertain');
        return ok({ status: 'indeterminate', accessoryPairingEstablished: true, localRecordCommitted: false, errorCategory: 'local-commit-unknown' });
      }
      void state;
      this.logger?.event('pairing.setup-complete', { operation: 'pair-setup', result: 'success' });
      return ok({ status: 'paired', accessoryPairingEstablished: true, localRecordCommitted: true });
    } catch (error) {
      const category = error instanceof PairingProtocolError ? error.category : 'pair-setup-failed';
      this.logger?.error('pairing.setup-failed', { operation: 'pair-setup', result: 'failure', errorCategory: category });
      return ok({ status: token?.aborted ? 'cancelled' : 'rejected', accessoryPairingEstablished: false, localRecordCommitted: false, errorCategory: category });
    } finally {
      this.active = false;
      await transport.close();
    }
  }
}
