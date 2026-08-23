import { ApplicationService } from "../../src/app/ApplicationService";
import { performConfirmedHueDelete } from "../../src/app/destructiveActions";
import { BundledDefaults } from "../../src/config/bundledDefaults";
import { ConfigStore, KeyValueStore } from "../../src/storage/ConfigStore";

class MemoryKeyValue implements KeyValueStore {
  value: string | null = null;
  failWrite = false;
  async getItem(): Promise<string | null> { return this.value; }
  async setItem(_key: string, value: string): Promise<void> { if (this.failWrite) throw new Error("write"); this.value = value; }
  async removeItem(): Promise<void> { this.value = null; }
}

const defaultsA: BundledDefaults = {
  bridge: {},
  plugs: [
    { id: "p1", ipv4: "192.168.1.10", port: 9999 },
    { id: "p2", ipv4: "192.168.1.11", port: 9999 },
  ],
};

const defaultsB: BundledDefaults = {
  bridge: {},
  plugs: [
    { id: "p1", ipv4: "192.168.1.20", port: 9999 },
    { id: "p2", ipv4: "192.168.1.21", port: 9999 },
  ],
};

test("favorite cleanup failure never repeats a completed remote delete", async () => {
  const storage = new MemoryKeyValue();
  const config = new ConfigStore(storage);
  await config.load();
  await config.save({ bridge: {}, plugs: [], favorites: [{ kind: "light", id: "1" }], settings: {} });
  storage.failWrite = true;
  let remoteDeletes = 0;
  const result = await performConfirmedHueDelete(
    new ApplicationService(),
    config,
    "light",
    "1",
    async () => { remoteDeletes += 1; return { kind: "success" }; },
  );
  expect(result.kind).toBe("success");
  expect(result.diagnostic?.category).toBe("StorageError");
  expect(remoteDeletes).toBe(1);
});

test("removing a bundled plug is local-only and remains removed in a later generation", async () => {
  const storage = new MemoryKeyValue();
  const config = new ConfigStore(storage, defaultsA);
  await config.load();
  let networkCalls = 0;
  const service = new ApplicationService({ configStore: config, plugs: {
    getSysInfo: async () => { networkCalls += 1; return {}; },
    getPower: async () => false,
    setPower: async () => undefined,
  } });
  expect((await service.removePlugEndpoint("p2")).kind).toBe("success");
  expect(networkCalls).toBe(0);
  expect(JSON.parse(storage.value!).removedPlugIds).toEqual(["p2"]);
  const next = new ConfigStore(storage, defaultsB);
  await next.load();
  expect(next.getCommitted()?.plugs.map((endpoint) => endpoint.id)).toEqual(["p1"]);
});
