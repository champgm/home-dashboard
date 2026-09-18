import type { Clock, HapSessionApi, SafeLogger } from '../../ports/contracts';
import type { ProjectedCapability, ThermostatProjection, ValueSource } from '../accessories/models';

export interface ObservationTarget {
  readonly aid: number;
  readonly iid: number;
  readonly key: ProjectedCapability['key'];
}

export interface CharacteristicEvent {
  readonly aid: number;
  readonly iid: number;
  readonly value: unknown;
  readonly generation: number;
}

export interface EventTransport {
  subscribe(targets: readonly ObservationTarget[]): Promise<void>;
  unsubscribe(targets: readonly ObservationTarget[]): Promise<void>;
  onEvent(listener: (event: CharacteristicEvent) => void): () => void;
}

export type ObservationMode = 'events' | 'foreground-polling';

export interface ObservationPolicy {
  readonly mode: ObservationMode;
  readonly intervalMs?: number;
  readonly maxIntervalMs?: number;
  readonly rationale: string;
}

export interface PollSchedulerOptions {
  readonly intervalMs: number;
  readonly maxIntervalMs: number;
  readonly clock: Clock;
  readonly read: () => Promise<void>;
  readonly logger?: SafeLogger;
}

export class ForegroundPollScheduler {
  private timer?: unknown;
  private running = false;
  private inFlight = false;
  private currentInterval: number;

  constructor(private readonly options: PollSchedulerOptions) {
    if (!Number.isInteger(options.intervalMs) || options.intervalMs < 1 || options.intervalMs > options.maxIntervalMs) throw new Error('poll interval is outside bounds');
    this.currentInterval = options.intervalMs;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.schedule(0);
  }

  stop(): void {
    this.running = false;
    if (this.timer !== undefined) this.options.clock.clearTimeout(this.timer);
    this.timer = undefined;
  }

  get active(): boolean { return this.running; }

  private schedule(delayMs: number): void {
    if (!this.running) return;
    this.timer = this.options.clock.setTimeout(() => { void this.tick(); }, delayMs);
  }

  private async tick(): Promise<void> {
    if (!this.running || this.inFlight) return;
    this.inFlight = true;
    try {
      await this.options.read();
      this.currentInterval = this.options.intervalMs;
    } catch {
      this.currentInterval = Math.min(this.options.maxIntervalMs, Math.max(this.options.intervalMs, this.currentInterval * 2));
      this.options.logger?.error('observation.poll-failed', { operation: 'foreground-poll', result: 'failure', errorCategory: 'poll-read-failed' });
    } finally {
      this.inFlight = false;
      this.timer = undefined;
      this.schedule(this.currentInterval);
    }
  }
}

export class ObservationCoordinator {
  private removeEvent?: () => void;
  private poller?: ForegroundPollScheduler;
  private activeGeneration = 0;
  private targets: ObservationTarget[] = [];

  constructor(
    private readonly events: EventTransport,
    private readonly clock: Clock,
    private readonly read: () => Promise<void>,
    private readonly logger?: SafeLogger,
    private readonly onEvent?: (event: CharacteristicEvent) => void
  ) {}

  async start(projection: ThermostatProjection, generation: number, preferred: ObservationMode = 'events'): Promise<ObservationPolicy> {
    await this.stop();
    this.activeGeneration = generation;
    this.targets = projection.capabilities
      .filter((capability) => capability.status === 'available' && capability.characteristic.eventCapable && capability.characteristic.iid > 0)
      .map((capability) => ({ aid: capability.characteristic.aid, iid: capability.characteristic.iid, key: capability.key }));
    if (preferred === 'events' && this.targets.length > 0) {
      try {
        await this.events.subscribe(this.targets);
        this.removeEvent = this.events.onEvent((event) => this.acceptEvent(event));
        this.logger?.event('observation.events-started', { operation: 'event-subscription', result: 'success', generation });
        return { mode: 'events', rationale: 'target accepted event subscriptions for projected event-capable characteristics' };
      } catch {
        this.logger?.event('observation.events-unavailable', { operation: 'event-subscription', result: 'failure', errorCategory: 'subscription-rejected', generation });
      }
    }
    this.poller = new ForegroundPollScheduler({ intervalMs: 30_000, maxIntervalMs: 5 * 60_000, clock: this.clock, read: this.read, logger: this.logger });
    this.poller.start();
    return { mode: 'foreground-polling', intervalMs: 30_000, maxIntervalMs: 5 * 60_000, rationale: 'events unavailable or no projected event-capable characteristic; foreground-only bounded polling' };
  }

  async stop(): Promise<void> {
    this.activeGeneration += 1;
    this.poller?.stop();
    this.poller = undefined;
    this.removeEvent?.();
    this.removeEvent = undefined;
    if (this.targets.length > 0) {
      try { await this.events.unsubscribe(this.targets); } catch { /* session close is already terminal */ }
    }
    this.targets = [];
  }

  get active(): boolean { return this.poller?.active === true || this.removeEvent !== undefined; }

  private acceptEvent(event: CharacteristicEvent): void {
    if (event.generation !== this.activeGeneration) {
      this.logger?.event('observation.stale-event-discarded', { operation: 'event-subscription', result: 'failure', errorCategory: 'stale-generation' });
      return;
    }
    if (!this.targets.some((target) => target.aid === event.aid && target.iid === event.iid)) return;
    this.onEvent?.(event);
    this.logger?.event('observation.event-received', { operation: 'event-subscription', result: 'success', generation: event.generation });
  }
}
