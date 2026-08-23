import { AppConfig, FavoriteRef, PlugEndpoint, UiSettings } from "../app/types";
import { validatePlugEndpoint, validatePrivateIpv4 } from "./endpointValidation";
import { BundledDefaults, getBundledDefaults, validateBundledDefaults } from "./bundledDefaults";

export interface UserConfigOverlay {
  readonly bridgeOverride?: {
    readonly ipv4: string;
  };
  readonly plugOverrides: readonly PlugEndpoint[];
  readonly removedPlugIds: readonly string[];
  readonly addedPlugs: readonly PlugEndpoint[];
  readonly favorites: readonly FavoriteRef[];
  readonly settings: UiSettings;
}

export function createEmptyUserConfigOverlay(): UserConfigOverlay {
  return {
    plugOverrides: [],
    removedPlugIds: [],
    addedPlugs: [],
    favorites: [],
    settings: {},
  };
}

export function cloneUserConfigOverlay(overlay: UserConfigOverlay): UserConfigOverlay {
  return {
    ...(overlay.bridgeOverride ? { bridgeOverride: { ...overlay.bridgeOverride } } : {}),
    plugOverrides: overlay.plugOverrides.map((endpoint) => ({ ...endpoint })),
    removedPlugIds: [...overlay.removedPlugIds],
    addedPlugs: overlay.addedPlugs.map((endpoint) => ({ ...endpoint })),
    favorites: overlay.favorites.map((favorite) => ({ ...favorite })),
    settings: { ...overlay.settings },
  };
}

function endpointKey(endpoint: PlugEndpoint): string {
  return `${endpoint.id}\u0000${endpoint.ipv4}\u0000${endpoint.port}`;
}

function sameEndpoint(left: PlugEndpoint, right: PlugEndpoint): boolean {
  return endpointKey(left) === endpointKey(right);
}

function uniqueIds(ids: readonly string[], label: string): void {
  const seen = new Set<string>();
  ids.forEach((id) => {
    if (typeof id !== "string" || id.length === 0 || seen.has(id)) {
      throw new Error(`${label} contains a duplicate or invalid plug ID.`);
    }
    seen.add(id);
  });
}

export function validateUserConfigOverlay(
  defaults: BundledDefaults,
  input: UserConfigOverlay,
): UserConfigOverlay {
  const validatedDefaults = validateBundledDefaults(defaults);
  if (!input || typeof input !== "object") {
    throw new Error("User configuration overlay must be an object.");
  }
  let bridgeOverride: UserConfigOverlay["bridgeOverride"];
  if (input.bridgeOverride !== undefined) {
    const validation = validatePrivateIpv4(input.bridgeOverride.ipv4);
    if (!validation.valid) throw validation.error;
    bridgeOverride = { ipv4: validation.value! };
  }
  const plugOverrides = input.plugOverrides.map((endpoint) => validatePlugEndpoint(endpoint));
  const addedPlugs = input.addedPlugs.map((endpoint) => validatePlugEndpoint(endpoint));
  const removedPlugIds = [...input.removedPlugIds];
  uniqueIds(plugOverrides.map((endpoint) => endpoint.id), "plugOverrides");
  uniqueIds(addedPlugs.map((endpoint) => endpoint.id), "addedPlugs");
  uniqueIds(removedPlugIds, "removedPlugIds");
  const bundledIds = new Set(validatedDefaults.plugs.map((endpoint) => endpoint.id));
  const overrideIds = new Set(plugOverrides.map((endpoint) => endpoint.id));
  const removedIds = new Set(removedPlugIds);
  addedPlugs.forEach((endpoint) => {
    if (bundledIds.has(endpoint.id)) throw new Error(`User-added plug collides with bundled ID: ${endpoint.id}`);
    if (overrideIds.has(endpoint.id) || removedIds.has(endpoint.id)) throw new Error(`Plug overlay has conflicting provenance: ${endpoint.id}`);
  });
  plugOverrides.forEach((endpoint) => {
    if (removedIds.has(endpoint.id)) throw new Error(`Plug override is also removed: ${endpoint.id}`);
  });
  return {
    ...(bridgeOverride ? { bridgeOverride } : {}),
    plugOverrides,
    removedPlugIds,
    addedPlugs,
    favorites: input.favorites.map((favorite) => ({ ...favorite })),
    settings: { ...input.settings },
  };
}

