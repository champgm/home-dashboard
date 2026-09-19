import type { SafeLogger, Clock, HapCandidate, NetworkEndpoint, CancellationToken, CryptoProvider } from '../hap/ports/contracts';
import { systemClock } from '../hap/ports/contracts';
import { StructuredLogger } from '../diagnostics/safeLogger';
import { DiscoveryCoordinator } from '../hap/discovery/coordinator';
import { NativeDnsSdAdapter } from '../hap/discovery/nativeDnsSd';
import { NativeWifiNetworkSnapshot } from '../hap/discovery/nativeNetwork';
import { reactNativeCrypto } from '../hap/crypto/quickCryptoProvider';
import { CredentialStoreService, ExpoSecureValueStore } from '../hap/credentials/secureStore';
import { fromBase64 } from '../hap/credentials/record';
import { PairingProtocol, PairingTlv } from '../hap/core/pairSetup/pairingProtocol';
import { encodeTlv } from '../hap/core/wire/tlv8';
import { PairSetupService, type PairingOwnershipPreflight } from '../hap/core/pairSetup/pairSetupService';
import { PairVerifyService } from '../hap/core/pairVerify/pairVerifyService';
import { ObservationCoordinator, type CharacteristicEvent, type EventTransport } from '../hap/core/events/observation';
import { applyCharacteristicReads } from '../hap/core/accessories/thermostatProjection';
import type { ThermostatProjection } from '../hap/core/accessories/models';
import { HapCharacteristicType } from '../hap/core/accessories/models';
import { ReactNativeTcpAdapter } from '../hap/transport/nativeTcp';
import { HapSessionEventTransport } from '../hap/transport/eventTransport';
import { TcpSessionTransportFactory, postTlv } from '../hap/transport/sessionFactory';
import { HapHttpSession } from '../hap/transport/httpSession';
import { SessionCoordinator } from '../hap/session/sessionCoordinator';
import { LifecycleCoordinator } from './lifecycleCoordinator';
import { ThermostatRefreshError, ThermostatReadService } from './thermostatService';
import { HapSetpointWriter, SetpointCommandService, type OccupiedSafeTemperatureRange } from './setpointCommand';
import { PairingCleanupService, type AccessoryPairingAdministration, type CleanupApproval } from './pairingCleanup';
import { TargetRunEvidenceStore, summaryFor } from './targetRunEvidence';
import { failure, type OperationFailure } from './result';
import { createInitialTargetRunStatus, type PocUiActions, type PocUiState, type SanitizedCapability, type TargetRunResult } from '../ui/PocControllerScreen';

const DEFAULT_SAFE_RANGES: Record<'celsius' | 'fahrenheit', OccupiedSafeTemperatureRange> = {
  celsius: { min: 16, max: 30, unit: 'celsius' },
  fahrenheit: { min: 60.8, max: 86, unit: 'fahrenheit' }
};

export interface PocControllerServices {
  readonly discovery: DiscoveryCoordinator;
  readonly credentials: CredentialStoreService;
  readonly pairing: PairSetupService;
  readonly sessions: SessionCoordinator;
  readonly factory: TcpSessionTransportFactory;
  readonly reads: ThermostatReadService;
  readonly setpoints: SetpointCommandService;
  readonly cleanup: PairingCleanupService;
  readonly lifecycle?: LifecycleCoordinator;
  readonly clock: Clock;
  readonly logger: SafeLogger;
  readonly targetEvidence?: TargetRunEvidenceStore;
  readonly networkClose?: () => void;
}

export interface PocControllerOptions extends PocControllerServices {
  readonly cleanupApproval?: CleanupApproval;
}

/** Application composition for the isolated POC UI. All protocol work remains behind adapters. */
export class PocController implements PocUiActions {
  private state: PocUiState = { discovery: 'idle', connection: 'idle', candidates: [], capabilities: [], targetRun: createInitialTargetRunStatus() };
  private readonly listeners = new Set<(state: PocUiState) => void>();
  private readonly candidateAliases = new Map<string, string>();
  private readonly candidatesByAlias = new Map<string, HapCandidate>();
  private pairedAccessoryKey?: string;
  private selectedCandidate?: HapCandidate;
  private projection?: ThermostatProjection;
  private observation?: ObservationCoordinator;
  private eventTransport?: EventTransport;
  private readonly cleanupApproval: CleanupApproval;

