import { ApplicationService } from "../../src/app/ApplicationService";
import { performConfirmedHueDelete } from "../../src/app/destructiveActions";
import { ConfigStore, KeyValueStore } from "../../src/storage/ConfigStore";

class MemoryKeyValue implements KeyValueStore {
  value: string | null = null;
  failWrite = false;
  async getItem(): Promise<string | null> { return this.value; }
  async setItem(_key: string, value: string): Promise<void> { if (this.failWrite) throw new Error("write"); this.value = value; }
  async removeItem(): Promise<void> { this.value = null; }
}

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
