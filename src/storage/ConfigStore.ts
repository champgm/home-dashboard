import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppConfig, ConfigLoadResult, ConfigSaveResult, PlugEndpoint, StorageIoError } from "../app/types";
import { BundledDefaults, getBundledDefaults } from "../config/bundledDefaults";
import { validatePlugEndpoint } from "../config/endpointValidation";
import {
  cloneUserConfigOverlay,
  createEmptyUserConfigOverlay,
  overlayFromConfig,
  resolveConfig,
  UserConfigOverlay,
} from "../config/overlayResolver";
import {
  cloneConfig,
  CONFIG_SCHEMA_VERSION,
  migrateConfigToOverlay,
  parseConfig,
  parsePersistedConfiguration,
  serializeUserConfigOverlay,
} from "./configSchema";

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const asyncStorage: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export const CONFIG_STORAGE_KEY = "homeDashboard.config";
export type ConfigDefaultsInput = BundledDefaults | AppConfig | readonly PlugEndpoint[];

function isAppConfig(input: ConfigDefaultsInput): input is AppConfig {
  return !Array.isArray(input) && "favorites" in input && "settings" in input;
}

function normalizeDefaults(input: ConfigDefaultsInput): BundledDefaults {
  if (Array.isArray(input)) return getBundledDefaults({ bridge: {}, plugs: input });
  if (isAppConfig(input)) {
    return getBundledDefaults({ bridge: input.bridge, plugs: input.plugs });
  }
  return getBundledDefaults(input as BundledDefaults);
}

export class ConfigStore {
  private readonly storage: KeyValueStore;
  private readonly defaults: BundledDefaults;
  private committed?: AppConfig;
  private committedOverlay?: UserConfigOverlay;
  private blocked = false;
  private writeQueue: Promise<unknown> = Promise.resolve();
  private readonly listeners = new Set<() => void>();

  constructor(
    storage: KeyValueStore = asyncStorage,
    defaultsInput: ConfigDefaultsInput = getBundledDefaults(),
  ) {
    this.storage = storage;
    this.defaults = normalizeDefaults(defaultsInput);
  }

  async load(): Promise<ConfigLoadResult> {
    let raw: string | null;
    try {
      raw = await this.storage.getItem(CONFIG_STORAGE_KEY);
    } catch (_error) {
      this.blocked = true;
      return { status: "ioError", error: new StorageIoError("Local configuration storage is unavailable.") };
    }
    if (raw === null) {
      const overlay = createEmptyUserConfigOverlay();
      const config = resolveConfig(this.defaults, overlay);
      this.commit(overlay, config);
      return { status: "absent", config: cloneConfig(config) };
    }
    try {
      const persisted = parsePersistedConfiguration(raw, this.defaults);
      if (persisted.kind === "overlay") {
        const config = resolveConfig(this.defaults, persisted.overlay);
        this.commit(persisted.overlay, config);
        return { status: "loaded", config: cloneConfig(config) };
      }
      const overlay = migrateConfigToOverlay(persisted.config, this.defaults);
      try {
        await this.storage.setItem(CONFIG_STORAGE_KEY, serializeUserConfigOverlay(overlay));
      } catch (_error) {
        this.blocked = true;
        return { status: "ioError", error: new StorageIoError("Local configuration migration could not be saved.") };
      }
      const config = resolveConfig(this.defaults, overlay);
      this.commit(overlay, config);
      return { status: "loaded", config: cloneConfig(config) };
    } catch (error) {
      if (error instanceof StorageIoError) {
        this.blocked = true;
        return { status: "ioError", error };
      }
      // Do not seed, overwrite, or replace an unreadable existing value.
      this.blocked = true;
      return { status: "corrupt", error: new Error("Local configuration is unreadable.") };
    }
  }

  getCommitted(): AppConfig | undefined {
    return this.committed ? cloneConfig(this.committed) : undefined;
  }

  getOverlay(): UserConfigOverlay | undefined {
    return this.committedOverlay ? cloneUserConfigOverlay(this.committedOverlay) : undefined;
  }

  getBundledDefaults(): BundledDefaults {
    return normalizeDefaults(this.defaults);
  }

