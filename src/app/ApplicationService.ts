import { ConfigStore } from "../storage/ConfigStore";
import { CredentialStore } from "../storage/CredentialStore";
import { HueV1Adapter } from "../protocol/hue/HueV1Adapter";
import { HueGroup, groupAggregateState } from "../protocol/hue/resources/groups";
import { HueScene } from "../protocol/hue/resources/scenes";
import { HueRule } from "../protocol/hue/resources/rules";
import { HueSchedule } from "../protocol/hue/resources/schedules";
import { rebuildScheduleCommandAuthorization } from "../protocol/hue/catalog/schedules";
import { prepareHueMutationPayload, validateHueCatalogPayload } from "../protocol/hue/catalog/resourceCatalog";
import { HueSearchStatus } from "../protocol/hue/search";
import { TpLinkLegacyAdapter } from "../protocol/tplink/TpLinkLegacyAdapter";
import { automationCanBeEnabled, validateRulePayload, validateSchedulePayload } from "../protocol/hue/HueActionPolicy";
import { ambiguous, definiteFailure, partialFailure, success } from "./commandResults";
import { diagnostic, diagnosticForError, errorCategory, userMessage } from "./diagnostics";
import { emitDevelopmentEvent } from "./developmentLogger";
import { DeviceStateStore } from "./DeviceStateStore";
import {
  AppConfig,
  CommandResult,
  Diagnostic,
  HueSnapshot,
  PlugSysInfo,
  ResourceRef,
  ResourceKind,
} from "./types";

export interface HueClient {
  snapshot(): Promise<HueSnapshot>;
  verifyBridgeIdentity?(binding: { bridgeId: string; credential: string }): Promise<unknown>;
  getBridgeConfig?(): Promise<Record<string, unknown>>;
  getCapabilities?(): Promise<Record<string, unknown>>;
  getBridgeRead?(): Promise<{ config: Record<string, unknown>; capabilities?: Record<string, unknown> }>;
  getResource?(kind: Exclude<ResourceKind, "plug">, id: string): Promise<Record<string, unknown>>;
  setLightState?(id: string, payload: Record<string, unknown>): Promise<unknown>;
  setGroupAction?(id: string, payload: Record<string, unknown>): Promise<unknown>;
  activateScene?(scene: HueScene): Promise<unknown>;
  mutate?(kind: Exclude<ResourceKind, "plug">, id: string, operation: "update" | "action" | "status" | "config", payload: Record<string, unknown>): Promise<unknown>;
  create?(kind: Exclude<ResourceKind, "plug">, payload: Record<string, unknown>): Promise<unknown>;
  delete?(kind: Exclude<ResourceKind, "plug">, id: string): Promise<unknown>;
  setSceneLightState?(sceneId: string, lightId: string, payload: Record<string, unknown>): Promise<unknown>;
  getSearchStatus?(kind: "lights" | "sensors"): Promise<unknown>;
  startSearch?(kind: "lights" | "sensors", status?: unknown): Promise<unknown>;
}

export interface PlugClient {
  getSysInfo(endpoint: AppConfig["plugs"][number]): Promise<unknown>;
  getPower(endpoint: AppConfig["plugs"][number]): Promise<boolean>;
  setPower(endpoint: AppConfig["plugs"][number], on: boolean): Promise<void>;
  setAlias?(endpoint: AppConfig["plugs"][number], alias: string): Promise<void>;
  getEnergy?(endpoint: AppConfig["plugs"][number]): Promise<unknown>;
}

export interface ApplicationServiceOptions {
  readonly configStore?: ConfigStore;
  readonly credentialStore?: CredentialStore;
  readonly hue?: HueClient;
  readonly plugs?: PlugClient;
  readonly stateStore?: DeviceStateStore;
  readonly deadlineMs?: number;
  readonly now?: () => number;
}

export interface PlugRefreshOptions {
  readonly ignoreBackoff?: boolean;
}

export interface HueSearchResult {
  readonly started: boolean;
  readonly status: HueSearchStatus;
}

const PLUG_BACKOFF_INITIAL_MS = 10_000;
const PLUG_BACKOFF_MAX_MS = 60 * 60 * 1000;

interface PlugBackoffState {
  readonly consecutiveFailures: number;
  readonly nextAttemptAt: number;
}

export class ApplicationService {
  readonly stateStore: DeviceStateStore;
  private readonly configStore?: ConfigStore;
  private readonly credentialStore?: CredentialStore;
  private hue?: HueClient;
  private readonly plugs?: PlugClient;
  private readonly deadlineMs: number;
  private readonly now: () => number;
  private foreground = true;
  private lifecycleGeneration = 0;
  private hueStateGeneration = 0;
  private hueRefreshInFlight?: Promise<void>;
  private hueMutationBusy = false;
  private readonly plugRefreshes = new Map<string, number>();
  private readonly plugBackoffs = new Map<string, PlugBackoffState>();
  private readonly diagnostics = new Map<string, Diagnostic>();
  private readonly lifecycleListeners = new Set<() => void>();

  constructor(options: ApplicationServiceOptions = {}) {
    this.stateStore = options.stateStore || new DeviceStateStore();
    this.configStore = options.configStore;
    this.credentialStore = options.credentialStore;
    this.hue = options.hue;
    this.plugs = options.plugs;
    this.deadlineMs = options.deadlineMs || 5000;
    this.now = options.now || (() => globalThis.performance?.now?.() ?? Date.now());
  }

