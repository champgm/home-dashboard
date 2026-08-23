export type HueResourceKind = "light" | "group" | "scene" | "sensor" | "rule" | "schedule" | "resourcelink";
export type ResourceKind = HueResourceKind | "plug";

export interface ResourceRef {
  readonly kind: ResourceKind;
  readonly id?: string;
  readonly plugEndpointId?: string;
}

export type FavoriteRef = ResourceRef;

export interface PlugEndpoint {
  readonly id: string;
  readonly ipv4: string;
  readonly port: number;
}

export interface UiSettings {
  readonly theme?: "dark" | "light";
  readonly diagnosticsVisible?: boolean;
}

export interface AppConfig {
  readonly bridge: {
    readonly ipv4?: string;
  };
  readonly plugs: readonly PlugEndpoint[];
  readonly favorites: readonly FavoriteRef[];
  readonly settings: UiSettings;
}

export interface HueBinding {
  readonly bridgeId: string;
  readonly credential: string;
}

export class StorageIoError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "StorageIoError";
    this.cause = cause;
  }
}

export type ConfigLoadResult =
  | { readonly status: "loaded"; readonly config: AppConfig }
  | { readonly status: "absent"; readonly config: AppConfig }
  | { readonly status: "corrupt"; readonly error: Error }
  | { readonly status: "ioError"; readonly error: StorageIoError };

export type ConfigSaveResult =
  | { readonly status: "success" }
  | { readonly status: "ioError"; readonly error: StorageIoError };

export type HueBindingLoadResult =
  | { readonly status: "present"; readonly binding: HueBinding }
  | { readonly status: "absent" }
  | { readonly status: "ioError"; readonly error: StorageIoError };

export type DiagnosticCategory =
  | "Busy"
  | "NetworkUnavailable"
  | "Timeout"
  | "ProtocolMalformed"
  | "ProtocolRejected"
  | "AuthenticationRejected"
  | "BridgeIdentityMismatch"
  | "PermissionDenied"
  | "StorageError"
  | "ConfigCorrupt"
  | "Ambiguous"
  | "Unknown";

export interface Diagnostic {
  readonly category: DiagnosticCategory;
  readonly operation?: string;
  readonly resource?: string;
  readonly elapsedMs?: number;
  readonly statusCode?: number;
  readonly message: string;
}

export interface KnownResourceState<T> {
  readonly status: "known";
  readonly value: T;
}

export interface UnknownResourceState {
  readonly status: "unknown";
  readonly reason: Diagnostic;
}

export type ResourceState<T> = KnownResourceState<T> | UnknownResourceState;

export type CommandResultKind = "success" | "definite_failure" | "ambiguous" | "partial_failure" | "abandoned";

export interface CommandResult<T = unknown> {
  readonly kind: CommandResultKind;
  readonly value?: T;
  readonly diagnostic?: Diagnostic;
}

export interface HueSnapshot {
  readonly lights: Record<string, unknown>;
  readonly groups: Record<string, unknown>;
  readonly scenes: Record<string, unknown>;
  readonly sensors: Record<string, unknown>;
  readonly rules: Record<string, unknown>;
  readonly schedules: Record<string, unknown>;
  readonly resourcelinks: Record<string, unknown>;
  readonly config?: Record<string, unknown>;
  readonly capabilities?: Record<string, unknown>;
}

export interface PlugSysInfo {
  readonly alias?: string;
  readonly model?: string;
  readonly deviceId?: string;
  readonly hardwareVersion?: string;
  readonly softwareVersion?: string;
  readonly mac?: string;
  readonly rssi?: number;
  readonly signalLevel?: number;
  readonly relayState?: boolean;
  readonly feature?: string;
  readonly hasEnergy?: boolean;
  readonly energy?: PlugEnergy;
  readonly raw?: Record<string, unknown>;
}

export interface PlugEnergy {
  readonly currentMa?: number;
  readonly voltageMv?: number;
  readonly powerMw?: number;
  readonly totalWh?: number;
  readonly todayWh?: number;
  readonly monthWh?: number;
}
