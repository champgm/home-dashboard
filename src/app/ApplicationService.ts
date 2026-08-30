import { ConfigStore } from "../storage/ConfigStore";
import { CredentialStore } from "../storage/CredentialStore";
import { valuesEqual } from "../protocol/hue/changedFields";
import { HueV1Adapter } from "../protocol/hue/HueV1Adapter";
import { HueGroup, groupAggregateState } from "../protocol/hue/resources/groups";
import { HueScene } from "../protocol/hue/resources/scenes";
import { HueRule } from "../protocol/hue/resources/rules";
import { HueSchedule, parseSchedules } from "../protocol/hue/resources/schedules";
import { rebuildScheduleCommandAuthorization } from "../protocol/hue/catalog/schedules";
import { prepareHueMutationPayload, validateHueCatalogPayload } from "../protocol/hue/catalog/resourceCatalog";
import { HueSearchStatus } from "../protocol/hue/search";
import { TpLinkLegacyAdapter } from "../protocol/tplink/TpLinkLegacyAdapter";
import { automationCanBeEnabled, validateRulePayload, validateSchedulePayload } from "../protocol/hue/HueActionPolicy";
import { ambiguous, definiteFailure, partialFailure, success } from "./commandResults";
import { diagnostic, diagnosticForError, errorCategory, userMessage } from "./diagnostics";
import { emitDevelopmentEvent } from "./developmentLogger";
import { DeviceStateStore } from "./DeviceStateStore";
import { buildSimpleDimmerBindingPayload, previewStructuralDimmerEdit } from "./dimmerEditing";
import { buildEditorModel, snapshotFromStateStore } from "../protocol/hue/dimmer/projector";
import { getDimmerModelCatalog } from "../protocol/hue/dimmer/modelCatalog";
import { dimmerActionTargetExists } from "../protocol/hue/dimmer/actions";
import { parseResourceLinkReferences, parseRuleReferences, parseScheduleCommandReference } from "../protocol/hue/dimmer/references";
import {
  DimmerChangeOperation,
  DimmerChangeSet,
  DimmerRuleShape,
  SimpleDimmerBindingEdit,
  StructuralCommitReport,
  StructuralOperationResult,
  StructuralDimmerEdit,
  resourceRefKey,
} from "../protocol/hue/dimmer/types";
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
  /** Characterized catalog used for independent dimmer save revalidation. */
  readonly dimmerCatalog?: import("../protocol/hue/dimmer/modelCatalog").DimmerModelCatalog;
  readonly deadlineMs?: number;
  readonly now?: () => number;
}

export interface PlugRefreshOptions {
  readonly ignoreBackoff?: boolean;
}

export interface HueRefreshOptions {
  /** Wait for an older snapshot and issue a fresh read after a mutation. */
  readonly force?: boolean;
  /** Internal mutation lifecycle path; keeps the write gate held during refresh. */
  readonly allowWhileMutationBusy?: boolean;
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

interface HueMutationExecutionOptions {
  readonly observablePayload?: Record<string, unknown>;
  /** Structural commits hold the busy gate and refresh only after the set. */
  readonly busyAlreadyHeld?: boolean;
  readonly refresh?: boolean;
}

export class ApplicationService {
  readonly stateStore: DeviceStateStore;
  private readonly configStore?: ConfigStore;
  private readonly credentialStore?: CredentialStore;
  private hue?: HueClient;
  private readonly plugs?: PlugClient;
  private readonly deadlineMs: number;
  private readonly now: () => number;
  readonly dimmerCatalog: import("../protocol/hue/dimmer/modelCatalog").DimmerModelCatalog;
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
    this.dimmerCatalog = options.dimmerCatalog || getDimmerModelCatalog();
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

  async refreshHue(options: HueRefreshOptions = {}): Promise<void> {
    if (!this.foreground || !this.hue || (this.hueMutationBusy && !options.allowWhileMutationBusy)) return;
    while (this.hueRefreshInFlight) {
      if (!options.force) return;
      const inFlight = this.hueRefreshInFlight;
      await inFlight;
      if (!this.foreground || !this.hue || (this.hueMutationBusy && !options.allowWhileMutationBusy)) return;
    }
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
    return this.mutateHueInternal(kind, id, operation, payload);
  }