  get isForeground(): boolean {
    return this.foreground;
  }

  get generation(): number {
    return this.lifecycleGeneration;
  }

  get hueGeneration(): number {
    return this.hueStateGeneration;
  }

  getDiagnostics(): ReadonlyMap<string, Diagnostic> {
    return this.diagnostics;
  }

  getDiagnostic(key: string): Diagnostic | undefined {
    return this.diagnostics.get(key);
  }

  setDiagnostic(key: string, value: Diagnostic): void {
    const replaced = this.diagnostics.has(key);
    const next = { ...value, key };
    this.diagnostics.set(key, next);
    emitDevelopmentEvent("warn", "diagnostic.set", diagnosticEventContext(next, {
      key,
      transition: replaced ? "replaced" : "added",
    }));
  }

  clearDiagnostic(key: string): void {
    const previous = this.diagnostics.get(key);
    if (!previous) return;
    this.diagnostics.delete(key);
    emitDevelopmentEvent("info", "diagnostic.cleared", diagnosticEventContext(previous, { key }));
  }

  subscribeLifecycle(listener: () => void): () => void {
    this.lifecycleListeners.add(listener);
    return () => this.lifecycleListeners.delete(listener);
  }

  setHueClient(hue: HueClient | undefined): void {
    this.hue = hue;
  }

  setForeground(active: boolean): void {
    if (this.foreground === active) return;
    this.foreground = active;
    this.lifecycleGeneration += 1;
    if (!active) {
      this.stateStore.clearPending();
      this.hueRefreshInFlight = undefined;
      this.hueMutationBusy = false;
    }
    this.lifecycleListeners.forEach((listener) => listener());
  }

  abandonOperations(): void {
    this.foreground = false;
    this.lifecycleGeneration += 1;
    this.stateStore.clearPending();
    this.hueRefreshInFlight = undefined;
    this.hueMutationBusy = false;
    this.lifecycleListeners.forEach((listener) => listener());
  }

  async refreshAll(options: PlugRefreshOptions = {}): Promise<void> {
    if (!this.foreground) return;
    await Promise.all([
      this.refreshHue(),
      this.refreshConfiguredPlugs(options),
    ]);
  }

  async refreshHue(): Promise<void> {
    if (!this.foreground || !this.hue || this.hueMutationBusy || this.hueRefreshInFlight) return;
    const generation = this.lifecycleGeneration;
    const hueGeneration = this.hueStateGeneration;
    const operation = this.withDeadline(() => this.hue!.snapshot(), false, "Hue snapshot");
    this.hueRefreshInFlight = operation.then((result) => {
      if (!this.foreground || generation !== this.lifecycleGeneration || hueGeneration !== this.hueStateGeneration) return;
      if (result.kind === "success" && result.value) {
        this.publishHueSnapshot(result.value as HueSnapshot);
        this.clearDiagnostic("hue:bridge");
      } else if (result.diagnostic) {
        this.setHueUnknown(result.diagnostic);
        this.setDiagnostic("hue:bridge", result.diagnostic);
      }
    }).finally(() => {
      if (generation === this.lifecycleGeneration) this.hueRefreshInFlight = undefined;
    });
    await this.hueRefreshInFlight;
  }

  async refreshConfiguredPlugs(options: PlugRefreshOptions = {}): Promise<void> {
    if (!this.foreground || !this.plugs || !this.configStore) return;
    const config = this.configStore.getCommitted();
    if (!config) return;
    const configuredIds = new Set(config.plugs.map((endpoint) => endpoint.id));
    for (const id of this.plugBackoffs.keys()) {
      if (!configuredIds.has(id)) this.plugBackoffs.delete(id);
    }
    await Promise.all(config.plugs.map((endpoint) => this.refreshPlug(endpoint, {
      ignoreBackoff: options.ignoreBackoff ?? false,
    })));
  }

  async refreshPlug(endpoint: AppConfig["plugs"][number], options: PlugRefreshOptions = { ignoreBackoff: true }): Promise<void> {
    if (!this.foreground || !this.plugs || this.plugRefreshes.has(endpoint.id)) return;
    const backoff = this.plugBackoffs.get(endpoint.id);
    if (!options.ignoreBackoff && backoff && this.now() < backoff.nextAttemptAt) return;
    const generation = this.lifecycleGeneration;
    this.plugRefreshes.set(endpoint.id, generation);
    const ref: ResourceRef = { kind: "plug", plugEndpointId: endpoint.id };
    try {
      const result = await this.withDeadline(() => this.plugs!.getSysInfo(endpoint), false, "Plug refresh", endpoint.id);
      if (!this.foreground || generation !== this.lifecycleGeneration) return;
      if (result.kind === "success") {
        let value = result.value as PlugSysInfo;
        if (value.hasEnergy && this.plugs.getEnergy) {
          const energy = await this.withDeadline(() => this.plugs!.getEnergy!(endpoint), false, "Plug energy refresh", endpoint.id);
          if (energy.kind === "success" && energy.value) {
            value = { ...value, energy: energy.value as PlugSysInfo["energy"], hasEnergy: true };
          }
        }
        if (!this.foreground || generation !== this.lifecycleGeneration) return;
        this.stateStore.setKnown(ref, value);
        this.clearDiagnostic(`plug:${endpoint.id}`);
        this.clearPlugBackoff(endpoint.id);
      } else if (result.diagnostic) {
        this.setDiagnostic(`plug:${endpoint.id}`, result.diagnostic);
        this.stateStore.setUnknown(ref, result.diagnostic);
        this.schedulePlugBackoff(endpoint.id, result.diagnostic.category);
      }
    } finally {
      if (this.plugRefreshes.get(endpoint.id) === generation) {
        this.plugRefreshes.delete(endpoint.id);
      }
    }
  }

