import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppConfig, ConfigLoadResult, ConfigSaveResult, PlugEndpoint, StorageIoError } from "../app/types";
import { getBundledPlugPreseed } from "../config/plugPreseed";
import { cloneConfig, createEmptyConfig, parseConfig, parseConfigJson, serializeConfig } from "./configSchema";

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

export class ConfigStore {
  private readonly storage: KeyValueStore;
  private readonly preseed: AppConfig;
  private committed?: AppConfig;
  private blocked = false;
  private writeQueue: Promise<unknown> = Promise.resolve();
  private readonly listeners = new Set<() => void>();

  constructor(
    storage: KeyValueStore = asyncStorage,
    preseed: AppConfig | readonly PlugEndpoint[] = createEmptyConfig(getBundledPlugPreseed()),
  ) {
    this.storage = storage;
    this.preseed = cloneConfig(Array.isArray(preseed) ? createEmptyConfig(preseed as readonly PlugEndpoint[]) : preseed as AppConfig);
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
      const config = cloneConfig(this.preseed);
      this.committed = config;
      this.blocked = false;
      this.notify();
      return { status: "absent", config: cloneConfig(config) };
    }
    try {
      const config = parseConfigJson(raw);
      this.committed = config;
      this.blocked = false;
      this.notify();
      return { status: "loaded", config: cloneConfig(config) };
    } catch (_error) {
      // Do not seed, overwrite, or replace an unreadable existing value.
      this.blocked = true;
      return { status: "corrupt", error: new Error("Local configuration is unreadable.") };
    }
  }

  getCommitted(): AppConfig | undefined {
    return this.committed ? cloneConfig(this.committed) : undefined;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async save(config: AppConfig): Promise<ConfigSaveResult> {
    if (this.blocked) {
      return { status: "ioError", error: new StorageIoError("Local configuration requires explicit reset before it can be replaced.") };
    }
    let next: AppConfig;
    try {
      next = parseConfig(config);
    } catch (error) {
      return { status: "ioError", error: new StorageIoError("Local configuration mutation was rejected.", error) };
    }
    return this.enqueue(async () => {
      try {
        await this.storage.setItem(CONFIG_STORAGE_KEY, serializeConfig(next));
        this.committed = cloneConfig(next);
        this.notify();
        return { status: "success" } as const;
      } catch (_error) {
        return { status: "ioError", error: new StorageIoError("Local configuration could not be saved.") } as const;
      }
    });
  }

  async mutate(mutator: (current: AppConfig) => AppConfig): Promise<ConfigSaveResult> {
    return this.enqueue(async () => {
      if (this.blocked) {
        return { status: "ioError", error: new StorageIoError("Local configuration requires explicit reset before it can be replaced.") } as const;
      }
      const current = this.committed ? cloneConfig(this.committed) : cloneConfig(this.preseed);
      let next: AppConfig;
      try {
        next = parseConfig(mutator(current));
      } catch (error) {
        return { status: "ioError", error: new StorageIoError("Local configuration mutation was rejected.", error) } as const;
      }
      try {
        await this.storage.setItem(CONFIG_STORAGE_KEY, serializeConfig(next));
        this.committed = cloneConfig(next);
        this.notify();
        return { status: "success" } as const;
      } catch (_error) {
        return { status: "ioError", error: new StorageIoError("Local configuration could not be saved.") } as const;
      }
    });
  }

  async reset(): Promise<ConfigSaveResult> {
    return this.enqueue(async () => {
      const next = cloneConfig(this.preseed);
      try {
        await this.storage.setItem(CONFIG_STORAGE_KEY, serializeConfig(next));
        this.committed = cloneConfig(next);
        this.blocked = false;
        this.notify();
        return { status: "success" } as const;
      } catch (_error) {
        return { status: "ioError", error: new StorageIoError("Local configuration could not be reset.") } as const;
      }
    });
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
