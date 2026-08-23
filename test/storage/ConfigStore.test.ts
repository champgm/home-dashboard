import { AppConfig } from "../../src/app/types";
import { BundledDefaults } from "../../src/config/bundledDefaults";
import { ConfigStore, CONFIG_STORAGE_KEY, KeyValueStore } from "../../src/storage/ConfigStore";
import { serializeConfig } from "../../src/storage/configSchema";

class MemoryStorage implements KeyValueStore {
  value: string | null = null;
  failRead = false;
  failWrite = false;
  writes = 0;
  async getItem(_key: string): Promise<string | null> { if (this.failRead) throw new Error("read"); return this.value; }
  async setItem(_key: string, value: string): Promise<void> { if (this.failWrite) throw new Error("write"); this.writes += 1; this.value = value; }
  async removeItem(_key: string): Promise<void> { this.value = null; }
}

const defaultsA: BundledDefaults = {
  bridge: { ipv4: "192.168.1.2" },
  plugs: [
    { id: "p1", ipv4: "192.168.1.10", port: 9999 },
    { id: "p2", ipv4: "192.168.1.11", port: 9999 },
    { id: "p3", ipv4: "192.168.1.12", port: 9999 },
  ],
};

const defaultsB: BundledDefaults = {
  bridge: { ipv4: "192.168.1.3" },
  plugs: [
    { id: "p1", ipv4: "192.168.1.20", port: 9999 },
    { id: "p2", ipv4: "192.168.1.21", port: 9999 },
    { id: "p3", ipv4: "192.168.1.22", port: 9999 },
    { id: "p4", ipv4: "192.168.1.23", port: 9999 },
  ],
};

const config = (name: string): AppConfig => ({ bridge: {}, plugs: [], favorites: [{ kind: "light", id: name }], settings: {} });

