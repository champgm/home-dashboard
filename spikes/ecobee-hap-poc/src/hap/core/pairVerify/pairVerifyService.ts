import type { CancellationToken, Bytes, HapSessionApi, SafeLogger } from '../../ports/contracts';
import { err, failure, ok, type Result } from '../../../application/result';
import type { PairingRecord } from '../../credentials/record';
import { CredentialStoreService } from '../../credentials/secureStore';
import { PairingProtocol, type PairingSessionKeys } from '../pairSetup/pairingProtocol';

export interface PairVerifyTransport extends HapSessionApi {
  setSessionKeys(controllerToAccessoryKey: Bytes, accessoryToControllerKey: Bytes): void;
}

export interface PairVerifyResult {
  readonly session: PairVerifyTransport;
  readonly keys: PairingSessionKeys;
}

export class PairVerifyService {
  constructor(
    private readonly crypto: import('../../ports/contracts').CryptoProvider,
    private readonly credentials: CredentialStoreService,
    private readonly logger?: SafeLogger
  ) {}

  async run(transport: PairVerifyTransport, record: PairingRecord, token?: CancellationToken): Promise<Result<PairVerifyResult, ReturnType<typeof failure>>> {
    const protocol = new PairingProtocol(this.crypto);
    try {
      protocol.loadStoredPairing(record);
      if (token?.aborted) return err(failure('cancelled', 'pair-verify-cancelled'));
      const m1 = await protocol.buildPairVerifyM1();
      const m2 = await transport.request('POST', '/pair-verify', m1, 'application/pairing+tlv8');
      const m2Body = m2.body;
      await protocol.parsePairVerifyM2(m2Body);
      const m3 = await protocol.buildPairVerifyM3();
      const m4 = await transport.request('POST', '/pair-verify', m3, 'application/pairing+tlv8');
      protocol.parsePairVerifyM4(m4.body);
      const keys = await protocol.getSessionKeys();
      transport.setSessionKeys(keys.controllerToAccessoryKey, keys.accessoryToControllerKey);
      this.logger?.event('pairing.verify-complete', { operation: 'pair-verify', result: 'success', generation: transport.generation });
      return ok({ session: transport, keys });
    } catch (error) {
      try { await transport.close(); } catch { /* terminal transport failure */ }
      if (token?.aborted) return err(failure('cancelled', 'pair-verify-cancelled'));
      await this.credentials.markRepair('Pair Verify failed; operator review required');
      this.logger?.error('pairing.verify-failed', { operation: 'pair-verify', result: 'repair-required', errorCategory: error instanceof Error ? error.name.toLowerCase() : 'pair-verify-failed', generation: transport.generation });
      return err(failure('repair_required', 'pair-verify-failed', { repairRequired: true }));
    }
  }
}
