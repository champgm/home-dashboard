import type { SafeLogger, Clock, DnsSdAdapter, HapCandidate, LocalNetworkSnapshot, RawDnsSdService, NetworkEndpoint } from '../ports/contracts';
import { classifyHapCategory, parseHapTxt } from './txt';
import { validateLocalEndpoint } from './endpointPolicy';

export interface DiscoverySnapshot {
  readonly generation: number;
  readonly candidates: readonly HapCandidate[];
  readonly running: boolean;
  readonly networkAvailable: boolean;
}

export class DiscoveryCoordinator {
  private generation = 0;
  private running = false;
  private readonly candidatesByIdentity = new Map<string, HapCandidate>();
  private stopTimer?: unknown;
  private listeners = new Set<(snapshot: DiscoverySnapshot) => void>();

  constructor(
    private readonly adapter: DnsSdAdapter,
    private readonly network: () => LocalNetworkSnapshot,
    private readonly clock: Clock,
    private readonly logger?: SafeLogger,
    private readonly timeoutMs = 15_000,
    private readonly prepareNetwork?: () => Promise<void>,
    subscribeNetwork?: (listener: () => void) => () => void
  ) {
    subscribeNetwork?.(() => this.publish());
  }

  subscribe(listener: (snapshot: DiscoverySnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  async start(): Promise<DiscoverySnapshot> {
    await this.stop();
    this.generation += 1;
    try {
      await this.prepareNetwork?.();
      if (!this.isNetworkAvailable()) throw new Error('active Wi-Fi network unavailable');
    } catch {
      this.running = false;
      this.candidatesByIdentity.clear();
      this.logger?.event('discovery.network-unavailable', { operation: 'hap-discovery', result: 'failure', errorCategory: 'network-unavailable' });
      this.publish();
      throw new Error('active Wi-Fi network unavailable');
    }
    const currentGeneration = this.generation;
    this.running = true;
    this.candidatesByIdentity.clear();
    this.stopTimer = this.clock.setTimeout(() => {
      void this.finishBrowse(currentGeneration);
    }, this.timeoutMs);
    await this.adapter.start('_hap._tcp', {
      found: (service) => this.accept(currentGeneration, service, 'found'),
      changed: (service) => this.accept(currentGeneration, service, 'changed'),
      lost: (service) => this.remove(currentGeneration, service)
    });
    this.logger?.event('discovery.started', { operation: 'hap-discovery', result: 'started', generation: currentGeneration });
    this.publish();
    return this.snapshot();
  }

  async stop(): Promise<void> {
    const wasRunning = this.running;
    this.generation += 1;
    this.running = false;
    if (this.stopTimer !== undefined) this.clock.clearTimeout(this.stopTimer);
    this.stopTimer = undefined;
    this.candidatesByIdentity.clear();
    if (wasRunning) await this.adapter.stop('_hap._tcp');
    this.publish();
  }

  snapshot(): DiscoverySnapshot {
    return { generation: this.generation, candidates: [...this.candidatesByIdentity.values()], running: this.running, networkAvailable: this.isNetworkAvailable() };
  }

  resolvePaired(accessoryId: string): HapCandidate | undefined {
    return this.candidatesByIdentity.get(accessoryId);
  }

  /** Re-checks a selected endpoint immediately before opening a session. */
  isEndpointCurrent(endpoint: NetworkEndpoint): boolean {
    try {
      const result = validateLocalEndpoint(endpoint.host, endpoint.port, endpoint.interfaceId, this.network());
      return result.ok && result.value.networkCidr === endpoint.networkCidr;
    } catch {
      return false;
    }
  }

  private accept(generation: number, service: RawDnsSdService, operation: 'found' | 'changed'): void {
    if (!this.running || generation !== this.generation) return;
    try {
      const parsed = parseHapTxt(service);
      const categoryDisposition = classifyHapCategory(parsed.category);
      if (categoryDisposition !== 'thermostat') {
        this.candidatesByIdentity.delete(parsed.accessoryId);
        this.logger?.event('discovery.record-ignored', {
          operation: 'hap-discovery',
          result: 'failure',
          errorCategory: categoryDisposition
        });
        this.publish();
        return;
      }
      const endpointResults = service.addresses.map((address) => validateLocalEndpoint(address, service.port, service.interfaceId, this.network()));
      const endpointResult = endpointResults.find((result): result is { readonly ok: true; readonly value: NetworkEndpoint } => result.ok);
      if (!endpointResult) {
        this.candidatesByIdentity.delete(parsed.accessoryId);
        const firstRejected = endpointResults.find((result) => !result.ok);
        const rejection = firstRejected && !firstRejected.ok ? firstRejected.error : 'invalid-address';
        this.logger?.event('discovery.endpoint-rejected', { operation: 'hap-discovery', result: 'failure', errorCategory: rejection });
        this.publish();
        return;
      }
      const identity = parsed.accessoryId;
      const existing = this.candidatesByIdentity.get(identity);
      const candidate: HapCandidate = {
        key: identity,
        displayName: existing?.displayName ?? `Thermostat ${this.candidatesByIdentity.size + 1}`,
        serviceType: '_hap._tcp',
        endpoint: endpointResult.value,
        pairing: parsed.pairingAvailable ? 'available' : 'already-associated',
        accessoryIdentityHint: identity,
        generation
      };
      this.candidatesByIdentity.set(identity, candidate);
      this.logger?.event(`discovery.${operation}`, { operation: 'hap-discovery', result: 'success', generation });
      this.publish();
    } catch (error) {
      if (typeof service.txt.id === 'string') this.candidatesByIdentity.delete(service.txt.id);
      this.logger?.error('discovery.record-rejected', { operation: 'hap-discovery', result: 'failure', errorCategory: error instanceof Error ? error.name.toLowerCase() : 'malformed-record' });
      this.publish();
    }
  }

  private remove(generation: number, service: RawDnsSdService): void {
    if (!this.running || generation !== this.generation) return;
    const identity = service.txt.id;
    if (identity) this.candidatesByIdentity.delete(identity);
    this.logger?.event('discovery.lost', { operation: 'hap-discovery', result: 'success', generation });
    this.publish();
  }

  private publish(): void {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  /** Ends the bounded native browse while retaining its resolved snapshot for operator action. */
  private async finishBrowse(generation: number): Promise<void> {
    if (!this.running || generation !== this.generation) return;
    this.running = false;
    this.stopTimer = undefined;
    try {
      await this.adapter.stop('_hap._tcp');
      this.logger?.event('discovery.window-complete', { operation: 'hap-discovery', result: 'success', generation });
    } catch {
      this.logger?.error('discovery.stop-failed', { operation: 'hap-discovery', result: 'failure', errorCategory: 'native-stop-failed', generation });
    }
    this.publish();
  }

  private isNetworkAvailable(): boolean {
    try {
      return this.network().available;
    } catch {
      return false;
    }
  }
}
