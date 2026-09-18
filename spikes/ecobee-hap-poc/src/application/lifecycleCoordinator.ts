import type { Clock, CancellationSource, CancellationToken, NetworkEndpoint, SafeLogger } from '../hap/ports/contracts';
import { CancellationController } from '../hap/ports/contracts';
import { err, failure, ok, type Result } from './result';
import type { PairingRecord } from '../hap/credentials/record';

export type LifecycleState = 'foreground-idle' | 'background' | 'offline' | 'recovering' | 'ready' | 'repair-required';

export interface RecoverySession {
  connect(endpoint: NetworkEndpoint, record: PairingRecord, token: CancellationToken): Promise<Result<void, ReturnType<typeof failure>>>;
  close(): Promise<void>;
}

export interface RecoveryDependencies {
  resolvePairedEndpoint(): Promise<NetworkEndpoint | undefined>;
  loadPairing(): Promise<PairingRecord | undefined>;
  enumerateAndRefresh(): Promise<void>;
  restoreObservation(): Promise<void>;
  stopObservation(): Promise<void>;
  readonly session: RecoverySession;
}

export interface LifecycleSnapshot {
  readonly state: LifecycleState;
  readonly epoch: number;
  readonly retryCount: number;
  readonly lastErrorCategory?: string;
}

export class LifecycleCoordinator {
  private state: LifecycleState = 'foreground-idle';
  private epoch = 0;
  private retryCount = 0;
  private reconnectTimer?: unknown;
  private operation?: CancellationSource;
  private lastErrorCategory?: string;
  private listeners = new Set<(snapshot: LifecycleSnapshot) => void>();

  constructor(
    private readonly dependencies: RecoveryDependencies,
    private readonly clock: Clock,
    private readonly logger?: SafeLogger,
    private readonly maxRetryDelayMs = 30_000
  ) {}

  subscribe(listener: (snapshot: LifecycleSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot(): LifecycleSnapshot {
    return { state: this.state, epoch: this.epoch, retryCount: this.retryCount, lastErrorCategory: this.lastErrorCategory };
  }

  async background(): Promise<void> {
    this.epoch += 1;
    this.cancelScheduledRecovery('background');
    this.state = 'background';
    await this.dependencies.stopObservation();
    await this.dependencies.session.close();
    this.publish();
  }

  async foreground(): Promise<Result<void, ReturnType<typeof failure>>> {
    this.epoch += 1;
    this.cancelScheduledRecovery('foreground-recovery');
    this.state = 'recovering';
    this.retryCount = 0;
    this.publish();
    return this.recover(this.epoch);
  }

  async networkLost(): Promise<void> {
    this.epoch += 1;
    this.cancelScheduledRecovery('network-lost');
    this.state = 'offline';
    await this.dependencies.stopObservation();
    await this.dependencies.session.close();
    this.publish();
  }

  async retry(): Promise<Result<void, ReturnType<typeof failure>>> {
    if (this.state === 'background') return err(failure('unavailable', 'background-recovery-not-started'));
    this.state = 'recovering';
    this.publish();
    return this.recover(this.epoch);
  }

  private async recover(epoch: number): Promise<Result<void, ReturnType<typeof failure>>> {
    const controller = new CancellationController();
    this.operation = controller;
    try {
      const endpoint = await this.dependencies.resolvePairedEndpoint();
      if (epoch !== this.epoch) return err(failure('stale_generation', 'lifecycle-epoch-stale'));
      const record = await this.dependencies.loadPairing();
      if (!endpoint || !record) {
        this.state = 'repair-required';
        this.lastErrorCategory = !record ? 'pairing-record-unavailable' : 'paired-endpoint-unavailable';
        this.publish();
        return err(failure('repair_required', this.lastErrorCategory, { repairRequired: true }));
      }
      const connected = await this.dependencies.session.connect(endpoint, record, controller.token);
      if (epoch !== this.epoch) return err(failure('stale_generation', 'lifecycle-epoch-stale'));
      if (!connected.ok) {
        this.state = connected.error.repairRequired ? 'repair-required' : 'offline';
        this.lastErrorCategory = connected.error.category;
        this.retryCount = Math.min(this.retryCount + 1, 5);
        this.scheduleRetry(epoch);
        this.publish();
        return connected;
      }
      await this.dependencies.enumerateAndRefresh();
      if (epoch !== this.epoch) return err(failure('stale_generation', 'lifecycle-epoch-stale'));
      await this.dependencies.restoreObservation();
      if (epoch !== this.epoch) return err(failure('stale_generation', 'lifecycle-epoch-stale'));
      this.retryCount = 0;
      this.lastErrorCategory = undefined;
      this.state = 'ready';
      this.publish();
      this.logger?.event('lifecycle.recovered', { operation: 'lifecycle-recovery', result: 'success', generation: epoch });
      return ok(undefined);
    } catch {
      this.state = 'offline';
      this.lastErrorCategory = 'recovery-failed';
      this.retryCount = Math.min(this.retryCount + 1, 5);
      this.scheduleRetry(epoch);
      this.publish();
      return err(failure('transport_error', 'recovery-failed', { retryable: true }));
    } finally {
      if (this.operation === controller) this.operation = undefined;
    }
  }

  private scheduleRetry(epoch: number): void {
    if (this.reconnectTimer !== undefined || this.state === 'background') return;
    const delay = Math.min(this.maxRetryDelayMs, 500 * 2 ** Math.max(0, this.retryCount - 1));
    this.reconnectTimer = this.clock.setTimeout(() => {
      this.reconnectTimer = undefined;
      if (epoch === this.epoch && this.state !== 'background') void this.recover(epoch);
    }, delay);
  }

  private cancelScheduledRecovery(reason: string): void {
    if (this.reconnectTimer !== undefined) this.clock.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.operation?.cancel(reason);
    this.operation = undefined;
  }

  private publish(): void {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