  async performPrimary(ref: ResourceRef): Promise<CommandResult> {
    if (!this.foreground) {
      return definiteFailure(diagnostic("Unknown", "The app is not in the foreground.", { resource: ref.kind }));
    }
    const stored = this.stateStore.get(ref);
    if (!stored || stored.state.status !== "known") {
      return definiteFailure(diagnostic("Unknown", "The current state is unknown.", { resource: ref.kind }));
    }
    const knownValue = stored.state.value;
    switch (ref.kind) {
      case "scene":
        if (!this.hue?.activateScene) return definiteFailure(diagnostic("NetworkUnavailable", "Hue scene activation is unavailable."));
        return this.executeHueMutation(() => this.hue?.activateScene?.(knownValue as HueScene), "scene activation", ref);
      case "light":
        if (typeof (knownValue as { state?: { on?: boolean } }).state?.on !== "boolean") {
          return definiteFailure(diagnostic("Unknown", "Light on/off state is unknown."));
        }
        if (!this.hue?.setLightState) return definiteFailure(diagnostic("NetworkUnavailable", "Hue light control is unavailable."));
        return this.executeHueMutation(
          () => this.hue?.setLightState?.(ref.id!, { on: !(knownValue as { state?: { on?: boolean } }).state?.on }),
          "light state", ref,
          { observablePayload: { on: !(knownValue as { state?: { on?: boolean } }).state?.on } },
        );
      case "group": {
        const groupValue = knownValue as HueGroup;
        if (!groupValue.state || typeof groupValue.state.any_on !== "boolean") {
          return definiteFailure(diagnostic("Unknown", "Group aggregate state is unknown."));
        }
        if (!this.hue?.setGroupAction) return definiteFailure(diagnostic("NetworkUnavailable", "Hue group control is unavailable."));
        const state = groupAggregateState(groupValue);
        return this.executeHueMutation(
          () => this.hue?.setGroupAction?.(ref.id!, { on: state !== "on" }),
          "group action", ref,
          { observablePayload: { on: state !== "on" } },
        );
      }
      case "sensor": {
        const sensor = knownValue as { config?: { on?: boolean } };
        if (typeof sensor.config?.on !== "boolean") return definiteFailure(diagnostic("Unknown", "This sensor has no binary action."));
        if (!this.hue?.mutate) return definiteFailure(diagnostic("NetworkUnavailable", "Hue sensor control is unavailable."));
        return this.executeHueMutation(
          () => this.hue?.mutate?.("sensor", ref.id!, "config", { config: { on: !sensor.config!.on } }),
          "sensor state", ref,
          { observablePayload: { config: { on: !sensor.config!.on } } },
        );
      }
      case "rule":
      case "schedule": {
        const value = knownValue as HueRule | HueSchedule;
        if (value.status !== "enabled" && value.status !== "disabled") {
          return definiteFailure(diagnostic("Unknown", "This automation has no binary status."));
        }
        if (!this.hue?.mutate) return definiteFailure(diagnostic("NetworkUnavailable", "Hue automation control is unavailable."));
        if (value.status === "disabled") {
          const actions = (value as HueRule).actions || [];
          const scheduleCommand = (value as HueSchedule).command;
          const decision = automationCanBeEnabled(scheduleCommand ? [scheduleCommand] : actions);
          if (!decision.allowed) {
            return definiteFailure(diagnostic("ProtocolRejected", decision.reason, { resource: `${ref.kind}:${ref.id}` }));
          }
        }
        return this.executeHueMutation(
          () => this.hue?.mutate?.(ref.kind as "rule" | "schedule", ref.id!, "status", { status: value.status === "enabled" ? "disabled" : "enabled" }),
          `${ref.kind} status`, ref,
          { observablePayload: { status: value.status === "enabled" ? "disabled" : "enabled" } },
        );
      }
      case "plug": {
        const endpoint = await this.findPlug(ref.plugEndpointId || ref.id);
        if (!endpoint || !this.plugs) return definiteFailure(diagnostic("Unknown", "Plug endpoint is missing."));
        const info = knownValue as { relayState?: boolean };
        if (typeof info.relayState !== "boolean") return definiteFailure(diagnostic("Unknown", "Plug relay state is unknown."));
        return this.executePlugMutation(endpoint, !info.relayState, ref);
      }
      default:
        return definiteFailure(diagnostic("Unknown", "This resource has no primary action."));
    }
  }