  /** The common one-binding dimmer path: one Rule update, no preview dialog. */
  async saveSimpleBinding(edit: SimpleDimmerBindingEdit): Promise<CommandResult> {
    const revalidated = this.revalidateSimpleDimmerBinding(edit);
    if (!revalidated.allowed) return definiteFailure(diagnostic("ProtocolRejected", revalidated.reason));
    edit = revalidated.edit;
    const stored = this.stateStore.get({ kind: "rule", id: edit.ruleId });
    if (!stored || stored.state.status !== "known" || !stored.state.value || typeof stored.state.value !== "object") {
      return definiteFailure(diagnostic("Unknown", "The Rule is no longer available; refresh the bridge before editing it."));
    }
    const prepared = buildSimpleDimmerBindingPayload(stored.state.value as Record<string, unknown>, edit);
    if (!prepared.allowed) return definiteFailure(diagnostic("ProtocolRejected", prepared.reason, { resource: `rule:${edit.ruleId}` }));
    return this.mutateHue("rule", edit.ruleId, "update", prepared.payload);
  }

  private revalidateSimpleDimmerBinding(
    edit: SimpleDimmerBindingEdit,
  ): { readonly allowed: true; readonly edit: SimpleDimmerBindingEdit } | { readonly allowed: false; readonly reason: string } {
    if (!edit || typeof edit.ruleId !== "string" || !edit.ruleId.trim()) return { allowed: false, reason: "A Rule ID is required." };
    if (typeof edit.sensorId !== "string" || !edit.sensorId.trim()
      || typeof edit.catalogId !== "string" || !edit.catalogId.trim()
      || typeof edit.controlId !== "string" || !edit.controlId.trim()
      || typeof edit.deviceKey !== "string" || !edit.deviceKey.trim()
      || !Number.isInteger(edit.event)) {
      return { allowed: false, reason: "The dimmer binding identity is incomplete; refresh the bridge before editing it." };
    }
    const currentSnapshot = snapshotFromStateStore(this.stateStore);
    const model = buildEditorModel({ kind: "sensor", id: edit.sensorId }, currentSnapshot, this.dimmerCatalog);
    if (!model.recognized || model.catalogId !== edit.catalogId || model.deviceKey !== edit.deviceKey) {
      return { allowed: false, reason: "The dimmer model or physical device changed; refresh the bridge before editing it." };
    }
    const binding = model.advanced.bindings.find((candidate) => candidate.advanced.ruleId === edit.ruleId
      && candidate.advanced.conditionIndex === edit.conditionIndex
      && candidate.advanced.actionIndex === edit.actionIndex
      && candidate.controlId === edit.controlId
      && candidate.gestureId === edit.gestureId
      && candidate.event === edit.event);
    if (!binding || !binding.editable || !["editable_simple", "missing_target"].includes(binding.classification) || !binding.simpleForm) {
      return { allowed: false, reason: "The dimmer gesture is no longer the same characterized simple binding; refresh the bridge before editing it." };
    }
    if (binding.classification === "missing_target") {
      const originalAction = binding.advanced.ruleShape?.actions[edit.actionIndex];
      if (!originalAction || !isTargetOnlyDimmerRepair(originalAction, edit.action)) {
        return { allowed: false, reason: "A missing-target repair may replace only the target while preserving the existing action." };
      }
    }
    if (!dimmerActionTargetExists(currentSnapshot, edit.action)) {
      return { allowed: false, reason: "The selected Hue target is no longer present; refresh the bridge before saving." };
    }
    return { allowed: true, edit: { ...edit, characterization: binding.simpleForm } };
  }