  constructor(private readonly options: PocControllerOptions) {
    this.cleanupApproval = options.cleanupApproval ?? {
      removalApproved: false,
      removalConsequenceAcknowledged: false,
      restorationProcedureRecorded: false
    };
    options.discovery.subscribe((snapshot) => {
      this.candidatesByAlias.clear();
      const candidates = snapshot.candidates.map((candidate) => {
        const alias = this.aliasFor(candidate);
        this.candidatesByAlias.set(alias, candidate);
        return this.sanitizeCandidate(alias, candidate);
      }).sort((left, right) => Number(right.pairedToThisApp) - Number(left.pairedToThisApp) || left.label.localeCompare(right.label));
      const selected = this.selectedCandidate
        ? candidates.find((candidate) => this.candidatesByAlias.get(candidate.key)?.key === this.selectedCandidate?.key)
        : undefined;
      if (selected) this.selectedCandidate = this.candidatesByAlias.get(selected.key);
      const keepSelected = this.state.connection === 'ready' && this.selectedCandidate;
      this.publish({
        discovery: snapshot.running ? candidates.length > 0 ? 'ready' : 'discovering' : 'idle',
        candidates: keepSelected && selected === undefined ? this.state.candidates : candidates,
        selected: selected ?? (keepSelected ? this.state.selected : undefined),
        targetRun: { ...this.state.targetRun, network: snapshot.networkAvailable ? 'ready' : 'unavailable' }
      });
    });
    void this.restoreTargetEvidence();
  }

  getState(): PocUiState {
    return this.state;
  }