  isBundledPlugId(id: string): boolean {
    return this.defaults.plugs.some((endpoint) => endpoint.id === id);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async save(config: AppConfig): Promise<ConfigSaveResult> {
    let next: AppConfig;
    try {
      next = parseConfig(config);
    } catch (error) {
      return { status: "ioError", error: new StorageIoError("Local configuration mutation was rejected.", error) };
    }
    return this.enqueue(async () => this.persistEffectiveConfig(next));
  }

  async mutate(mutator: (current: AppConfig) => AppConfig): Promise<ConfigSaveResult> {
    return this.enqueue(async () => {
      if (this.blocked) {
        return { status: "ioError", error: new StorageIoError("Local configuration requires explicit reset before it can be replaced.") } as const;
      }
      const current = this.committed ? cloneConfig(this.committed) : resolveConfig(this.defaults, createEmptyUserConfigOverlay());
      let next: AppConfig;
      try {
        next = parseConfig(mutator(current));
      } catch (error) {
        return { status: "ioError", error: new StorageIoError("Local configuration mutation was rejected.", error) } as const;
      }
      return this.persistEffectiveConfig(next);
    });
  }

  async upsertPlugEndpoint(endpointInput: PlugEndpoint, existingId?: string): Promise<ConfigSaveResult> {
    let endpoint: PlugEndpoint;
    try {
      endpoint = validatePlugEndpoint(endpointInput);
    } catch (error) {
      return { status: "ioError", error: new StorageIoError("Plug endpoint was rejected.", error) };
    }
    return this.mutate((current) => {
      const matchingBundled = this.defaults.plugs.find((candidate) => candidate.ipv4 === endpoint.ipv4 && candidate.port === endpoint.port);
      const id = existingId || matchingBundled?.id || endpoint.id;
      if (existingId && !current.plugs.some((candidate) => candidate.id === existingId)) {
        throw new Error("The plug endpoint being edited is no longer configured.");
      }
      if (!existingId && current.plugs.some((candidate) => candidate.id === id)) {
        throw new Error("A plug with this stable ID is already configured; select Edit to change it.");
      }
      const replacement = { ...endpoint, id };
      return {
        ...current,
        plugs: [...current.plugs.filter((candidate) => candidate.id !== id), replacement],
      };
    });
  }

  async reset(): Promise<ConfigSaveResult> {
    return this.enqueue(async () => {
      const overlay = createEmptyUserConfigOverlay();
      const next = resolveConfig(this.defaults, overlay);
      try {
        await this.storage.setItem(CONFIG_STORAGE_KEY, serializeUserConfigOverlay(overlay));
        this.commit(overlay, next);
        return { status: "success" } as const;
      } catch (_error) {
        return { status: "ioError", error: new StorageIoError("Local configuration could not be reset.") } as const;
      }
    });
  }

  private async persistEffectiveConfig(next: AppConfig): Promise<ConfigSaveResult> {
    if (this.blocked) {
      return { status: "ioError", error: new StorageIoError("Local configuration requires explicit reset before it can be replaced.") };
    }
    let overlay: UserConfigOverlay;
    try {
      overlay = overlayFromConfig(this.defaults, next, this.committedOverlay || createEmptyUserConfigOverlay());
    } catch (error) {
      return { status: "ioError", error: new StorageIoError("Local configuration mutation was rejected.", error) };
    }
    try {
      await this.storage.setItem(CONFIG_STORAGE_KEY, serializeUserConfigOverlay(overlay));
      this.commit(overlay, resolveConfig(this.defaults, overlay));
      return { status: "success" } as const;
    } catch (_error) {
      return { status: "ioError", error: new StorageIoError("Local configuration could not be saved.") } as const;
    }
  }

  private commit(overlay: UserConfigOverlay, config: AppConfig): void {
    this.committedOverlay = cloneUserConfigOverlay(overlay);
    this.committed = cloneConfig(config);
    this.blocked = false;
    this.notify();
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.writeQueue.then(operation, operation);
    this.writeQueue = next.then(() => undefined, () => undefined);
    return next;
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export { CONFIG_SCHEMA_VERSION };