describe("ConfigStore", () => {
  test("missing key resolves current bundled defaults without materializing them", async () => {
    const storage = new MemoryStorage();
    const store = new ConfigStore(storage, defaultsA);
    expect((await store.load()).status).toBe("absent");
    expect(store.getCommitted()).toMatchObject({ bridge: defaultsA.bridge, plugs: defaultsA.plugs });
    expect(storage.value).toBeNull();
    expect(storage.writes).toBe(0);
  });

  test("v1 load migrates to a canonical v2 overlay and preserves effective state", async () => {
    const storage = new MemoryStorage();
    const legacy: AppConfig = {
      bridge: { ipv4: "192.168.1.99" },
      plugs: [
        { id: "p1", ipv4: "192.168.1.10", port: 9999 },
        { id: "user", ipv4: "192.168.1.50", port: 9999 },
      ],
      favorites: [{ kind: "plug", plugEndpointId: "p1" }],
      settings: { theme: "dark", diagnosticsVisible: true },
    };
    storage.value = serializeConfig(legacy);
    const store = new ConfigStore(storage, defaultsA);
    expect((await store.load()).status).toBe("loaded");
    expect(store.getCommitted()).toEqual(legacy);
    const persisted = JSON.parse(storage.value!);
    expect(persisted.schemaVersion).toBe(2);
    expect(persisted.bridgeOverride).toEqual({ ipv4: "192.168.1.99" });
    expect(persisted.removedPlugIds).toEqual(["p2", "p3"]);
    expect(persisted.addedPlugs).toEqual([{ id: "user", ipv4: "192.168.1.50", port: 9999 }]);
  });

  test("A to B update follows untouched defaults and keeps explicit choices", async () => {
    const storage = new MemoryStorage();
    const first = new ConfigStore(storage, defaultsA);
    await first.load();
    await first.save({
      bridge: { ipv4: "192.168.1.99" },
      plugs: [
        { id: "p1", ipv4: "192.168.1.10", port: 9999 },
        { id: "p2", ipv4: "192.168.1.88", port: 9999 },
        { id: "user", ipv4: "192.168.1.50", port: 9999 },
      ],
      favorites: [{ kind: "plug", plugEndpointId: "p2" }],
      settings: { theme: "dark" },
    });
    const second = new ConfigStore(storage, defaultsB);
    await second.load();
    expect(second.getCommitted()).toEqual({
      bridge: { ipv4: "192.168.1.99" },
      plugs: [
        { id: "p1", ipv4: "192.168.1.20", port: 9999 },
        { id: "p2", ipv4: "192.168.1.88", port: 9999 },
        { id: "p4", ipv4: "192.168.1.23", port: 9999 },
        { id: "user", ipv4: "192.168.1.50", port: 9999 },
      ],
      favorites: [{ kind: "plug", plugEndpointId: "p2" }],
      settings: { theme: "dark" },
    });
  });

  test("concurrent mutations are serialized from the last committed overlay", async () => {
    const storage = new MemoryStorage();
    const store = new ConfigStore(storage, { bridge: {}, plugs: [] });
    await store.load();
    await Promise.all([
      store.mutate((value) => ({ ...value, favorites: [{ kind: "light", id: "1" }] })),
      store.mutate((value) => ({ ...value, plugs: [{ id: "p", ipv4: "192.168.1.2", port: 9999 }] })),
    ]);
    const loaded = JSON.parse(storage.value!);
    expect(loaded.schemaVersion).toBe(2);
    expect(loaded.favorites).toEqual([{ kind: "light", id: "1" }]);
    expect(loaded.addedPlugs).toEqual([{ id: "p", ipv4: "192.168.1.2", port: 9999 }]);
  });

  test("corrupt data is not seeded or overwritten until explicit reset", async () => {
    const storage = new MemoryStorage();
    storage.value = "not-json";
    const store = new ConfigStore(storage, defaultsA);
    expect((await store.load()).status).toBe("corrupt");
    expect((await store.mutate((value) => value)).status).toBe("ioError");
    expect(storage.value).toBe("not-json");
    expect((await store.reset()).status).toBe("success");
    expect(JSON.parse(storage.value!).schemaVersion).toBe(2);
    expect(store.getCommitted()?.plugs).toEqual(defaultsA.plugs);
  });

  test("read and write I/O failures are not absence or successful saves", async () => {
    const storage = new MemoryStorage();
    storage.failRead = true;
    const store = new ConfigStore(storage, defaultsA);
    expect((await store.load()).status).toBe("ioError");
    storage.failRead = false;
    expect((await store.reset()).status).toBe("success");
    storage.failWrite = true;
    const committed = store.getCommitted();
    expect((await store.save(config("x"))).status).toBe("ioError");
    expect(store.getCommitted()).toEqual(committed);
  });

  test("v1 migration write failure is an I/O error and preserves the legacy value", async () => {
    const storage = new MemoryStorage();
    const legacy = serializeConfig(config("legacy"));
    storage.value = legacy;
    storage.failWrite = true;
    const store = new ConfigStore(storage, defaultsA);
    expect((await store.load()).status).toBe("ioError");
    expect(storage.value).toBe(legacy);
    expect(store.getCommitted()).toBeUndefined();
  });

  test("reset restores current defaults and does not touch another protected store", async () => {
    const storage = new MemoryStorage();
    const store = new ConfigStore(storage, defaultsB);
    await store.load();
    await store.save({ bridge: { ipv4: "192.168.1.99" }, plugs: [], favorites: [], settings: {} });
    expect((await store.reset()).status).toBe("success");
    expect(store.getCommitted()).toMatchObject({ bridge: defaultsB.bridge, plugs: defaultsB.plugs });
    expect(JSON.parse(storage.value!).removedPlugIds).toEqual([]);
  });

  test("upserting an existing endpoint preserves its stable ID", async () => {
    const storage = new MemoryStorage();
    const store = new ConfigStore(storage, defaultsA);
    await store.load();
    expect((await store.upsertPlugEndpoint({ id: "ignored", ipv4: "192.168.1.88", port: 9999 }, "p2")).status).toBe("success");
    expect(store.getCommitted()?.plugs.find((endpoint) => endpoint.id === "p2")).toEqual({ id: "p2", ipv4: "192.168.1.88", port: 9999 });
  });

  test("uses the fixed configuration key", () => {
    expect(CONFIG_STORAGE_KEY).toBe("homeDashboard.config");
  });
});
