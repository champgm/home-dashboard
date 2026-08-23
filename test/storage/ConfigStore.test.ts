import { AppConfig } from "../../src/app/types";
import { ConfigStore, CONFIG_STORAGE_KEY, KeyValueStore } from "../../src/storage/ConfigStore";

class MemoryStorage implements KeyValueStore {
  value: string | null = null;
  failRead = false;
  failWrite = false;
  async getItem(_key: string): Promise<string | null> { if (this.failRead) throw new Error("read"); return this.value; }
  async setItem(_key: string, value: string): Promise<void> { if (this.failWrite) throw new Error("write"); this.value = value; }
  async removeItem(_key: string): Promise<void> { this.value = null; }
}

const config = (name: string): AppConfig => ({ bridge: {}, plugs: [], favorites: [{ kind: "light", id: name }], settings: {} });

describe("ConfigStore", () => {
  test("distinguishes absent from valid data and preserves dynamic collections", async () => {
    const storage = new MemoryStorage();
    const store = new ConfigStore(storage);
    expect((await store.load()).status).toBe("absent");
    await store.save(config("one"));
    expect((await store.load()).status).toBe("loaded");
    expect(store.getCommitted()?.favorites).toEqual([{ kind: "light", id: "one" }]);
    expect(storage.value).toContain(CONFIG_STORAGE_KEY.slice(0, 0));
  });

  test("corrupt data is not seeded or overwritten until explicit reset", async () => {
    const storage = new MemoryStorage();
    storage.value = "not-json";
    const store = new ConfigStore(storage, [{ id: "seed", ipv4: "192.168.1.10", port: 9999 }]);
    expect((await store.load()).status).toBe("corrupt");
    expect((await store.mutate((value) => value)).status).toBe("ioError");
    expect(storage.value).toBe("not-json");
    expect((await store.reset()).status).toBe("success");
    expect(JSON.parse(storage.value!).plugs).toEqual([{ id: "seed", ipv4: "192.168.1.10", port: 9999 }]);
  });

  test("serializes concurrent mutations from the last committed value", async () => {
    const storage = new MemoryStorage();
    const store = new ConfigStore(storage);
    await store.load();
    await Promise.all([
      store.mutate((value) => ({ ...value, favorites: [{ kind: "light", id: "1" }] })),
      store.mutate((value) => ({ ...value, plugs: [{ id: "p", ipv4: "192.168.1.2", port: 9999 }] })),
    ]);
    const loaded = JSON.parse(storage.value!);
    expect(loaded.favorites).toEqual([{ kind: "light", id: "1" }]);
    expect(loaded.plugs).toEqual([{ id: "p", ipv4: "192.168.1.2", port: 9999 }]);
  });

  test("I/O failure is not absence or success", async () => {
    const storage = new MemoryStorage();
    storage.failRead = true;
    const store = new ConfigStore(storage);
    expect((await store.load()).status).toBe("ioError");
    expect((await store.reset()).status).toBe("success");
    storage.failWrite = true;
    expect((await store.save(config("x"))).status).toBe("ioError");
  });
});