  async setAbsolute(ref: ResourceRef, on: boolean): Promise<CommandResult> {
    if (!this.foreground) return definiteFailure(diagnostic("Unknown", "The app is not in the foreground."));
    if (ref.kind === "light") {
      if (!this.hue?.setLightState) return definiteFailure(diagnostic("NetworkUnavailable", "Hue light control is unavailable."));
      return this.executeHueMutation(() => this.hue?.setLightState?.(ref.id!, { on }), "light absolute state", ref, { observablePayload: { on } });
    }
    if (ref.kind === "group") {
      if (!this.hue?.setGroupAction) return definiteFailure(diagnostic("NetworkUnavailable", "Hue group control is unavailable."));
      return this.executeHueMutation(() => this.hue?.setGroupAction?.(ref.id!, { on }), "group absolute state", ref, { observablePayload: { on } });
    }
    if (ref.kind === "sensor") {
      if (!this.hue?.mutate) return definiteFailure(diagnostic("NetworkUnavailable", "Hue sensor control is unavailable."));
      return this.executeHueMutation(() => this.hue?.mutate?.("sensor", ref.id!, "config", { config: { on } }), "sensor absolute state", ref, { observablePayload: { config: { on } } });
    }
    if (ref.kind === "plug") {
      const endpoint = await this.findPlug(ref.plugEndpointId || ref.id);
      return endpoint ? this.executePlugMutation(endpoint, on, ref) : definiteFailure(diagnostic("Unknown", "Plug endpoint is missing."));
    }
    return definiteFailure(diagnostic("Unknown", "Absolute state is not supported for this resource."));
  }

  async mutateHue(
    kind: Exclude<ResourceKind, "plug">,
    id: string,
    operation: "update" | "action" | "status" | "config",
    payload: Record<string, unknown>,
  ): Promise<CommandResult> {
    if (!this.hue?.mutate) return definiteFailure(diagnostic("NetworkUnavailable", "Hue resource mutation is unavailable."));
    const current = this.stateStore.get({ kind, id });
    const original = current?.state.status === "known" && current.state.value && typeof current.state.value === "object"
      ? current.state.value as Record<string, unknown>
      : undefined;
    if ((operation === "update" || operation === "config") && !original) {
      return definiteFailure(diagnostic("Unknown", "This Hue resource has no known original state; refresh it before updating." , { resource: `${kind}:${id}` }));
    }
    if (operation === "status" && payload.status === "enabled" && !original) {
      return definiteFailure(diagnostic("Unknown", "This automation has no known original state; refresh it before enabling.", { resource: `${kind}:${id}` }));
    }
    const prepared = operation === "update" || operation === "config"
      ? prepareHueMutationPayload(kind, "update", original, payload)
      : { allowed: true as const, payload };
    if (!prepared.allowed) return definiteFailure(diagnostic("ProtocolRejected", prepared.reason, { resource: `${kind}:${id}` }));
    const validation = validateHueCatalogPayload(kind, operation === "config" ? "config" : operation, prepared.payload);
    if (!validation.allowed) return definiteFailure(diagnostic("ProtocolRejected", validation.reason, { resource: `${kind}:${id}` }));
    if (Object.keys(prepared.payload).length === 0) return success();
    if (kind === "rule") {
      const decision = validateRulePayload(prepared.payload);
      if (!decision.allowed) return definiteFailure(diagnostic("ProtocolRejected", decision.reason));
      if (operation === "status" && prepared.payload.status === "enabled") {
        const actions = current?.state.status === "known" ? (current.state.value as HueRule).actions || [] : [];
        if (actions.length === 0) return definiteFailure(diagnostic("ProtocolRejected", "A Rule with no actions cannot be enabled."));
        const catalog = validateHueCatalogPayload("rule", "update", { actions });
        if (!catalog.allowed) return definiteFailure(diagnostic("ProtocolRejected", catalog.reason));
        const enabled = automationCanBeEnabled(actions);
        if (!enabled.allowed) return definiteFailure(diagnostic("ProtocolRejected", enabled.reason));
      }
    }
    if (kind === "schedule") {
      const decision = validateSchedulePayload(prepared.payload);
      if (!decision.allowed) return definiteFailure(diagnostic("ProtocolRejected", decision.reason));
      if (operation === "status" && prepared.payload.status === "enabled") {
        const command = current?.state.status === "known" ? (current.state.value as HueSchedule).command : undefined;
        if (command) {
          const catalog = validateHueCatalogPayload("schedule", "update", { command });
          if (!catalog.allowed) return definiteFailure(diagnostic("ProtocolRejected", catalog.reason));
        }
        const enabled = command ? automationCanBeEnabled([command]) : { allowed: true as const };
        if (!enabled.allowed) return definiteFailure(diagnostic("ProtocolRejected", enabled.reason));
      }
    }
    return this.executeHueMutation(() => this.hue?.mutate?.(kind, id, operation, prepared.payload), `${kind} ${operation}`, { kind, id }, {
      observablePayload: operation === "update" || operation === "config" || operation === "status" ? prepared.payload : undefined,
    });
  }

  async createHue(kind: Exclude<ResourceKind, "plug">, payload: Record<string, unknown>): Promise<CommandResult> {
    if (!this.hue?.create) return definiteFailure(diagnostic("NetworkUnavailable", "Hue resource creation is unavailable."));
    const validation = validateHueCatalogPayload(kind, "create", payload);
    if (!validation.allowed) return definiteFailure(diagnostic("ProtocolRejected", validation.reason, { resource: kind }));
    return this.executeHueMutation(() => this.hue?.create?.(kind, payload), `${kind} create`, { kind });
  }

  async deleteHue(kind: Exclude<ResourceKind, "plug">, id: string): Promise<CommandResult> {
    if (!this.hue?.delete) return definiteFailure(diagnostic("NetworkUnavailable", "Hue resource deletion is unavailable."));
    return this.executeHueMutation(() => this.hue?.delete?.(kind, id), `${kind} delete`, { kind, id });
  }