  private async mutateHueInternal(
    kind: Exclude<ResourceKind, "plug">,
    id: string,
    operation: "update" | "action" | "status" | "config",
    payload: Record<string, unknown>,
    execution: HueMutationExecutionOptions = {},
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
      ...execution,
      observablePayload: operation === "update" || operation === "config" || operation === "status" ? prepared.payload : undefined,
    });
  }

  async createHue(kind: Exclude<ResourceKind, "plug">, payload: Record<string, unknown>): Promise<CommandResult> {
    return this.createHueInternal(kind, payload);
  }

  private async createHueInternal(
    kind: Exclude<ResourceKind, "plug">,
    payload: Record<string, unknown>,
    execution: HueMutationExecutionOptions = {},
  ): Promise<CommandResult> {
    if (!this.hue?.create) return definiteFailure(diagnostic("NetworkUnavailable", "Hue resource creation is unavailable."));
    const validation = validateHueCatalogPayload(kind, "create", payload);
    if (!validation.allowed) return definiteFailure(diagnostic("ProtocolRejected", validation.reason, { resource: kind }));
    return this.executeHueMutation(() => this.hue?.create?.(kind, payload), `${kind} create`, { kind }, execution);
  }

  async deleteHue(kind: Exclude<ResourceKind, "plug">, id: string): Promise<CommandResult> {
    return this.deleteHueInternal(kind, id);
  }

  private async deleteHueInternal(
    kind: Exclude<ResourceKind, "plug">,
    id: string,
    execution: HueMutationExecutionOptions = {},
  ): Promise<CommandResult> {
    if (!this.hue?.delete) return definiteFailure(diagnostic("NetworkUnavailable", "Hue resource deletion is unavailable."));
    return this.executeHueMutation(() => this.hue?.delete?.(kind, id), `${kind} delete`, { kind, id }, execution);
  }

  previewStructuralEdit(edit: StructuralDimmerEdit): ReturnType<typeof previewStructuralDimmerEdit> {
    const prepared = this.revalidateStructuralDimmerEdit(edit);
    if (!prepared.allowed) return prepared;
    return { allowed: true, changeSet: prepared.changeSet };
  }

  /**
   * Commit one identity-bound structural edit. The concrete operation list is
   * rebuilt immediately before execution; each operation is attempted at
   * most once, later operations are left unattempted after any definite,
   * ambiguous, partial, or abandoned result, and authoritative state is
   * refreshed once at the end.
   */
  async commitStructuralEdit(edit: StructuralDimmerEdit): Promise<StructuralCommitReport> {
    const prepared = this.revalidateStructuralDimmerEdit(edit);
    const suppliedOperations = structuralOperationsFromEdit(edit);
    const operations = prepared.allowed ? [...prepared.changeSet.operations] : [...suppliedOperations];
    if (!prepared.allowed) {
      const diagnosticValue = diagnostic("ProtocolRejected", prepared.reason);
      return structuralReport("stopped", "definite_failure", operations.map((operation) => ({ operation, status: "unattempted" as const, reason: prepared.reason })), diagnosticValue);
    }
    if (!this.foreground) {
      const diagnosticValue = diagnostic("Unknown", "Structural change abandoned because the app is not in the foreground.");
      return structuralReport("stopped", "abandoned", operations.map((operation) => ({ operation, status: "unattempted" as const, reason: diagnosticValue.message })), diagnosticValue);
    }
    if (!this.hue) {
      const diagnosticValue = diagnostic("NetworkUnavailable", "Hue is not configured.");
      return structuralReport("stopped", "definite_failure", operations.map((operation) => ({ operation, status: "unattempted" as const, reason: diagnosticValue.message })), diagnosticValue);
    }
    if (this.hueMutationBusy) {
      const diagnosticValue = diagnostic("Busy", userMessage("Busy"));
      return structuralReport("stopped", "definite_failure", operations.map((operation) => ({ operation, status: "unattempted" as const, reason: diagnosticValue.message })), diagnosticValue);
    }

    this.hueMutationBusy = true;
    this.hueStateGeneration += 1;
    const generation = this.lifecycleGeneration;
    const results: StructuralOperationResult[] = [];
    try {
      for (let index = 0; index < operations.length; index += 1) {
        const operation = operations[index];
        if (!this.foreground || generation !== this.lifecycleGeneration) {
          const abandonedReason = "Structural change abandoned when the app left the foreground.";
          for (let remaining = index; remaining < operations.length; remaining += 1) {
            results.push({ operation: operations[remaining], status: "unattempted", reason: abandonedReason });
          }
          break;
        }
        const result = await this.executeStructuralOperation(operation);
        if (result.kind === "success") {
          results.push({ operation, status: "succeeded", kind: result.kind });
          continue;
        }
        results.push({ operation, status: "failed_or_ambiguous", kind: result.kind, reason: result.diagnostic?.message, diagnostic: result.diagnostic });
        for (let remaining = index + 1; remaining < operations.length; remaining += 1) {
          results.push({ operation: operations[remaining], status: "unattempted", reason: "Not attempted after the structural change stopped." });
        }
        break;
      }
      const failed = results.find((result) => result.status === "failed_or_ambiguous");
      const unattempted = results.find((result) => result.status === "unattempted");
      const lastFailure = [...results].reverse().find((result) => result.status === "failed_or_ambiguous");
      const reportKind = failed
        ? resultKindForStructuralReport(results)
        : unattempted
          ? "abandoned" as const
          : "success" as const;
      const reportDiagnostic = lastFailure?.diagnostic || (lastFailure?.reason
        ? diagnostic(reportKind === "ambiguous" ? "Ambiguous" : reportKind === "abandoned" ? "Unknown" : "ProtocolRejected", lastFailure.reason)
        : unattempted
          ? diagnostic("Unknown", "Structural change was not completed.")
          : undefined);
      if (this.foreground && generation === this.lifecycleGeneration) {
        // Keep the write gate held until the required authoritative refresh
        // completes. A second Hue mutation must not begin against the old
        // snapshot while this report is being finalized.
        await this.refreshHue({ force: true, allowWhileMutationBusy: true });
      }
      return structuralReport(
        failed || unattempted ? "stopped" : "completed",
        reportKind,
        results,
        reportDiagnostic,
      );
    } finally {
      this.hueMutationBusy = false;
    }
  }

  /**
   * Re-project and rebuild a structural edit from the current snapshot. The
   * preview is intentionally not a capability token: commit calls this same
   * routine again immediately before the first Hue write.
   */
  private revalidateStructuralDimmerEdit(
    edit: StructuralDimmerEdit,
  ): { readonly allowed: true; readonly changeSet: DimmerChangeSet } | { readonly allowed: false; readonly reason: string } {
    const conditionIndex = edit?.conditionIndex;
    if (!edit || typeof edit !== "object"
      || typeof edit.sensorId !== "string" || !edit.sensorId.trim()
      || typeof edit.catalogId !== "string" || !edit.catalogId.trim()
      || typeof edit.deviceKey !== "string" || !edit.deviceKey.trim()
      || typeof edit.formId !== "string" || !edit.formId.trim()
      || typeof edit.controlId !== "string" || !edit.controlId.trim()
      || typeof edit.bindingId !== "string" || !edit.bindingId.trim()
      || typeof edit.ruleId !== "string" || !edit.ruleId.trim()
      || !Number.isInteger(edit.event)
      || !Number.isInteger(conditionIndex) || (conditionIndex as number) < 0) {
      return { allowed: false, reason: "The structural dimmer binding identity is incomplete; refresh the bridge before editing it." };
    }

    const currentSnapshot = snapshotFromStateStore(this.stateStore);
    const model = buildEditorModel({ kind: "sensor", id: edit.sensorId }, currentSnapshot, this.dimmerCatalog);
    if (!model.recognized || model.catalogId !== edit.catalogId || model.deviceKey !== edit.deviceKey) {
      return { allowed: false, reason: "The dimmer model or physical device changed; refresh the bridge before applying this structural edit." };
    }
    const binding = model.advanced.bindings.find((candidate) => candidate.classification === "recognized_structural"
      && candidate.editable
      && candidate.id === edit.bindingId
      && candidate.structuralFormId === edit.formId
      && candidate.controlId === edit.controlId
      && candidate.gestureId === edit.gestureId
      && candidate.event === edit.event
      && candidate.advanced.ruleId === edit.ruleId
      && candidate.advanced.conditionIndex === conditionIndex);
    if (!binding) {
      return { allowed: false, reason: "The structural gesture is no longer the same characterized binding; refresh the bridge before applying it." };
    }
    const form = this.dimmerCatalog.models.find((entry) => entry.id === model.catalogId)?.structuralForms
      ?.find((candidate) => candidate.id === edit.formId);
    if (!form?.buildChangeSet) return { allowed: false, reason: "This structural form has no characterized local builder." };
    const rule = binding.advanced.ruleShape;
    if (!rule) return { allowed: false, reason: "The current Rule shape is unavailable for structural editing." };

    const { changeSet: _ignoredChangeSet, operations: _ignoredOperations, ...identityAndValues } = edit;
    let generated: DimmerChangeSet | undefined;
    try {
      generated = form.buildChangeSet({
        edit: identityAndValues,
        model,
        binding,
        rule,
        snapshot: currentSnapshot,
      });
    } catch (_error) {
      return { allowed: false, reason: "The characterized structural form could not build a change set from the current Rule." };
    }
    if (!generated) return { allowed: false, reason: "The selected structural values are not valid for the current binding." };
    if (generated.deviceKey !== model.deviceKey) return { allowed: false, reason: "The structural change set is not bound to the selected physical dimmer." };
    const shape = structuralOperationShapeMatches(form.operationShape, generated.operations, edit.ruleId);
    if (!shape.allowed) return shape;

    const checked = previewStructuralDimmerEdit({ changeSet: generated });
    if (!checked.allowed) return checked;
    const safe = validateStructuralChangeSetAgainstSnapshot(
      checked.changeSet,
      currentSnapshot,
      rule,
      edit.ruleId,
      structuralModelResourceRefs(model),
    );
    if (!safe.allowed) return safe;
    return checked;
  }

  private async executeStructuralOperation(operation: DimmerChangeOperation): Promise<CommandResult> {
    const execution: HueMutationExecutionOptions = { busyAlreadyHeld: true, refresh: false };
    if (operation.operation === "create") return this.createHueInternal(operation.kind, operation.payload || {}, execution);
    if (!operation.id) return definiteFailure(diagnostic("ProtocolRejected", "A structural operation is missing its Hue resource ID."));
    if (operation.operation === "delete") return this.deleteHueInternal(operation.kind, operation.id, execution);
    if (operation.operation === "enable" || operation.operation === "disable") {
      return this.mutateHueInternal(operation.kind, operation.id, "status", {
        status: operation.operation === "enable" ? "enabled" : "disabled",
      }, execution);
    }
    return this.mutateHueInternal(operation.kind, operation.id, "update", operation.payload || {}, execution);
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
    reconciliation: HueMutationExecutionOptions = {},
  ): Promise<CommandResult> {
    if (!operation || !this.hue) return definiteFailure(diagnostic("NetworkUnavailable", "Hue is not configured."));
    const ownsMutationGate = !reconciliation.busyAlreadyHeld;
    if (!reconciliation.busyAlreadyHeld && this.hueMutationBusy) return definiteFailure(diagnostic("Busy", userMessage("Busy"), { operation: operationName }));
    if (ownsMutationGate) {
      this.hueMutationBusy = true;
      this.hueStateGeneration += 1;
    }
    const generation = this.lifecycleGeneration;
    try {
      const result = await this.withDeadline(operation, true, operationName, `${ref.kind}:${ref.id || ref.plugEndpointId || ""}`);
      if (result.kind === "ambiguous" && reconciliation.observablePayload && ref.id && this.hue.getResource) {
        const reconciled = await this.reconcileHueMutation(ref, reconciliation.observablePayload, result.diagnostic);
        if (reconciled.kind !== "abandoned"
          && reconciliation.refresh !== false
          && this.foreground
          && generation === this.lifecycleGeneration) {
          await this.refreshHue({ force: true, allowWhileMutationBusy: true });
        }
        return reconciled;
      }
      if (result.kind !== "success") return result;
      if (!this.foreground || generation !== this.lifecycleGeneration) return { kind: "abandoned", diagnostic: diagnostic("Unknown", "Operation abandoned when the app left the foreground.") };
      if (reconciliation.refresh !== false) {
        await this.refreshHue({ force: true, allowWhileMutationBusy: true });
      }
      return success();
    } finally {
      if (ownsMutationGate) this.hueMutationBusy = false;
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
    const schedules = parseSchedules(snapshot.schedules);
    const collections: Array<[Exclude<ResourceKind, "plug">, Record<string, unknown>]> = [
      ["light", snapshot.lights], ["group", snapshot.groups], ["scene", snapshot.scenes],
      ["sensor", snapshot.sensors], ["rule", snapshot.rules], ["schedule", schedules],
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

function isTargetOnlyDimmerRepair(
  original: import("../protocol/hue/catalog/rules").HueRuleAction,
  replacement: import("../protocol/hue/catalog/rules").HueRuleAction,
): boolean {
  if (original.method.toUpperCase() !== replacement.method.toUpperCase()) return false;
  const originalBody = original.body && typeof original.body === "object" && !Array.isArray(original.body) ? original.body : {};
  const replacementBody = replacement.body && typeof replacement.body === "object" && !Array.isArray(replacement.body) ? replacement.body : {};
  const originalScene = typeof originalBody.scene === "string";
  const replacementScene = typeof replacementBody.scene === "string";
  if (originalScene !== replacementScene) return false;
  if (!originalScene) return jsonValuesEqual(originalBody, replacementBody);
  const { scene: _originalScene, ...originalRest } = originalBody;
  const { scene: _replacementScene, ...replacementRest } = replacementBody;
  return jsonValuesEqual(originalRest, replacementRest);
}

/** Object member order is not semantic in Hue JSON action bodies. */
function jsonValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => jsonValuesEqual(value, right[index]));
  }
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index] && jsonValuesEqual(leftRecord[key], rightRecord[key]));
}