export function resolveConfig(defaultsInput: BundledDefaults, overlayInput: UserConfigOverlay): AppConfig {
  const defaults = getBundledDefaults(defaultsInput);
  const overlay = validateUserConfigOverlay(defaults, overlayInput);
  const overrides = new Map(overlay.plugOverrides.map((endpoint) => [endpoint.id, endpoint]));
  const removed = new Set(overlay.removedPlugIds);
  const plugs = defaults.plugs
    .filter((endpoint) => !removed.has(endpoint.id))
    .map((endpoint) => overrides.get(endpoint.id) || endpoint)
    .concat(overlay.addedPlugs);
  return {
    bridge: overlay.bridgeOverride ? { ...overlay.bridgeOverride } : { ...defaults.bridge },
    plugs: plugs.map((endpoint) => ({ ...endpoint })),
    favorites: overlay.favorites.map((favorite) => ({ ...favorite })),
    settings: { ...overlay.settings },
  };
}

/**
 * Convert an edited effective configuration back to sparse user intent. The
 * optional previous overlay keeps tombstones and overrides for a default that
 * is temporarily absent from a later APK, so a future reintroduction cannot
 * silently discard the user's prior choice.
 */
export function overlayFromConfig(
  defaultsInput: BundledDefaults,
  config: AppConfig,
  previousInput: UserConfigOverlay = createEmptyUserConfigOverlay(),
): UserConfigOverlay {
  const defaults = getBundledDefaults(defaultsInput);
  const previous = validateUserConfigOverlay(defaults, previousInput);
  const configPlugs = config.plugs.map((endpoint) => validatePlugEndpoint(endpoint));
  const byId = new Map<string, PlugEndpoint>();
  configPlugs.forEach((endpoint) => {
    if (byId.has(endpoint.id)) throw new Error(`Configuration contains duplicate plug ID: ${endpoint.id}`);
    byId.set(endpoint.id, endpoint);
  });
  const defaultById = new Map(defaults.plugs.map((endpoint) => [endpoint.id, endpoint]));
  const removed = new Set(previous.removedPlugIds);
  const overrides = new Map<string, PlugEndpoint>();
  const additions = new Map<string, PlugEndpoint>();

  defaults.plugs.forEach((bundled) => {
    const endpoint = byId.get(bundled.id);
    if (!endpoint) {
      removed.add(bundled.id);
      return;
    }
    removed.delete(bundled.id);
    if (!sameEndpoint(endpoint, bundled)) overrides.set(bundled.id, endpoint);
  });

  previous.removedPlugIds.forEach((id) => {
    if (!byId.has(id)) removed.add(id);
  });
  previous.plugOverrides.forEach((endpoint) => {
    if (!defaultById.has(endpoint.id) && !byId.has(endpoint.id)) overrides.set(endpoint.id, endpoint);
  });
  previous.addedPlugs.forEach((endpoint) => {
    const next = byId.get(endpoint.id);
    if (next && !defaultById.has(endpoint.id)) additions.set(endpoint.id, next);
  });
  configPlugs.forEach((endpoint) => {
    if (!defaultById.has(endpoint.id) && !overrides.has(endpoint.id)) additions.set(endpoint.id, endpoint);
  });

  const bridgeDefault = defaults.bridge.ipv4;
  const bridgeValue = config.bridge.ipv4;
  const bridgeOverride = bridgeValue !== undefined && bridgeValue !== bridgeDefault
    ? { ipv4: bridgeValue }
    : previous.bridgeOverride && bridgeValue === undefined && bridgeDefault === undefined
      ? { ...previous.bridgeOverride }
      : undefined;
  return validateUserConfigOverlay(defaults, {
    ...(bridgeOverride ? { bridgeOverride } : {}),
    plugOverrides: [...overrides.values()].filter((endpoint) => !removed.has(endpoint.id)),
    removedPlugIds: [...removed],
    addedPlugs: [...additions.values()],
    favorites: config.favorites,
    settings: config.settings,
  });
}