  async mutateSceneLightState(sceneId: string, lightId: string, payload: Record<string, unknown>): Promise<CommandResult> {
    if (!this.hue?.setSceneLightState) return definiteFailure(diagnostic("NetworkUnavailable", "Scene light-state editing is unavailable."));
    const validation = validateHueCatalogPayload("scene", "update", { lightstates: { [lightId]: payload } });
    if (!validation.allowed) return definiteFailure(diagnostic("ProtocolRejected", validation.reason, { resource: `scene:${sceneId}` }));
    return this.executeHueMutation(
      () => this.hue?.setSceneLightState?.(sceneId, lightId, payload),
      "scene light state",
      { kind: "scene", id: sceneId },
      { observablePayload: { lightstates: { [lightId]: payload } } },
    );
  }

  async rebuildScheduleCommand(id: string): Promise<CommandResult> {
    if (!this.credentialStore) return definiteFailure(diagnostic("StorageError", "Protected Hue storage is unavailable."));
    const stored = this.stateStore.get({ kind: "schedule", id });
    if (!stored || stored.state.status !== "known" || !(stored.state.value as HueSchedule).command) {
      return definiteFailure(diagnostic("Unknown", "This schedule has no editable command."));
    }
    const binding = await this.credentialStore.getBinding();
    if (binding.status !== "present") return definiteFailure(diagnostic("AuthenticationRejected", "The current Hue credential is unavailable."));
    const command = (stored.state.value as HueSchedule).command!;
    const rebuilt = rebuildScheduleCommandAuthorization(command, binding.binding.credential);
    return this.mutateHue("schedule", id, "update", { command: rebuilt });
  }

  async setPlugAlias(endpoint: AppConfig["plugs"][number], alias: string): Promise<CommandResult> {
    if (!this.plugs?.setAlias) return definiteFailure(diagnostic("NetworkUnavailable", "The plug alias adapter is unavailable."));
    this.stateStore.setPending({ kind: "plug", plugEndpointId: endpoint.id }, true);
    const generation = this.lifecycleGeneration;
    try {
      const result = await this.withDeadline(() => this.plugs!.setAlias!(endpoint, alias), true, "plug alias", endpoint.id);
      if (result.kind === "success") {
        if (!this.foreground || generation !== this.lifecycleGeneration) {
          return { kind: "abandoned", diagnostic: diagnostic("Unknown", "Operation abandoned when the app left the foreground.") };
        }
        await this.refreshPlug(endpoint, { ignoreBackoff: true });
      }
      return result;
    } finally {
      this.stateStore.setPending({ kind: "plug", plugEndpointId: endpoint.id }, false);
    }
  }

  async getHueSearchStatus(kind: "lights" | "sensors"): Promise<HueSearchStatus | undefined> {
    if (!this.foreground || !this.hue?.getSearchStatus) return undefined;
    return await this.hue.getSearchStatus(kind) as HueSearchStatus;
  }

  async startHueSearch(kind: "lights" | "sensors", status?: HueSearchStatus): Promise<HueSearchResult | undefined> {
    if (!this.foreground || !this.hue?.startSearch) return undefined;
    return await this.hue.startSearch(kind, status) as HueSearchResult;
  }

  async readHueAdministration(): Promise<CommandResult<{ config: Record<string, unknown>; capabilities?: Record<string, unknown> }>> {
    if (!this.hue?.getBridgeRead && !this.hue?.getBridgeConfig) return definiteFailure(diagnostic("NetworkUnavailable", "Hue is not configured."));
    if (this.hue.getBridgeRead) {
      const read = await this.withDeadline(() => this.hue!.getBridgeRead!(), false, "Hue bridge administration");
      return read as CommandResult<{ config: Record<string, unknown>; capabilities?: Record<string, unknown> }>;
    }
    if (!this.hue.getBridgeConfig) return definiteFailure(diagnostic("NetworkUnavailable", "Hue is not configured."));
    const result = await this.withDeadline(() => this.hue!.getBridgeConfig!(), false, "Hue bridge configuration");
    if (result.kind !== "success" || !result.value) return result as CommandResult<{ config: Record<string, unknown>; capabilities?: Record<string, unknown> }>;
    let capabilities: Record<string, unknown> | undefined;
    if (this.hue.getCapabilities) {
      const capabilitiesResult = await this.withDeadline(() => this.hue!.getCapabilities!(), false, "Hue capabilities");
      if (capabilitiesResult.kind !== "success") {
        return capabilitiesResult as CommandResult<{ config: Record<string, unknown>; capabilities?: Record<string, unknown> }>;
      }
      capabilities = capabilitiesResult.value;
    }
    return success({ config: result.value, capabilities });
  }

  async addFavorite(ref: ResourceRef): Promise<CommandResult> {
    return this.mutateFavorites((favorites) => favorites.some((item) => sameResourceRef(item, ref)) ? favorites : [...favorites, ref]);
  }

  async removeFavorite(ref: ResourceRef): Promise<CommandResult> {
    return this.mutateFavorites((favorites) => favorites.filter((item) => !sameResourceRef(item, ref)));
  }

  async removePlugEndpoint(endpointId: string): Promise<CommandResult> {
    if (!this.configStore) return definiteFailure(diagnostic("StorageError", userMessage("StorageError")));
    const result = await this.configStore.mutate((current) => ({
      ...current,
      plugs: current.plugs.filter((endpoint) => endpoint.id !== endpointId),
      favorites: current.favorites.filter((favorite) => !(favorite.kind === "plug" && (favorite.plugEndpointId || favorite.id) === endpointId)),
    }));
    if (result.status === "success") {
      this.stateStore.remove({ kind: "plug", plugEndpointId: endpointId });
      this.plugBackoffs.delete(endpointId);
      return success();
    }
    return definiteFailure(diagnostic("StorageError", userMessage("StorageError")));
  }

