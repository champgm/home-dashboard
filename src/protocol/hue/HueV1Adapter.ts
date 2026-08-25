import { HueBinding, HueSnapshot, ResourceKind } from "../../app/types";
import { HueHttpClient, HueHttpTransport, HueTransportError } from "./httpTransport";
import { HueRateLimiter, PacingClock } from "./rateLimiter";
import { classifyHueResponse, hueResponseErrorMessage } from "./resultClassifier";
import { parseHueSnapshot } from "./snapshot";
import { HueActionDecision, validateImmediateAction, validateRulePayload, validateSchedulePayload } from "./HueActionPolicy";
import { buildSceneActivation, HueScene } from "./resources/scenes";
import { canStartSearch, HueSearchKind, HueSearchStatus, parseSearchStatus } from "./search";
import { toBridgeReadDto } from "./bridgeReads";
import { redactDiagnosticMessage } from "./redaction";

export interface HueAdapterOptions {
  readonly bridgeIpv4: string;
  readonly credential?: string;
  readonly httpClient?: HueHttpClient;
  readonly pacingClock?: PacingClock;
  readonly timeoutMs?: number;
  readonly expectedBridgeId?: string;
}

export class HueResponseError extends Error {
  readonly category = "ProtocolRejected" as const;
  readonly responseKind: "partial_failure" | "definite_failure";
  readonly errors: readonly unknown[];

  constructor(responseKind: "partial_failure" | "definite_failure", message: string, errors: readonly unknown[]) {
    super(redactDiagnosticMessage(message));
    this.name = "HueResponseError";
    this.responseKind = responseKind;
    this.errors = errors;
  }
}

export class HueIdentityMismatchError extends Error {
  readonly category = "BridgeIdentityMismatch" as const;

  constructor() {
    super("The configured Hue endpoint does not match the permanently bound bridge.");
    this.name = "HueIdentityMismatchError";
  }
}

export class HueV1Adapter {
  private readonly transport: HueHttpTransport;
  private readonly rateLimiter: HueRateLimiter;
  private readonly pacingClock?: PacingClock;
  private readonly expectedBridgeId?: string;
  private identityCheck?: Promise<void>;
  private identityVerified = false;
  private snapshotInFlight?: Promise<HueSnapshot>;

  constructor(options: HueAdapterOptions | HueHttpTransport) {
    if (options instanceof HueHttpTransport) {
      this.transport = options;
      this.rateLimiter = new HueRateLimiter();
    } else {
      this.transport = new HueHttpTransport(
        options.bridgeIpv4,
        options.credential,
        options.httpClient,
        options.timeoutMs,
      );
      this.rateLimiter = new HueRateLimiter(options.pacingClock);
      this.pacingClock = options.pacingClock;
      this.expectedBridgeId = options.expectedBridgeId;
    }
  }

  get bridgeIpv4(): string {
    return this.transport.bridgeIpv4;
  }

  get credentialConfigured(): boolean {
    return Boolean(this.transport.credential);
  }

  withCredential(credential: string): HueV1Adapter {
    return new HueV1Adapter({
      bridgeIpv4: this.transport.bridgeIpv4,
      credential,
      httpClient: this.transport.httpClient,
      pacingClock: this.pacingClock,
      timeoutMs: this.transport.timeoutMs,
      expectedBridgeId: this.expectedBridgeId,
    });
  }

  async snapshot(): Promise<HueSnapshot> {
    if (!this.snapshotInFlight) {
      this.snapshotInFlight = this.readSnapshot().finally(() => {
        this.snapshotInFlight = undefined;
      });
    }
    return this.snapshotInFlight;
  }

  async getResource(kind: Exclude<ResourceKind, "plug">, id: string): Promise<Record<string, unknown>> {
    return this.requestJson("GET", `/${kindPath(kind)}/${encodeURIComponent(id)}`) as Promise<Record<string, unknown>>;
  }