  subscribe(listener: (state: PocUiState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  async initialize(): Promise<void> {
    this.startDiscovery();
  }

  async background(): Promise<void> {
    if (this.options.lifecycle) await this.options.lifecycle.background();
    else {
      await this.stopObservation();
      await this.options.sessions.close();
    }
    await this.options.discovery.stop();
    this.publish({ discovery: 'idle', connection: 'offline', errorMessage: undefined });
  }

  async foreground(): Promise<void> {
    const pairing = await this.options.credentials.loadPairing();
    if (!pairing.ok) {
      this.publish({ connection: 'repair-required', errorMessage: 'Stored pairing requires operator repair.' });
      return;
    }
    if (!pairing.value) {
      this.startDiscovery();
      return;
    }
    if (this.options.lifecycle) {
      const recovered = await this.options.lifecycle.foreground();
      if (!recovered.ok) this.publishFailure(recovered.error, recovered.error.repairRequired ? 'repair-required' : 'offline');
      return;
    }
    this.startDiscovery(true);
    if (this.selectedCandidate) await this.connectPaired(this.selectedCandidate);
  }

  async shutdown(): Promise<void> {
    if (this.options.lifecycle) await this.options.lifecycle.background();
    await this.options.discovery.stop();
    if (!this.options.lifecycle) {
      await this.stopObservation();
      await this.options.sessions.close();
    }
    this.options.networkClose?.();
  }

  startDiscovery(preserveSelection = false): void {
    if (this.state.discovery === 'discovering') return;
    const resetSelection = !preserveSelection && this.state.connection !== 'ready';
    if (resetSelection) this.selectedCandidate = undefined;
    this.publish({
      discovery: 'discovering',
      ...(resetSelection ? { selected: undefined, capabilities: [], setpoint: undefined } : {}),
      errorMessage: undefined
    });
    void this.startDiscoveryWithStoredIdentity().catch(() => {
      this.publish({ discovery: 'error', errorMessage: 'Discovery could not be started.' });
    });
  }

  private async startDiscoveryWithStoredIdentity(): Promise<void> {
    const pairing = await this.options.credentials.loadPairing();
    this.pairedAccessoryKey = pairing.ok && pairing.value
      ? new TextDecoder().decode(fromBase64(pairing.value.accessoryId))
      : undefined;
    await this.options.discovery.start();
  }

  stopDiscovery(): void {
    void this.options.discovery.stop().catch(() => {
      this.publish({ discovery: 'error', errorMessage: 'Discovery could not be stopped.' });
    });
  }

  recordTargetResult(id: string, result: TargetRunResult): void {
    const current = this.state.targetRun.evidence.find((item) => item.id === id);
    if (!current) return;
    const evidence = this.state.targetRun.evidence.map((item) => item.id === id ? { ...item, result, summary: summaryFor(item, result) } : item);
    this.publish({ targetRun: { ...this.state.targetRun, evidence } });
    void this.options.targetEvidence?.save(evidence).catch(() => {
      this.options.logger.event('target-evidence.save-failed', { operation: 'target-evidence', result: 'failure', errorCategory: 'storage-unavailable' });
    });
  }

  selectCandidate(key: string): void {
    const candidate = this.candidatesByAlias.get(key);
    if (!candidate) {
      this.publish({ errorMessage: 'That thermostat is no longer available.' });
      return;
    }
    this.selectedCandidate = candidate;
    this.publish({ selected: this.sanitizeCandidate(key, candidate), connection: 'idle', capabilities: [], setpoint: undefined, errorMessage: undefined });
  }

  async connectCandidate(key: string): Promise<void> {
    const candidate = this.candidatesByAlias.get(key);
    if (!candidate) {
      this.publish({ errorMessage: 'That thermostat is no longer available.' });
      return;
    }
    if (candidate.key !== this.pairedAccessoryKey) {
      this.publish({ errorMessage: 'This thermostat is not the one paired to this app.' });
      return;
    }
    this.selectedCandidate = candidate;
    this.publish({ selected: this.sanitizeCandidate(key, candidate), capabilities: [], setpoint: undefined, errorMessage: undefined });
    await this.connectPaired(candidate);
  }

  async resolvePairedEndpoint(): Promise<NetworkEndpoint | undefined> {
    const pairing = await this.options.credentials.loadPairing();
    if (!pairing.ok || !pairing.value) return undefined;
    const accessoryKey = new TextDecoder().decode(fromBase64(pairing.value.accessoryId));
    this.pairedAccessoryKey = accessoryKey;
    await this.options.discovery.start();
    const immediate = this.options.discovery.resolvePaired(accessoryKey);
    const candidate = immediate ?? await this.waitForPairedCandidate(accessoryKey);
    if (!candidate) return undefined;
    this.selectedCandidate = candidate;
    const alias = this.aliasFor(candidate);
    this.candidatesByAlias.set(alias, candidate);
    this.publish({ selected: this.sanitizeCandidate(alias, candidate) });
    return candidate.endpoint;
  }

  async pair(setupCode: string): Promise<void> {
    const candidate = this.selectedCandidate;
    if (!candidate) {
      this.publish({ connection: 'offline', errorMessage: 'Select a discovered thermostat first.' });
      return;
    }
    if (!this.options.discovery.isEndpointCurrent(candidate.endpoint)) {
      this.publish({ connection: 'offline', errorMessage: 'Active Wi-Fi changed; rediscover the thermostat before pairing.' });
      return;
    }
    this.publish({ connection: 'pairing', errorMessage: undefined });
    let transport: HapHttpSession | undefined;
    try {
      transport = await this.options.factory.connect(candidate.endpoint, candidate.generation);
      const preflight: PairingOwnershipPreflight = {
        advertisedPairing: candidate.pairing,
        existingAssociation: candidate.pairing === 'available' ? 'none-known' : candidate.pairing === 'already-associated' ? 'confirmed' : 'unknown',
        removalApproved: false,
        restorationProcedureRecorded: false
      };
      const result = await this.options.pairing.run({
        post: (path, body) => postTlv(transport!, path, body),
        close: () => transport!.close()
      }, preflight, setupCode, true);
      if (!result.ok) {
        this.publishFailure(result.error, 'offline');
        return;
      }
      if (result.value.status !== 'paired') {
        this.publish({ connection: result.value.status === 'indeterminate' ? 'repair-required' : 'offline', errorMessage: `Pairing ${result.value.status.replace('-', ' ')}; no automatic retry was started.` });
        return;
      }
      this.pairedAccessoryKey = candidate.key;
      const alias = this.aliasFor(candidate);
      const pairedCandidate = this.sanitizeCandidate(alias, candidate);
      this.publish({
        selected: pairedCandidate,
        candidates: [pairedCandidate, ...this.state.candidates.filter((item) => item.key !== alias)]
      });
      await this.connectPaired(candidate);
    } catch {
      this.publish({ connection: 'offline', errorMessage: 'Pairing failed; inspect the sanitized error category.' });
      if (transport) await transport.close().catch(() => undefined);
    }
  }

  async writeSetpoint(value: number): Promise<void> {
    const session = this.options.sessions.currentSession;
    if (!session || !this.projection) {
      this.publish({ errorMessage: 'A verified thermostat session is required.' });
      return;
    }
    const setpoint = this.state.setpoint;
    if (!setpoint) {
      this.publish({ errorMessage: 'The target does not expose a writable setpoint.' });
      return;
    }
    const safeRange = DEFAULT_SAFE_RANGES[isFahrenheit(setpoint.unit) ? 'fahrenheit' : 'celsius'];
    // Select heat/cool threshold fallbacks from the configured target mode.
    // CurrentHeatingCoolingState is often 0 (idle) even while a mode is configured.
    const targetMode = this.projection.capabilities.find((capability) => capability.key === 'targetHeatingCoolingState')?.value?.value;
    let result;
    try {
      result = await this.options.setpoints.execute(session, this.projection, value, safeRange, true, typeof targetMode === 'number' ? targetMode : undefined);
    } catch {
      this.publish({ connection: 'offline', errorMessage: 'Setpoint operation failed before its result could be classified.' });
      return;
    }
    if (!result.ok) {
      this.publishFailure(result.error, 'offline');
      return;
    }
    if (result.value.status !== 'confirmed') {
      this.publish({ errorMessage: `Setpoint ${result.value.status.replace('-', ' ')}; no automatic replay was attempted.` });
      return;
    }
    try {
      await this.refreshCurrentSession();
    } catch {
      this.publish({ connection: 'offline', errorMessage: 'Setpoint was confirmed, but the follow-up refresh failed.' });
    }
  }

  async unpairAccessory(): Promise<void> {
    const result = await this.options.cleanup.removeAccessoryController(this.accessoryAdministration(), this.cleanupApproval, true);
    if (!result.ok) {
      this.publishFailure(result.error, 'repair-required');
      return;
    }
    if (result.value === 'removed') this.publish({ errorMessage: 'POC controller removed; local credentials remain until separately deleted.' });
    else this.publish({ connection: 'repair-required', errorMessage: `Accessory removal ${result.value}; operator repair is required.` });
  }

  async deleteLocalCredentials(): Promise<void> {
    const result = await this.options.cleanup.deleteLocalCredentials(true);
    if (!result.ok) {
      this.publishFailure(result.error, 'repair-required');
      return;
    }
    await this.stopObservation();
    await this.options.sessions.close();
    this.selectedCandidate = undefined;
    this.projection = undefined;
    this.publish({ connection: 'idle', selected: undefined, capabilities: [], setpoint: undefined, errorMessage: undefined });
  }

  private async connectPaired(candidate: HapCandidate): Promise<void> {
    if (!this.options.discovery.isEndpointCurrent(candidate.endpoint)) {
      this.publish({ connection: 'offline', errorMessage: 'Active Wi-Fi changed; rediscover the thermostat before connecting.' });
      return;
    }
    const pairing = await this.options.credentials.loadPairing();
    if (!pairing.ok || !pairing.value) {
      this.publish({ connection: 'repair-required', errorMessage: 'No committed pairing is available for verification.' });
      return;
    }
    await this.stopObservation();
    await this.options.sessions.close();
    this.publish({ connection: 'verifying', errorMessage: undefined });
    const connected = await this.options.sessions.connect(candidate.endpoint, pairing.value);
    if (!connected.ok) {
      this.publishFailure(connected.error, connected.error.repairRequired ? 'repair-required' : 'offline');
      return;
    }
    try {
      await this.refreshCurrentSession();
      const session = this.options.sessions.currentSession;
      if (!session) throw new Error('session was not retained');
      await this.restoreObservation();
    } catch (error) {
      await this.options.sessions.close();
      const category = error instanceof ThermostatRefreshError ? error.category : 'refresh-unclassified';
      this.publish({ connection: 'offline', errorMessage: `Thermostat refresh failed after verification (${category}). Pairing credentials were retained.` });
    }
  }

  async refreshCurrentSession(): Promise<void> {
    const session = this.options.sessions.currentSession;
    if (!session) throw new Error('verified session is unavailable');
    const projection = await this.options.reads.refresh(session);
    this.projection = projection;
    this.publish({ connection: 'ready', capabilities: summarizeCapabilities(projection), setpoint: findSetpoint(projection) });
  }

  private applyEvent(event: CharacteristicEvent): void {
    if (!this.projection || event.generation !== this.options.sessions.currentSession?.generation) return;
    this.projection = applyCharacteristicReads(this.projection, { characteristics: [{ aid: event.aid, iid: event.iid, value: event.value }] }, 'event', event.generation, this.options.clock.now());
    this.publish({ capabilities: summarizeCapabilities(this.projection), setpoint: findSetpoint(this.projection) });
  }

  async stopObservation(): Promise<void> {
    if (!this.observation) return;
    await this.observation.stop();
    this.observation = undefined;
    this.eventTransport = undefined;
  }

  async restoreObservation(): Promise<void> {
    const session = this.options.sessions.currentSession;
    if (!session || !this.projection) return;
    await this.stopObservation();
    this.eventTransport = session instanceof HapHttpSession ? new HapSessionEventTransport(session, this.options.logger) : new UnavailableEventTransport();
    this.observation = new ObservationCoordinator(
      this.eventTransport,
      this.options.clock,
      () => this.refreshCurrentSession().then(() => undefined),
      this.options.logger,
      (event) => this.applyEvent(event)
    );
    await this.observation.start(this.projection, session.generation, 'events');
  }

  private async waitForPairedCandidate(accessoryKey: string): Promise<HapCandidate | undefined> {
    return new Promise((resolve) => {
      let timer: unknown;
      let finished = false;
      let unsubscribe: () => void = () => undefined;
      const finish = (candidate?: HapCandidate) => {
        if (finished) return;
        finished = true;
        if (timer !== undefined) this.options.clock.clearTimeout(timer);
        unsubscribe();
        resolve(candidate);
      };
      unsubscribe = this.options.discovery.subscribe((snapshot) => {
        const candidate = snapshot.candidates.find((item) => item.key === accessoryKey);
        if (candidate) finish(candidate);
      });
      timer = this.options.clock.setTimeout(() => finish(undefined), 15_000);
    });
  }

  private async restoreTargetEvidence(): Promise<void> {
    if (!this.options.targetEvidence) return;
    const evidence = await this.options.targetEvidence.load();
    if (!evidence) return;
    this.publish({ targetRun: { ...this.state.targetRun, evidence } });
  }

  private accessoryAdministration(): AccessoryPairingAdministration {
    return {
      removeController: async () => {
        const record = await this.options.credentials.loadPairing();
        const session = this.options.sessions.currentSession;
        if (!record.ok || !record.value || !session) return 'ambiguous';
        try {
          const response = await session.request('POST', '/pairings', encodePairingRemoval(fromBase64(record.value.controllerId)), 'application/pairing+tlv8');
          if (response.statusCode === 200 || response.statusCode === 204) return 'removed';
          return 'rejected';
        } catch {
          return 'ambiguous';
        }
      }
    };
  }

  private aliasFor(candidate: HapCandidate): string {
    const existing = this.candidateAliases.get(candidate.key);
    if (existing) return existing;
    const usedAliases = new Set(this.candidateAliases.values());
    let ordinal = this.candidateAliases.size + 1;
    let alias = `Thermostat ${ordinal}`;
    while (usedAliases.has(alias)) {
      ordinal += 1;
      alias = `Thermostat ${ordinal}`;
    }
    this.candidateAliases.set(candidate.key, alias);
    return alias;
  }

  private sanitizeCandidate(alias: string, candidate: HapCandidate) {
    const pairedToThisApp = candidate.key === this.pairedAccessoryKey;
    return { key: alias, label: pairedToThisApp ? 'Paired thermostat' : alias, pairing: candidate.pairing, pairedToThisApp } as const;
  }

  private publish(patch: Partial<PocUiState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }

  private publishFailure(error: OperationFailure, connection: PocUiState['connection']): void {
    this.publish({ connection, errorMessage: `Operation failed: ${safeCategory(error.category)}.` });
  }
}

class UnavailableEventTransport implements EventTransport {
  async subscribe(): Promise<void> { throw new Error('event transport unavailable'); }
  async unsubscribe(): Promise<void> { return undefined; }
  onEvent(): () => void { return () => undefined; }
}

function summarizeCapabilities(projection: ThermostatProjection): readonly SanitizedCapability[] {
  return projection.capabilities.map((capability) => ({
    key: capability.key,
    status: capability.status,
    value: capability.value?.value,
    unit: capability.characteristic.unit,
    source: capability.value?.source
  }));
}

function findSetpoint(projection: ThermostatProjection): PocUiState['setpoint'] {
  const candidates = [HapCharacteristicType.targetTemperature, HapCharacteristicType.heatingThresholdTemperature, HapCharacteristicType.coolingThresholdTemperature];
  const capability = candidates.map((type) => projection.capabilities.find((item) => item.characteristic.type === type && item.status === 'available' && item.characteristic.perms.includes('pw'))).find((item) => item !== undefined);
  if (!capability || typeof capability.value?.value !== 'number') return undefined;
  return {
    value: capability.value.value,
    unit: capability.characteristic.unit ?? 'unknown',
    min: capability.characteristic.minValue ?? 0,
    max: capability.characteristic.maxValue ?? 100
  };
}

function encodePairingRemoval(controllerId: Uint8Array): Uint8Array {
  return encodeTlv([
    { type: PairingTlv.method, value: new Uint8Array([4]) },
    { type: PairingTlv.identifier, value: controllerId }
  ]);
}

function isFahrenheit(unit: string): boolean {
  return /fahrenheit|°f|^f$/i.test(unit);
}

function safeCategory(category: string): string {
  return category.replace(/[^a-z0-9-]/gi, '-').slice(0, 64);
}

export function createPocController(): PocController {
  const logger = new StructuredLogger((entry) => console.log('HAP_DIAGNOSTIC', JSON.stringify(entry)));
  const crypto: CryptoProvider = reactNativeCrypto;
  const clock = systemClock;
  const credentials = new CredentialStoreService(new ExpoSecureValueStore(), crypto, logger);
  const factory = new TcpSessionTransportFactory(new ReactNativeTcpAdapter(), crypto, clock, logger);
  const verify = new PairVerifyService(crypto, credentials, logger);
  const sessions = new SessionCoordinator(factory, verify, clock, logger);
  const pairing = new PairSetupService(() => new PairingProtocol(crypto), credentials, logger);
  const reads = new ThermostatReadService(clock, logger);
  const setpoints = new SetpointCommandService(new HapSetpointWriter(), logger);
  const cleanup = new PairingCleanupService(credentials, logger);
  const localNetwork = new NativeWifiNetworkSnapshot();
  const targetEvidence = new TargetRunEvidenceStore(new ExpoSecureValueStore());
  const discovery = new DiscoveryCoordinator(new NativeDnsSdAdapter(), localNetwork.snapshot, clock, logger, 15_000, () => localNetwork.refresh(), (listener) => localNetwork.subscribe(listener));
  let controller!: PocController;
  const lifecycle = new LifecycleCoordinator({
    resolvePairedEndpoint: () => controller.resolvePairedEndpoint(),
    loadPairing: async () => {
      const record = await credentials.loadPairing();
      return record.ok ? record.value ?? undefined : undefined;
    },
    enumerateAndRefresh: () => controller.refreshCurrentSession(),
    restoreObservation: () => controller.restoreObservation(),
    stopObservation: () => controller.stopObservation(),
    session: {
      connect: async (endpoint, record, token: CancellationToken) => {
        if (!discovery.isEndpointCurrent(endpoint)) return { ok: false, error: failure('unavailable', 'active-wifi-endpoint-stale') };
        const connected = await sessions.connect(endpoint, record, token);
        return connected.ok ? { ok: true, value: undefined } : { ok: false, error: connected.error };
      },
      close: () => sessions.close()
    }
  }, clock, logger);
  controller = new PocController({ discovery, credentials, pairing, sessions, factory, reads, setpoints, cleanup, clock, logger, lifecycle, targetEvidence, networkClose: () => localNetwork.close() });
  return controller;
}
