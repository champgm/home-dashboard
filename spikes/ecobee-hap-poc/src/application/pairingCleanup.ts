import type { SafeLogger } from '../hap/ports/contracts';
import { err, failure, ok, type Result } from './result';
import { CredentialStoreService } from '../hap/credentials/secureStore';

export type AccessoryRemovalOutcome = 'removed' | 'rejected' | 'ambiguous';

export interface AccessoryPairingAdministration {
  removeController(): Promise<AccessoryRemovalOutcome>;
}

export interface PriorAssociationRestoration {
  restore(): Promise<'restored' | 'not-required' | 'failed'>;
}

export interface CleanupApproval {
  readonly removalApproved: boolean;
  readonly removalConsequenceAcknowledged: boolean;
  readonly restorationProcedureRecorded: boolean;
}

export class PairingCleanupService {
  constructor(private readonly credentials: CredentialStoreService, private readonly logger?: SafeLogger) {}

  async removeAccessoryController(
    administration: AccessoryPairingAdministration,
    approval: CleanupApproval,
    confirmed: boolean
  ): Promise<Result<AccessoryRemovalOutcome, ReturnType<typeof failure>>> {
    if (!confirmed || !approval.removalApproved || !approval.removalConsequenceAcknowledged || !approval.restorationProcedureRecorded) {
      return err(failure('invalid_input', 'accessory-removal-approval-required'));
    }
    const outcome = await administration.removeController();
    if (outcome === 'ambiguous') {
      await this.credentials.markRepair('accessory controller removal outcome is ambiguous');
      this.logger?.error('pairing.cleanup-ambiguous', { operation: 'accessory-unpair', result: 'repair-required', errorCategory: 'removal-ambiguous' });
      return ok(outcome);
    }
    this.logger?.event('pairing.cleanup-accessory', { operation: 'accessory-unpair', result: outcome === 'removed' ? 'success' : 'failure' });
    return ok(outcome);
  }

  async deleteLocalCredentials(confirmed: boolean): Promise<Result<void, ReturnType<typeof failure>>> {
    if (!confirmed) return err(failure('invalid_input', 'local-delete-confirmation-required'));
    const result = await this.credentials.deleteLocalCredentials();
    if (!result.ok) return result;
    this.logger?.event('pairing.cleanup-local', { operation: 'local-credential-delete', result: 'success' });
    return ok(undefined);
  }

  async restorePriorAssociation(
    restoration: PriorAssociationRestoration,
    approval: CleanupApproval,
    confirmed: boolean
  ): Promise<Result<'restored' | 'not-required', ReturnType<typeof failure>>> {
    if (!confirmed || !approval.restorationProcedureRecorded) return err(failure('invalid_input', 'restoration-approval-required'));
    const outcome = await restoration.restore();
    if (outcome === 'failed') return err(failure('repair_required', 'prior-association-restoration-failed', { repairRequired: true }));
    return ok(outcome);
  }
}