function structuralOperationsFromEdit(edit: StructuralDimmerEdit): readonly DimmerChangeOperation[] {
  if (!edit || typeof edit !== "object") return [];
  if (edit.changeSet && Array.isArray(edit.changeSet.operations)) return edit.changeSet.operations;
  return Array.isArray(edit.operations) ? edit.operations : [];
}

function structuralOperationShapeMatches(
  shape: "multiple_resources" | "replace_rule",
  operations: readonly DimmerChangeOperation[],
  ruleId: string,
): { readonly allowed: true } | { readonly allowed: false; readonly reason: string } {
  const resources = new Set(operations.map((operation) => `${operation.kind}:${operation.id || "<new>"}`));
  if (shape === "multiple_resources" && resources.size < 2) {
    return { allowed: false, reason: "The catalog marked this form structural, but it does not produce a multi-resource change." };
  }
  if (shape === "replace_rule") {
    const deletesExisting = operations.some((operation) => operation.kind === "rule" && operation.operation === "delete" && operation.id === ruleId);
    const createsRule = operations.some((operation) => operation.kind === "rule" && operation.operation === "create");
    if (!deletesExisting || !createsRule) {
      return { allowed: false, reason: "The catalog marked this form as a Rule replacement, but the builder did not produce the characterized replacement operations." };
    }
  }
  return { allowed: true };
}

