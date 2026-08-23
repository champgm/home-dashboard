import { FavoriteRef, AppConfig, PlugEndpoint, UiSettings } from "../app/types";
import { validatePlugEndpoint, validatePrivateIpv4 } from "../config/endpointValidation";
import { BundledDefaults, getBundledDefaults } from "../config/bundledDefaults";
import {
  cloneUserConfigOverlay,
  createEmptyUserConfigOverlay,
  overlayFromConfig,
  UserConfigOverlay,
  validateUserConfigOverlay,
} from "../config/overlayResolver";

export const LEGACY_CONFIG_SCHEMA_VERSION = 1;
export const CONFIG_SCHEMA_VERSION = 2;

export class ConfigSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigSchemaError";
  }
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConfigSchemaError(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function optionalPrivateBridge(value: unknown): { ipv4?: string } {
  if (value === undefined || value === null) return {};
  const bridge = objectValue(value, "bridge");
  if (bridge.ipv4 === undefined || bridge.ipv4 === "") return {};
  const validated = validatePrivateIpv4(bridge.ipv4);
  if (!validated.valid) throw new ConfigSchemaError("The bridge address is invalid.");
  return { ipv4: validated.value };
}

function parsePlugs(value: unknown, label = "plugs"): PlugEndpoint[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new ConfigSchemaError(`${label} must be an array.`);
  const ids = new Set<string>();
  return value.map((item, index) => {
    try {
      const endpoint = objectValue(item, `${label}[${index}]`);
      const validated = validatePlugEndpoint({ id: endpoint.id, ipv4: endpoint.ipv4, port: endpoint.port });
      if (ids.has(validated.id)) throw new ConfigSchemaError(`${label} contains duplicate ID ${validated.id}.`);
      ids.add(validated.id);
      return validated;
    } catch (error) {
      if (error instanceof ConfigSchemaError) throw error;
      throw new ConfigSchemaError(`Invalid plug endpoint at index ${index}.`);
    }
  });
}

function parseFavorites(value: unknown): FavoriteRef[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new ConfigSchemaError("favorites must be an array.");
  return value.map((item, index) => {
    const favorite = objectValue(item, `favorites[${index}]`);
    if (typeof favorite.kind !== "string") throw new ConfigSchemaError(`favorites[${index}] has no kind.`);
    if (!["light", "group", "scene", "sensor", "rule", "schedule", "resourcelink", "plug"].includes(favorite.kind)) {
      throw new ConfigSchemaError(`favorites[${index}] has an unsupported kind.`);
    }
    const id = favorite.id;
    const plugEndpointId = favorite.plugEndpointId;
    if (typeof id !== "string" && typeof plugEndpointId !== "string") {
      throw new ConfigSchemaError(`favorites[${index}] has no resource identifier.`);
    }
    if (favorite.kind === "plug" && typeof plugEndpointId !== "string") {
      throw new ConfigSchemaError(`favorites[${index}] plug reference has no endpoint identifier.`);
    }
    if (favorite.kind !== "plug" && typeof id !== "string") {
      throw new ConfigSchemaError(`favorites[${index}] Hue reference has no resource identifier.`);
    }
    return {
      kind: favorite.kind as FavoriteRef["kind"],
      ...(typeof id === "string" ? { id } : {}),
      ...(typeof plugEndpointId === "string" ? { plugEndpointId } : {}),
    };
  });
}

function parseSettings(value: unknown): UiSettings {
  if (value === undefined || value === null) return {};
  const settings = objectValue(value, "settings");
  return {
    ...(settings.theme === "light" || settings.theme === "dark" ? { theme: settings.theme } : {}),
    ...(settings.diagnosticsVisible === true || settings.diagnosticsVisible === false
      ? { diagnosticsVisible: settings.diagnosticsVisible }
      : {}),
  };
}

export function createEmptyConfig(preseed: readonly PlugEndpoint[] = []): AppConfig {
  return {
    bridge: {},
    plugs: preseed.map((plug) => ({ ...plug })),
    favorites: [],
    settings: {},
  };
}

/** Parse the 2.0 materialized configuration shape. */
export function parseConfig(value: unknown): AppConfig {
  const root = objectValue(value, "configuration");
  if (root.schemaVersion !== undefined && root.schemaVersion !== LEGACY_CONFIG_SCHEMA_VERSION) {
    throw new ConfigSchemaError("This is not a version-1 configuration.");
  }
  return {
    bridge: optionalPrivateBridge(root.bridge),
    plugs: parsePlugs(root.plugs),
    favorites: parseFavorites(root.favorites),
    settings: parseSettings(root.settings),
  };
}

export function parseConfigJson(raw: string): AppConfig {
  try {
    return parseConfig(JSON.parse(raw));
  } catch (error) {
    if (error instanceof ConfigSchemaError) throw error;
    throw new ConfigSchemaError("The stored configuration is not valid JSON.");
  }
}

export function parseUserConfigOverlay(value: unknown, defaults: BundledDefaults): UserConfigOverlay {
  const root = objectValue(value, "configuration overlay");
  if (root.schemaVersion !== CONFIG_SCHEMA_VERSION) {
    throw new ConfigSchemaError("The stored configuration overlay has an unsupported schema version.");
  }
  let bridgeOverride: UserConfigOverlay["bridgeOverride"];
  if (root.bridgeOverride !== undefined && root.bridgeOverride !== null) {
    const bridge = objectValue(root.bridgeOverride, "bridgeOverride");
    const validation = validatePrivateIpv4(bridge.ipv4);
    if (!validation.valid) throw new ConfigSchemaError("The bridge override is invalid.");
    bridgeOverride = { ipv4: validation.value! };
  }
  ["plugOverrides", "removedPlugIds", "addedPlugs", "favorites", "settings"].forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(root, field)) {
      throw new ConfigSchemaError(`The v2 configuration overlay is missing ${field}.`);
    }
  });
  try {
    return validateUserConfigOverlay(getBundledDefaults(defaults), {
      ...(bridgeOverride ? { bridgeOverride } : {}),
      plugOverrides: parsePlugs(root.plugOverrides, "plugOverrides"),
      removedPlugIds: parseIds(root.removedPlugIds, "removedPlugIds"),
      addedPlugs: parsePlugs(root.addedPlugs, "addedPlugs"),
      favorites: parseFavorites(root.favorites),
      settings: parseSettings(root.settings),
    });
  } catch (error) {
    if (error instanceof ConfigSchemaError) throw error;
    throw new ConfigSchemaError(error instanceof Error ? error.message : "The configuration overlay is invalid.");
  }
}

