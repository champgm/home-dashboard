import { HueReauthorizationService } from "../../src/app/HueReauthorizationService";
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
  async getItemAsync(): Promise<string | null> { return this.value; }
  async setItemAsync(_key: string, value: string): Promise<void> { this.value = value; }
}

function fakeAdapter(credential: string, bridgeId: string): HueV1Adapter {
  return {
    provision: async () => credential,
    getConfigWithCredential: async () => ({ bridgeid: bridgeId }),
  } as unknown as HueV1Adapter;
}

describe("Hue same-bridge reauthorization", () => {
  test("replaces only a credential authenticated by the permanently bound bridge", async () => {
    const config = new ConfigStore(new MemoryKeyValue());
    await config.load();
    await config.save({ bridge: { ipv4: "192.168.1.2" }, plugs: [], favorites: [], settings: {} });
    const protectedMemory = new MemoryProtected();
    const credentials = new CredentialStore(protectedMemory);
    await credentials.setBinding({ bridgeId: "BOUND", credential: "old" });
    const service = new HueReauthorizationService(config, credentials, () => fakeAdapter("new", "OTHER"));
    await expect(service.reauthorize()).resolves.toMatchObject({ kind: "definite_failure", diagnostic: { category: "BridgeIdentityMismatch" } });
    expect(await credentials.getBinding()).toEqual({ status: "present", binding: { bridgeId: "BOUND", credential: "old" } });
  });

  test("promotes a replacement credential after same-bridge verification", async () => {
    const config = new ConfigStore(new MemoryKeyValue());
    await config.load();
    await config.save({ bridge: { ipv4: "192.168.1.2" }, plugs: [], favorites: [], settings: {} });
    const protectedMemory = new MemoryProtected();
    const credentials = new CredentialStore(protectedMemory);
    await credentials.setBinding({ bridgeId: "BOUND", credential: "old" });
    const service = new HueReauthorizationService(config, credentials, () => fakeAdapter("new", "BOUND"));
    await expect(service.reauthorize()).resolves.toMatchObject({ kind: "success" });
    expect(await credentials.getBinding()).toEqual({ status: "present", binding: { bridgeId: "BOUND", credential: "new" } });
  });
});