function structuralModelResourceRefs(model: import("../protocol/hue/dimmer/types").DimmerEditorModel): readonly ResourceRef[] {
  return [
    ...model.advanced.resourceRefs,
    ...model.advanced.sensorIds.map((id) => ({ kind: "sensor" as const, id })),
    ...model.advanced.ruleIds.map((id) => ({ kind: "rule" as const, id })),
    ...model.advanced.scheduleIds.map((id) => ({ kind: "schedule" as const, id })),
    ...model.advanced.resourceLinkIds.map((id) => ({ kind: "resourcelink" as const, id })),
  ];
}

function validateStructuralChangeSetAgainstSnapshot(
  changeSet: DimmerChangeSet,
  snapshot: HueSnapshot,
  originalRule: DimmerRuleShape,
  originalRuleId: string,
  allowedResources: readonly ResourceRef[],
): { readonly allowed: true } | { readonly allowed: false; readonly reason: string } {
  const allowed = new Set(allowedResources.map(resourceRefKey));
  allowed.add(resourceRefKey({ kind: "rule", id: originalRuleId }));

  for (const operation of changeSet.operations) {
    if (operation.operation !== "create") {
      if (!operation.id || !resourcePresent(snapshot, operation.kind, operation.id)) {
        return { allowed: false, reason: `${operation.label} refers to a resource that is not in the current Hue snapshot.` };
      }
      if (!allowed.has(resourceRefKey({ kind: operation.kind, id: operation.id }))) {
        return { allowed: false, reason: `${operation.label} is outside the selected dimmer's characterized automation graph.` };
      }
    }
    const payload = operation.operation === "enable" || operation.operation === "disable"
      ? { status: operation.operation === "enable" ? "enabled" : "disabled" }
      : operation.payload;
    if (!payload) continue;
    const resourceValidation = validateStructuralPayloadReferences(operation.kind, payload, snapshot);
    if (!resourceValidation.allowed) return resourceValidation;
  }

  const replacementDeleteIndex = changeSet.operations.findIndex((operation) => operation.kind === "rule"
    && operation.operation === "delete" && operation.id === originalRuleId);
  const replacementCreateIndex = changeSet.operations.findIndex((operation) => operation.kind === "rule" && operation.operation === "create");
  if (replacementDeleteIndex >= 0 && replacementCreateIndex >= 0) {
    if (replacementCreateIndex > replacementDeleteIndex) {
      return { allowed: false, reason: "A Rule replacement must create the new Rule before deleting the existing one." };
    }
    const replacement = changeSet.operations[replacementCreateIndex].payload || {};
    if (originalRule.name !== undefined && replacement.name !== originalRule.name) {
      return { allowed: false, reason: "A Rule replacement must preserve the existing Rule name." };
    }
    if (originalRule.status !== undefined && replacement.status !== originalRule.status) {
      return { allowed: false, reason: "A Rule replacement must preserve the existing Rule status." };
    }
    if (originalRule.recycle !== undefined && replacement.recycle !== originalRule.recycle) {
      return { allowed: false, reason: "A Rule replacement must preserve the existing Rule recycle behavior." };
    }
    if (!valuesEqual(originalRule.conditions, replacement.conditions)) {
      return { allowed: false, reason: "A Rule replacement must preserve the existing Rule conditions." };
    }
    if (resourceLinkReferences(snapshot, "rule", originalRuleId)) {
      return { allowed: false, reason: "The existing Rule is referenced by a Resource Link and cannot be safely replaced with a new bridge-assigned ID." };
    }
  }
  return { allowed: true };
}