  private async executeHueMutation(
    operation: (() => Promise<unknown> | undefined) | undefined,
    operationName: string,
    ref: ResourceRef,
    reconciliation: { readonly observablePayload?: Record<string, unknown> } = {},
  ): Promise<CommandResult> {
    if (!operation || !this.hue) return definiteFailure(diagnostic("NetworkUnavailable", "Hue is not configured."));
    if (this.hueMutationBusy) return definiteFailure(diagnostic("Busy", userMessage("Busy"), { operation: operationName }));
    this.hueMutationBusy = true;
    this.hueStateGeneration += 1;
    const generation = this.lifecycleGeneration;
    try {
      const result = await this.withDeadline(operation, true, operationName, `${ref.kind}:${ref.id || ref.plugEndpointId || ""}`);
      if (result.kind === "ambiguous" && reconciliation.observablePayload && ref.id && this.hue.getResource) {
        return this.reconcileHueMutation(ref, reconciliation.observablePayload, result.diagnostic);
      }
      if (result.kind !== "success") return result;
      if (!this.foreground || generation !== this.lifecycleGeneration) return { kind: "abandoned", diagnostic: diagnostic("Unknown", "Operation abandoned when the app left the foreground.") };
      this.hueMutationBusy = false;
      await this.refreshHue();
      return success();
    } finally {
      this.hueMutationBusy = false;
    }
  }

  private async reconcileHueMutation(ref: ResourceRef, intended: Record<string, unknown>, originalDiagnostic?: Diagnostic): Promise<CommandResult> {
    if (!this.foreground || !this.hue?.getResource || !ref.id) return ambiguous(originalDiagnostic || diagnostic("Ambiguous", userMessage("Ambiguous")));
    const generation = this.lifecycleGeneration;
    const read = await this.withDeadline(
      () => this.hue!.getResource!(ref.kind as Exclude<ResourceKind, "plug">, ref.id!),
      false,
      "Hue write read-back",
      `${ref.kind}:${ref.id}`,
    );
    if (!this.foreground || generation !== this.lifecycleGeneration) {
      return { kind: "abandoned", diagnostic: diagnostic("Unknown", "Operation abandoned when the app left the foreground.") };
    }
    if (read.kind !== "success" || !read.value) {
      return ambiguous(read.diagnostic || originalDiagnostic || diagnostic("Ambiguous", userMessage("Ambiguous"), { resource: `${ref.kind}:${ref.id}` }));
    }
    const observed = read.value as Record<string, unknown>;
    if (!matchesHueIntendedState(ref.kind as Exclude<ResourceKind, "plug">, observed, intended)) {
      return ambiguous(diagnostic("Ambiguous", "Hue write outcome remains unresolved after one read-back.", { resource: `${ref.kind}:${ref.id}` }));
    }
    this.stateStore.setKnown(ref, { ...observed, id: ref.id });
    return success(observed);
  }

  private async executePlugMutation(
    endpoint: AppConfig["plugs"][number],
    desiredOn: boolean,
    ref: ResourceRef,
  ): Promise<CommandResult> {
    if (!this.plugs) return definiteFailure(diagnostic("NetworkUnavailable", "Plugs are not configured."));
    if (!this.foreground) return definiteFailure(diagnostic("Unknown", "The app is not in the foreground."));
    this.stateStore.setPending(ref, true);
    const generation = this.lifecycleGeneration;
    try {
      const write = await this.withDeadline(() => this.plugs!.setPower(endpoint, desiredOn), true, "plug state", endpoint.id);
      if (write.kind === "definite_failure" || write.kind === "abandoned") return write;
      if (write.kind === "ambiguous") {
        if (!this.foreground || generation !== this.lifecycleGeneration) {
          return { kind: "abandoned", diagnostic: diagnostic("Unknown", "Operation abandoned when the app left the foreground.") };
        }
        const readback = await this.withDeadline(() => this.plugs!.getPower(endpoint), false, "plug read-back", endpoint.id);
        if (readback.kind === "success" && readback.value === desiredOn) {
          this.setKnownPlugPower(ref, desiredOn);
          return success();
        }
        return ambiguous(readback.diagnostic || diagnostic("Ambiguous", userMessage("Ambiguous"), { resource: endpoint.id }));
      }
      if (!this.foreground || generation !== this.lifecycleGeneration) {
        return { kind: "abandoned", diagnostic: diagnostic("Unknown", "Operation abandoned when the app left the foreground.") };
      }
      const readback = await this.withDeadline(() => this.plugs!.getPower(endpoint), false, "plug read-back", endpoint.id);
      if (readback.kind === "success" && readback.value === desiredOn) {
        if (generation === this.lifecycleGeneration && this.foreground) this.setKnownPlugPower(ref, desiredOn);
        return success();
      }
      return readback.kind === "ambiguous"
        ? readback
        : definiteFailure(readback.diagnostic || diagnostic("ProtocolMalformed", "Plug read-back did not establish the requested state."));
    } finally {
      if (generation === this.lifecycleGeneration) this.stateStore.setPending(ref, false);
    }
  }

