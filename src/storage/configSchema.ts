import { FavoriteRef, AppConfig, PlugEndpoint, UiSettings } from "../app/types";
import { validatePlugEndpoint } from "../config/endpointValidation";

export const CONFIG_SCHEMA_VERSION = 1;

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
  if (value === undefined || value === null) {
    return {};
  }
  const bridge = objectValue(value, "bridge");
  if (bridge.ipv4 === undefined || bridge.ipv4 === "") {
    return {};
  }
  const validated = validatePlugEndpoint({ ipv4: bridge.ipv4, port: 1 });
  return { ipv4: validated.ipv4 };
}

function parsePlugs(value: unknown): PlugEndpoint[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new ConfigSchemaError("plugs must be an array.");
  }
  return value.map((item, index) => {
    try {
      const endpoint = objectValue(item, `plugs[${index}]`);
      return validatePlugEndpoint({
        id: endpoint.id,
        ipv4: endpoint.ipv4,
        port: endpoint.port,
      });
    } catch (error) {
      throw new ConfigSchemaError(`Invalid plug endpoint at index ${index}.`);
    }
  });
}

function parseFavorites(value: unknown): FavoriteRef[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new ConfigSchemaError("favorites must be an array.");
  }
  return value.map((item, index) => {
    const favorite = objectValue(item, `favorites[${index}]`);
    if (typeof favorite.kind !== "string") {
      throw new ConfigSchemaError(`favorites[${index}] has no kind.`);
    }
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
  if (value === undefined || value === null) {
    return {};
  }
  const settings = objectValue(value, "settings");
  return {
    theme: settings.theme === "light" ? "light" : settings.theme === "dark" ? "dark" : undefined,
    diagnosticsVisible: settings.diagnosticsVisible === true,
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

export function parseConfig(value: unknown): AppConfig {
  const root = objectValue(value, "configuration");
  const bridge = optionalPrivateBridge(root.bridge);
  return {
    bridge,
    plugs: parsePlugs(root.plugs),
    favorites: parseFavorites(root.favorites),
    settings: parseSettings(root.settings),
  };
}

export function parseConfigJson(raw: string): AppConfig {
  try {
    return parseConfig(JSON.parse(raw));
  } catch (error) {
    if (error instanceof ConfigSchemaError) {
      throw error;
    }
    throw new ConfigSchemaError("The stored configuration is not valid JSON.");
  }
}

export function serializeConfig(config: AppConfig): string {
  return JSON.stringify({
    schemaVersion: CONFIG_SCHEMA_VERSION,
    bridge: config.bridge,
    plugs: config.plugs,
    favorites: config.favorites,
    settings: config.settings,
  });
}

export function cloneConfig(config: AppConfig): AppConfig {
  return JSON.parse(JSON.stringify(config)) as AppConfig;
}
