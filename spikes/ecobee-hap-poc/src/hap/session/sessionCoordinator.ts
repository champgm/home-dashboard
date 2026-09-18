import type { CancellationToken, Clock, HapSessionApi, NetworkEndpoint, SafeLogger } from '../ports/contracts';
import { err, failure, ok, type Result } from '../../application/result';
import type { PairingRecord } from '../credentials/record';
import { PairVerifyService, type PairVerifyTransport } from '../core/pairVerify/pairVerifyService';

export type SessionState = 'idle' | 'verifying' | 'ready' | 'reconnecting' | 'recoverable-error' | 'repair-required';

export interface SessionSnapshot {
  readonly state: SessionState;
  readonly generation: number;
  readonly retryCount: number;
}

export interface SessionTransportFactory {
  connect(endpoint: NetworkEndpoint, generation: number): Promise<PairVerifyTransport>;
}

export class SessionCoordinator {
  private state: SessionState = 'idle';
  private generation = 0;
  private retryCount = 0;
  private session?: PairVerifyTransport;
  private connecting?: Promise<Result<PairVerifyTransport, ReturnType<typeof failure>>>;
  private listeners = new Set<(snapshot: SessionSnapshot) => void>();

  constructor(
    private readonly factory: SessionTransportFactory,
    private readonly verify: PairVerifyService,
    private readonly clock: Clock,
    private readonly logger?: SafeLogger
  ) {}

  subscribe(listener: (snapshot: SessionSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot(): SessionSnapshot {
    return { state: this.state, generation: this.generation, retryCount: this.retryCount };
  }

  get currentSession(): PairVerifyTransport | undefined {
    return this.session;
  }

  async connect(endpoint: NetworkEndpoint, record: PairingRecord, token?: CancellationToken): Promise<Result<PairVerifyTransport, ReturnType<typeof failure>>> {
    if (this.connecting) return this.connecting;
    const generation = ++this.generation;
    this.state = 'verifying';
    this.publish();
    this.connecting = this.connectInternal(endpoint, record, generation, token).finally(() => {
      this.connecting = undefined;
    });
    return this.connecting;
  }

  async close(): Promise<void> {
    this.generation += 1;
    const old = this.session;
    this.session = undefined;
    this.state = 'idle';
    this.publish();
    if (old) await old.close();
  }

  invalidateGeneration(): void {
    this.generation += 1;
    this.state = 'reconnecting';
    this.publish();
  }

  private async connectInternal(endpoint: NetworkEndpoint, record: PairingRecord, generation: number, token?: CancellationToken): Promise<Result<PairVerifyTransport, ReturnType<typeof failure>>> {
    try {
      const transport = await this.factory.connect(endpoint, generation);
      if (generation !== this.generation) {
        await transport.close();
        return err(failure('stale_generation', 'session-generation-stale'));
      }
      const result = await this.verify.run(transport, record, token);
      if (!result.ok) {
        this.state = result.error.repairRequired ? 'repair-required' : 'recoverable-error';
        this.publish();
        return result;
      }
      if (generation !== this.generation) {
        await result.value.session.close();
        return err(failure('stale_generation', 'session-generation-stale'));
      }
      this.session = result.value.session;
      this.state = 'ready';
      this.retryCount = 0;
      this.publish();
      return ok(result.value.session);
    } catch {
      this.state = 'recoverable-error';
      this.retryCount = Math.min(this.retryCount + 1, 5);
      this.publish();
      return err(failure('transport_error', 'session-connect-failed', { retryable: true }));
    }
  }

  private publish(): void {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