  async getCollection(kind: Exclude<ResourceKind, "plug">): Promise<Record<string, unknown>> {
    return this.requestJson("GET", `/${kindPath(kind)}`) as Promise<Record<string, unknown>>;
  }

  async mutate(
    kind: Exclude<ResourceKind, "plug">,
    id: string,
    operation: "update" | "action" | "status",
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    const policy: HueActionDecision = kind === "rule" ? validateRulePayload(payload) : kind === "schedule" ? validateSchedulePayload(payload) : { allowed: true };
    if (!policy.allowed) {
      throw new HueResponseError("definite_failure", policy.reason, []);
    }
    const path = operation === "action"
      ? `/${kindPath(kind)}/${encodeURIComponent(id)}/action`
      : `/${kindPath(kind)}/${encodeURIComponent(id)}`;
    const channel = kind === "light" && operation === "action" ? "light-state" : kind === "group" && operation === "action" ? "group-action" : undefined;
    return this.mutationRequest("PUT", path, payload, channel);
  }

  async create(kind: Exclude<ResourceKind, "plug">, payload: Record<string, unknown>): Promise<unknown> {
    const policy: HueActionDecision = kind === "rule" ? validateRulePayload(payload) : kind === "schedule" ? validateSchedulePayload(payload) : { allowed: true };
    if (!policy.allowed) {
      throw new HueResponseError("definite_failure", policy.reason, []);
    }
    return this.mutationRequest("POST", `/${kindPath(kind)}`, payload);
  }

  async delete(kind: Exclude<ResourceKind, "plug">, id: string): Promise<unknown> {
    return this.mutationRequest("DELETE", `/${kindPath(kind)}/${encodeURIComponent(id)}`);
  }

  async setLightState(id: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.mutationRequest("PUT", `/lights/${encodeURIComponent(id)}/state`, payload, "light-state");
  }

  async setGroupAction(id: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.mutationRequest("PUT", `/groups/${encodeURIComponent(id)}/action`, payload, "group-action");
  }

  async activateScene(scene: HueScene): Promise<unknown> {
    const activation = buildSceneActivation(scene);
    return this.setGroupAction(activation.groupId, activation.payload);
  }

  async startSearch(kind: HueSearchKind, status?: HueSearchStatus): Promise<{ started: boolean; status: HueSearchStatus }> {
    const checkedStatus = status || await this.getSearchStatus(kind);
    if (!canStartSearch(checkedStatus)) {
      return { started: false, status: checkedStatus };
    }
    await this.mutationRequest("POST", `/${kind}`, {});
    return { started: true, status: { ...checkedStatus, active: true, recent: true } };
  }

  async getSearchStatus(kind: HueSearchKind): Promise<HueSearchStatus> {
    const value = await this.requestJson("GET", `/${kind}/new`);
    return parseSearchStatus(kind, value);
  }

  async getBridgeConfig(): Promise<Record<string, unknown>> {
    return this.requestJson("GET", "/config") as Promise<Record<string, unknown>>;
  }

  async getCapabilities(): Promise<Record<string, unknown>> {
    return this.requestJson("GET", "/capabilities") as Promise<Record<string, unknown>>;
  }

  async getBridgeRead(): Promise<ReturnType<typeof toBridgeReadDto>> {
    const config = await this.getBridgeConfig();
    const capabilities = await this.getCapabilities();
    return toBridgeReadDto(config, capabilities);
  }

  async verifyBridgeIdentity(binding: HueBinding): Promise<Record<string, unknown>> {
    const config = await this.getBridgeConfig();
    if (config.bridgeid !== binding.bridgeId) {
      throw new HueIdentityMismatchError();
    }
    this.identityVerified = true;
    return config;
  }

