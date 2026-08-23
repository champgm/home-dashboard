import { HueProvisioningService } from "../../src/app/HueProvisioningService";
import { ConfigStore, KeyValueStore } from "../../src/storage/ConfigStore";
import { CredentialStore, ProtectedValueStore } from "../../src/storage/CredentialStore";
import { HueV1Adapter } from "../../src/protocol/hue/HueV1Adapter";

class MemoryKeyValue implements KeyValueStore {
  value: string | null = null;
  async getItem(): Promise<string | null> { return this.value; }
  async setItem(_key: string, value: string): Promise<void> { this.value = value; }
  async removeItem(): Promise<void> { this.value = null; }
}

class MemoryProtected implements ProtectedValueStore {
  value: string | null = null;
  failWrite = false;
  async getItemAsync(): Promise<string | null> { return this.value; }
  async setItemAsync(_key: string, value: string): Promise<void> { if (this.failWrite) throw new Error("write"); this.value = value; }
}

function fakeAdapter(credential: string, bridgeId: string): HueV1Adapter {
  return {
    provision: async () => credential,
    getConfigWithCredential: async () => ({ bridgeid: bridgeId }),
  } as unknown as HueV1Adapter;
}

describe("Hue initial provisioning", () => {
  test("stores the endpoint first and publishes one protected binding only after verification", async () => {
    const config = new ConfigStore(new MemoryKeyValue());
    await config.load();
    const protectedStore = new CredentialStore(new MemoryProtected());
    const service = new HueProvisioningService(config, protectedStore, () => fakeAdapter("credential", "bridge"));
    const result = await service.provision("192.168.1.2");
    expect(result.kind).toBe("success");
    expect((await protectedStore.getBinding()).status).toBe("present");
    expect(config.getCommitted()?.bridge.ipv4).toBe("192.168.1.2");
  });

  test("protected storage failure leaves setup incomplete and does not report success", async () => {
    const config = new ConfigStore(new MemoryKeyValue());
    await config.load();
    const protectedMemory = new MemoryProtected();
    protectedMemory.failWrite = true;
    const service = new HueProvisioningService(config, new CredentialStore(protectedMemory), () => fakeAdapter("credential", "bridge"));
    await expect(service.provision("192.168.1.2")).resolves.toMatchObject({ kind: "definite_failure" });
    expect(await new CredentialStore(protectedMemory).getBinding()).toEqual({ status: "absent" });
  });
});
