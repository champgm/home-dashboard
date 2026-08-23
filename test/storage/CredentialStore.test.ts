import { CredentialStore, HUE_BINDING_KEY, ProtectedValueStore } from "../../src/storage/CredentialStore";
import { ConfigStore, KeyValueStore } from "../../src/storage/ConfigStore";

class ProtectedMemory implements ProtectedValueStore {
  value: string | null = null;
  failRead = false;
  failWrite = false;
  async getItemAsync(_key: string): Promise<string | null> { if (this.failRead) throw new Error("read"); return this.value; }
  async setItemAsync(_key: string, value: string): Promise<void> { if (this.failWrite) throw new Error("write"); this.value = value; }
}

describe("CredentialStore", () => {
  test("keeps bridgeId and credential together", async () => {
    const storage = new ProtectedMemory();
    const store = new CredentialStore(storage);
    expect((await store.getBinding()).status).toBe("absent");
    expect((await store.setBinding({ bridgeId: "B", credential: "C" })).status).toBe("success");
    expect(storage.value).toBe(JSON.stringify({ bridgeId: "B", credential: "C" }));
    expect((await store.getBinding())).toEqual({ status: "present", binding: { bridgeId: "B", credential: "C" } });
  });

  test("read, malformed, and write errors fail closed", async () => {
    const storage = new ProtectedMemory();
    const store = new CredentialStore(storage);
    storage.failRead = true;
    expect((await store.getBinding()).status).toBe("ioError");
    storage.failRead = false;
    storage.value = "{}";
    expect((await store.getBinding()).status).toBe("ioError");
    storage.failWrite = true;
    expect((await store.setBinding({ bridgeId: "B", credential: "C" })).status).toBe("ioError");
  });

  test("configuration reset does not touch protected storage", async () => {
    const protectedStorage = new ProtectedMemory();
    const credentials = new CredentialStore(protectedStorage);
    await credentials.setBinding({ bridgeId: "BOUND", credential: "SECRET" });
    let configValue: string | null = null;
    const configStorage: KeyValueStore = {
      async getItem() { return configValue; },
      async setItem(_key, value) { configValue = value; },
      async removeItem() { configValue = null; },
    };
    const config = new ConfigStore(configStorage);
    await config.load();
    await config.reset();
    expect((await credentials.getBinding())).toEqual({ status: "present", binding: { bridgeId: "BOUND", credential: "SECRET" } });
    expect(HUE_BINDING_KEY).not.toBe("homeDashboard.config");
  });
});