function parseIds(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string" || id.length === 0)) {
    throw new ConfigSchemaError(`${label} must be a list of non-empty IDs.`);
  }
  return [...value] as string[];
}

export function parseUserConfigOverlayJson(raw: string, defaults: BundledDefaults): UserConfigOverlay {
  try {
    return parseUserConfigOverlay(JSON.parse(raw), defaults);
  } catch (error) {
    if (error instanceof ConfigSchemaError) throw error;
    throw new ConfigSchemaError("The stored configuration overlay is not valid JSON.");
  }
}

export type PersistedConfiguration =
  | { readonly kind: "legacy"; readonly config: AppConfig }
  | { readonly kind: "overlay"; readonly overlay: UserConfigOverlay };

export function parsePersistedConfiguration(raw: string, defaults: BundledDefaults): PersistedConfiguration {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (_error) {
    throw new ConfigSchemaError("The stored configuration is not valid JSON.");
  }
  const root = objectValue(value, "configuration");
  if (root.schemaVersion === CONFIG_SCHEMA_VERSION) {
    return { kind: "overlay", overlay: parseUserConfigOverlay(root, defaults) };
  }
  if (root.schemaVersion === undefined || root.schemaVersion === LEGACY_CONFIG_SCHEMA_VERSION) {
    return { kind: "legacy", config: parseConfig(root) };
  }
  throw new ConfigSchemaError("The stored configuration has an unsupported schema version.");
}

export function serializeConfig(config: AppConfig): string {
  return JSON.stringify({
    schemaVersion: LEGACY_CONFIG_SCHEMA_VERSION,
    bridge: config.bridge,
    plugs: config.plugs,
    favorites: config.favorites,
    settings: config.settings,
  });
}

export function serializeUserConfigOverlay(overlay: UserConfigOverlay): string {
  return JSON.stringify({
    schemaVersion: CONFIG_SCHEMA_VERSION,
    ...(overlay.bridgeOverride ? { bridgeOverride: overlay.bridgeOverride } : {}),
    plugOverrides: overlay.plugOverrides,
    removedPlugIds: overlay.removedPlugIds,
    addedPlugs: overlay.addedPlugs,
    favorites: overlay.favorites,
    settings: overlay.settings,
  });
}

export function migrateConfigToOverlay(config: AppConfig, defaultsInput: BundledDefaults): UserConfigOverlay {
  const defaults = getBundledDefaults(defaultsInput);
  return overlayFromConfig(defaults, config, createEmptyUserConfigOverlay());
}

export function cloneConfig(config: AppConfig): AppConfig {
  return JSON.parse(JSON.stringify(config)) as AppConfig;
}

export function cloneOverlay(overlay: UserConfigOverlay): UserConfigOverlay {
  return cloneUserConfigOverlay(overlay);
}