function validateStructuralPayloadReferences(
  kind: DimmerChangeOperation["kind"],
  payload: Record<string, unknown>,
  snapshot: HueSnapshot,
): { readonly allowed: true } | { readonly allowed: false; readonly reason: string } {
  if (kind === "rule" && Array.isArray(payload.actions)) {
    const parsed = parseRuleReferences({ actions: payload.actions });
    for (const [index, reference] of parsed.actions.entries()) {
      if (reference.status !== "recognized" || !dimmerActionTargetExists(snapshot, payload.actions[index] as never)) {
        return { allowed: false, reason: `The structural Rule action at index ${index} is not an exact, currently available Hue target.` };
      }
    }
  }
  if (kind === "rule" && Array.isArray(payload.conditions)) {
    const parsed = parseRuleReferences({ conditions: payload.conditions });
    for (const [index, reference] of parsed.conditions.entries()) {
      if (reference.status !== "recognized" || !reference.ref || !resourcePresent(snapshot, reference.kind, reference.id)) {
        return { allowed: false, reason: `The structural Rule condition at index ${index} is not an exact, currently available Hue reference.` };
      }
    }
  }
  if (kind === "schedule" && payload.command !== undefined) {
    const reference = parseScheduleCommandReference(payload.command);
    if (reference.status !== "recognized" || !reference.ref || !resourcePresent(snapshot, reference.kind, reference.id)) {
      return { allowed: false, reason: "The structural Schedule command does not reference a current Hue resource." };
    }
  }
  if (kind === "resourcelink" && Array.isArray(payload.links)) {
    for (const link of parseResourceLinkReferences({ links: payload.links })) {
      if (link.status !== "recognized" || !link.ref || !resourcePresent(snapshot, link.kind, link.id)) {
        return { allowed: false, reason: "The structural Resource Link contains a non-current Hue resource reference." };
      }
    }
  }
  return { allowed: true };
}

