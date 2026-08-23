import * as SecureStore from "expo-secure-store";
import { HueBinding, HueBindingLoadResult, StorageIoError } from "../app/types";
import { parseHueBinding, serializeHueBinding } from "./hueBindingSchema";

export interface ProtectedValueStore {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

const secureStore: ProtectedValueStore = {
  getItemAsync: (key) => SecureStore.getItemAsync(key),
  setItemAsync: (key, value) => SecureStore.setItemAsync(key, value),
};

export const HUE_BINDING_KEY = "homeDashboard.hueBinding";

export class CredentialStore {
  private readonly store: ProtectedValueStore;

  constructor(store: ProtectedValueStore = secureStore) {
    this.store = store;
  }

  async getBinding(): Promise<HueBindingLoadResult> {
    let raw: string | null;
    try {
      raw = await this.store.getItemAsync(HUE_BINDING_KEY);
    } catch (_error) {
      return { status: "ioError", error: new StorageIoError("Protected Hue storage is unavailable.") };
    }
    if (raw === null) {
      return { status: "absent" };
    }
    try {
      return { status: "present", binding: parseHueBinding(raw) };
    } catch (_error) {
      // A malformed protected value fails closed. It is not permission to
      // provision or adopt a different bridge.
      return { status: "ioError", error: new StorageIoError("Protected Hue binding is unreadable.") };
    }
  }

  async setBinding(binding: HueBinding): Promise<{ status: "success" } | { status: "ioError"; error: StorageIoError }> {
    try {
      await this.store.setItemAsync(HUE_BINDING_KEY, serializeHueBinding(binding));
      return { status: "success" };
    } catch (_error) {
      return { status: "ioError", error: new StorageIoError("Protected Hue storage could not save the binding.") };
    }
  }
}