  async provision(): Promise<string> {
    const raw = await this.transport.requestApiRoot("POST", { devicetype: "home-dashboard" });
    const classification = classifyHueResponse<{ username?: string }>(raw);
    if (classification.kind !== "success" || !classification.value?.username) {
      throw new HueResponseError(
        classification.kind === "partial_failure" ? "partial_failure" : "definite_failure",
        classification.errors.length > 0
          ? hueResponseErrorMessage(classification)
          : "Hue did not create a local API user.",
        classification.errors,
      );
    }
    return classification.value.username;
  }

  async getConfigWithCredential(credential: string): Promise<Record<string, unknown>> {
    return this.transport.withCredential(credential).request("/config", "GET") as Promise<Record<string, unknown>>;
  }

  /**
   * Policy is exported as a method for ApplicationService/editor callers, but
   * there is deliberately no arbitrary method/address/body request method.
   */
  validateImmediateAction(method: string, path: string, body?: unknown): ReturnType<typeof validateImmediateAction> {
    return validateImmediateAction(method, path, body);
  }

  private async readSnapshot(): Promise<HueSnapshot> {
    // Hue API v1's authenticated root returns the bridge configuration and
    // all resource collections in one coherent response. This avoids trying
    // to fit nine sequential HTTP round trips inside the application-level
    // snapshot deadline. requestJson still performs the permanent bridge
    // identity check before the aggregate read when one is configured.
    const aggregate = await this.requestJson("GET", "");
    if (!aggregate || typeof aggregate !== "object" || Array.isArray(aggregate)) {
      throw new HueTransportError("ProtocolMalformed", "Hue returned a malformed aggregate snapshot.", false);
    }
    return parseHueSnapshot(aggregate as Record<string, unknown>);
  }

  private async requestJson(method: string, path: string, body?: unknown): Promise<unknown> {
    if (this.expectedBridgeId) {
      await this.ensureIdentity();
    }
    const raw = await this.transport.request(path, method, body, { possibleSendOnTimeout: method !== "GET" });
    const classification = classifyHueResponse(raw);
    if (classification.kind !== "success") {
      throw new HueResponseError(
        classification.kind,
        hueResponseErrorMessage(classification),
        classification.errors,
      );
    }
    return raw;
  }

  private async ensureIdentity(): Promise<void> {
    if (!this.expectedBridgeId || this.identityVerified) return;
    if (!this.identityCheck) {
      this.identityCheck = this.transport.request("/config", "GET", undefined, { possibleSendOnTimeout: false })
        .then((value) => {
          const classification = classifyHueResponse(value);
          if (classification.kind !== "success") {
            throw new HueResponseError(classification.kind, hueResponseErrorMessage(classification), classification.errors);
          }
          const config = value && typeof value === "object" ? value as Record<string, unknown> : {};
          if (config.bridgeid !== this.expectedBridgeId) {
            throw new HueIdentityMismatchError();
          }
          this.identityVerified = true;
        })
        .finally(() => {
          this.identityCheck = undefined;
        });
    }
    await this.identityCheck;
  }

  private async mutationRequest(
    method: "PUT" | "POST" | "DELETE",
    path: string,
    body?: unknown,
    channel?: "light-state" | "group-action",
  ): Promise<unknown> {
    const operation = async () => {
      await this.ensureIdentity();
      const raw = await this.transport.request(path, method, body, { possibleSendOnTimeout: true });
      const classification = classifyHueResponse(raw);
      if (classification.kind !== "success") {
        throw new HueResponseError(
          classification.kind,
          hueResponseErrorMessage(classification),
          classification.errors,
        );
      }
      return raw;
    };
    return channel ? this.rateLimiter.dispatch(channel, operation) : operation();
  }
}

function kindPath(kind: Exclude<ResourceKind, "plug">): string {
  return kind === "resourcelink" ? "resourcelinks" : `${kind}s`;
}

// Keep this import name available for code that used the component-oriented
// catalog in earlier migration steps without exposing a raw request surface.
export const HueActionPolicy = { validateImmediateAction };