function resourcePresent(snapshot: HueSnapshot, kind: DimmerChangeOperation["kind"], id: string): boolean {
  const collectionName = kind === "resourcelink" ? "resourcelinks" : `${kind}s`;
  const collection = snapshot[collectionName as keyof HueSnapshot];
  return Boolean(collection && Object.prototype.hasOwnProperty.call(collection, id));
}

function resourceLinkReferences(snapshot: HueSnapshot, kind: DimmerChangeOperation["kind"], id: string): boolean {
  return Object.values(snapshot.resourcelinks).some((value) => parseResourceLinkReferences(value).some((reference) =>
    reference.status === "recognized" && reference.kind === kind && reference.id === id));
}

function structuralReport(
  status: StructuralCommitReport["status"],
  kind: StructuralCommitReport["kind"],
  operations: StructuralCommitReport["operations"],
  diagnosticValue?: Diagnostic,
): StructuralCommitReport {
  return {
    status,
    kind,
    operations,
    succeeded: operations.filter((operation) => operation.status === "succeeded"),
    failedOrAmbiguous: operations.filter((operation) => operation.status === "failed_or_ambiguous"),
    unattempted: operations.filter((operation) => operation.status === "unattempted"),
    ...(diagnosticValue ? { diagnostic: diagnosticValue } : {}),
  };
}

function resultKindForStructuralReport(
  operations: readonly StructuralCommitReport["operations"][number][],
): StructuralCommitReport["kind"] {
  const kinds = operations
    .filter((operation) => operation.status === "failed_or_ambiguous")
    .map((operation) => operation.kind);
  if (kinds.includes("ambiguous")) return "ambiguous";
  if (kinds.includes("partial_failure")) return "partial_failure";
  if (kinds.includes("abandoned")) return "abandoned";
  return "definite_failure";
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