  private setKnownPlugPower(ref: ResourceRef, relayState: boolean): void {
    const stored = this.stateStore.get(ref);
    const previous = stored?.state.status === "known"
      ? stored.state.value as PlugSysInfo
      : stored?.lastKnownValue as PlugSysInfo | undefined;
    this.stateStore.setKnown(ref, { ...previous, relayState });
  }

  private async withDeadline(
    operation: () => Promise<unknown> | undefined,
    writeMayTransmit: boolean,
    operationName: string,
    resource?: string,
  ): Promise<CommandResult<any>> {
    if (!this.foreground) return { kind: "abandoned", diagnostic: diagnostic("Unknown", "Operation abandoned outside foreground.") };
    const started = Date.now();
    const operationGeneration = this.lifecycleGeneration;
    emitDevelopmentEvent("info", "operation.started", {
      operation: operationName,
      ...(resource ? { resource } : {}),
      mode: writeMayTransmit ? "write" : "read",
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    let terminalResult: CommandResult<any> | undefined;
    const promise = Promise.resolve().then(() => operation());
    // A timed-out operation may reject after the local deadline. Consume that
    // late rejection; lifecycle/generation guards decide whether its value is
    // still publishable.
    void promise.catch(() => undefined);
    const deadline = new Promise<CommandResult<any>>((resolve) => {
      timer = setTimeout(() => {
        resolve(writeMayTransmit
          ? ambiguous(diagnostic("Ambiguous", userMessage("Ambiguous"), { operation: operationName, resource, elapsedMs: this.deadlineMs }))
          : definiteFailure(diagnostic("Timeout", userMessage("Timeout"), { operation: operationName, resource, elapsedMs: this.deadlineMs })));
      }, this.deadlineMs);
    });
    try {
      const value = await Promise.race([
        promise.then((result) => success(result)),
        deadline,
      ]);
      terminalResult = !this.foreground || operationGeneration !== this.lifecycleGeneration
        ? { kind: "abandoned", diagnostic: diagnostic("Unknown", "Operation abandoned when the app left the foreground.") }
        : value;
      return terminalResult;
    } catch (error) {
      if (!this.foreground || operationGeneration !== this.lifecycleGeneration) {
        terminalResult = { kind: "abandoned", diagnostic: diagnostic("Unknown", "Operation abandoned when the app left the foreground.") };
        return terminalResult;
      }
      if (error && typeof error === "object" && (error as { responseKind?: unknown }).responseKind === "partial_failure") {
        terminalResult = partialFailure(diagnosticForError(error, operationName, resource));
        return terminalResult;
      }
      const category = errorCategory(error);
      terminalResult = category === "Ambiguous"
        ? ambiguous({ ...diagnosticForError(error, operationName, resource), elapsedMs: Date.now() - started })
        : definiteFailure({ ...diagnosticForError(error, operationName, resource), elapsedMs: Date.now() - started });
      return terminalResult;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      emitDevelopmentEvent("info", "operation.completed", operationEventContext(
        operationName,
        resource,
        terminalResult || { kind: "definite_failure", diagnostic: diagnostic("Unknown", "Operation did not produce a result.") },
        Math.max(0, Date.now() - started),
      ));
    }
  }

  private publishHueSnapshot(snapshot: HueSnapshot): void {
    const collections: Array<[Exclude<ResourceKind, "plug">, Record<string, unknown>]> = [
      ["light", snapshot.lights], ["group", snapshot.groups], ["scene", snapshot.scenes],
      ["sensor", snapshot.sensors], ["rule", snapshot.rules], ["schedule", snapshot.schedules],
      ["resourcelink", snapshot.resourcelinks],
    ];
    collections.forEach(([kind, collection]) => {
      const seen = new Set(Object.keys(collection).map((id) => `${kind}:${id}`));
      Array.from(this.stateStore.getAll().keys())
        .filter((key) => key.startsWith(`${kind}:`) && !seen.has(key))
        .forEach((key) => {
          const separator = key.indexOf(":");
          this.stateStore.remove({ kind, id: key.slice(separator + 1) });
        });
      Object.keys(collection).forEach((id) => {
        const value = collection[id] && typeof collection[id] === "object" ? collection[id] as Record<string, unknown> : {};
        this.stateStore.setKnown({ kind, id }, { ...value, id });
      });
    });
    emitDevelopmentEvent("info", "hue.snapshot.published", {
      lights: Object.keys(snapshot.lights).length,
      groups: Object.keys(snapshot.groups).length,
      scenes: Object.keys(snapshot.scenes).length,
      sensors: Object.keys(snapshot.sensors).length,
      rules: Object.keys(snapshot.rules).length,
      schedules: Object.keys(snapshot.schedules).length,
      resourcelinks: Object.keys(snapshot.resourcelinks).length,
    });
  }

  private setHueUnknown(reason: Diagnostic): void {
    this.stateStore.getAll().forEach((_stored, key) => {
      if (!key.startsWith("plug:")) {
        const separator = key.indexOf(":");
        const kind = key.slice(0, separator);
        const id = key.slice(separator + 1);
        this.stateStore.setUnknown({ kind: kind as Exclude<ResourceKind, "plug">, id }, reason);
      }
    });
  }

  private async findPlug(id?: string): Promise<AppConfig["plugs"][number] | undefined> {
    if (!id || !this.configStore) return undefined;
    return this.configStore.getCommitted()?.plugs.find((endpoint) => endpoint.id === id);
  }

  private schedulePlugBackoff(endpointId: string, category: Diagnostic["category"]): void {
    const previousFailures = this.plugBackoffs.get(endpointId)?.consecutiveFailures || 0;
    const consecutiveFailures = previousFailures + 1;
    const delayMs = Math.min(
      PLUG_BACKOFF_MAX_MS,
      PLUG_BACKOFF_INITIAL_MS * (2 ** Math.min(consecutiveFailures - 1, 20)),
    );
    this.plugBackoffs.set(endpointId, {
      consecutiveFailures,
      nextAttemptAt: this.now() + delayMs,
    });
    emitDevelopmentEvent("info", "plug.backoff.scheduled", {
      resource: endpointId,
      category,
      consecutiveFailures,
      delayMs,
    });
  }

  private clearPlugBackoff(endpointId: string): void {
    const previous = this.plugBackoffs.get(endpointId);
    if (!previous) return;
    this.plugBackoffs.delete(endpointId);
    emitDevelopmentEvent("info", "plug.backoff.cleared", {
      resource: endpointId,
      consecutiveFailures: previous.consecutiveFailures,
    });
  }

  private async mutateFavorites(mutator: (favorites: readonly ResourceRef[]) => readonly ResourceRef[]): Promise<CommandResult> {
    if (!this.configStore) return definiteFailure(diagnostic("StorageError", userMessage("StorageError")));
    const result = await this.configStore.mutate((current) => ({
      ...current,
      favorites: mutator(current.favorites).map((favorite) => ({ ...favorite })),
    }));
    return result.status === "success"
      ? success()
      : definiteFailure(diagnostic("StorageError", userMessage("StorageError")));
  }
}

function diagnosticEventContext(
  value: Diagnostic,
  additional: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...additional,
    category: value.category,
    ...(value.operation ? { operation: value.operation } : {}),
    ...(value.resource ? { resource: value.resource } : {}),
    ...(value.statusCode !== undefined ? { statusCode: value.statusCode } : {}),
    ...(value.protocolCode !== undefined ? { protocolCode: value.protocolCode } : {}),
    ...(value.detail || value.message ? { cause: value.detail || value.message } : {}),
  };
}

function operationEventContext(
  operation: string,
  resource: string | undefined,
  result: CommandResult,
  elapsedMs: number,
): Record<string, unknown> {
  const value = result.diagnostic;
  return {
    operation,
    ...(resource ? { resource } : {}),
    resultKind: result.kind,
    elapsedMs,
    ...(value ? diagnosticEventContext(value) : {}),
  };
}

function matchesHueIntendedState(
  kind: Exclude<ResourceKind, "plug">,
  observed: Record<string, unknown>,
  intended: Record<string, unknown>,
): boolean {
  const stateKeys = new Set(["on", "bri", "hue", "sat", "xy", "ct", "alert", "effect", "transitiontime"]);
  const groupAction = Object.prototype.hasOwnProperty.call(intended, "action")
    ? intended.action
    : kind === "group" && Object.keys(intended).every((key) => stateKeys.has(key)) ? intended : undefined;
  const lightState = Object.prototype.hasOwnProperty.call(intended, "state")
    ? intended.state
    : kind === "light" && Object.keys(intended).every((key) => stateKeys.has(key)) ? intended : undefined;
  const sensorConfig = Object.prototype.hasOwnProperty.call(intended, "config") ? intended.config : undefined;
  const sceneLightstates = Object.prototype.hasOwnProperty.call(intended, "lightstates") ? intended.lightstates : undefined;
  if (sceneLightstates && observed.lightstates && typeof observed.lightstates === "object" && !Array.isArray(observed.lightstates)) {
    return Object.entries(sceneLightstates as Record<string, unknown>).every(([lightId, state]) => {
      const actual = (observed.lightstates as Record<string, unknown>)[lightId];
      return actual && typeof actual === "object" && state && typeof state === "object"
        && Object.entries(state as Record<string, unknown>).every(([key, value]) => JSON.stringify((actual as Record<string, unknown>)[key]) === JSON.stringify(value));
    });
  }
  const candidate = lightState && observed.state && typeof observed.state === "object"
    ? observed.state as Record<string, unknown>
    : groupAction && observed.action && typeof observed.action === "object"
      ? observed.action as Record<string, unknown>
      : sensorConfig && observed.config && typeof observed.config === "object"
        ? observed.config as Record<string, unknown>
        : observed;
  const expected = lightState || groupAction || sensorConfig || intended;
  if (!expected || typeof expected !== "object" || Array.isArray(expected)) return false;
  return Object.entries(expected as Record<string, unknown>).every(([key, value]) => {
    const actual = candidate[key];
    return JSON.stringify(actual) === JSON.stringify(value);
  });
}

function sameResourceRef(left: ResourceRef, right: ResourceRef): boolean {
  return left.kind === right.kind
    && (left.kind === "plug"
      ? (left.plugEndpointId || left.id) === (right.plugEndpointId || right.id)
      : left.id === right.id);
}

export function createProductionApplicationService(configStore: ConfigStore): ApplicationService {
  // App bootstrap creates the authenticated Hue adapter after protected-store
  // readiness is known. Keeping this factory side-effect free is important:
  // no network call is made merely to render the shell.
  return new ApplicationService({ configStore, plugs: new TpLinkLegacyAdapter() });
}

// Concrete adapter imports remain application-boundary details; UI imports only
// ApplicationService and this context, never a protocol implementation.
export const isConcreteHueAdapter = (value: unknown): value is HueV1Adapter => value instanceof HueV1Adapter;
