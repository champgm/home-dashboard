import { ApplicationService } from "../../src/app/ApplicationService";
import { DeviceStateStore } from "../../src/app/DeviceStateStore";
import { ConfigStore, KeyValueStore } from "../../src/storage/ConfigStore";

class MemoryStore implements KeyValueStore {
  private value: string | null = null;
  async getItem(): Promise<string | null> { return this.value; }
  async setItem(_key: string, value: string): Promise<void> { this.value = value; }
  async removeItem(): Promise<void> { this.value = null; }
}

describe("TP-Link application energy integration", () => {
  test("requests energy only for a capability-reporting plug and preserves all returned fields", async () => {
    const configStore = new ConfigStore(new MemoryStore());
    await configStore.save({ bridge: {}, plugs: [{ id: "hs110", ipv4: "192.168.1.20", port: 9999 }], favorites: [], settings: {} });
    let energyReads = 0;
    const service = new ApplicationService({
      configStore,
      stateStore: new DeviceStateStore(),
      plugs: {
        getSysInfo: async () => ({ alias: "Desk", model: "HS110", deviceId: "device", mac: "AA", rssi: -40, relayState: true, feature: "ENE", hasEnergy: true }),
        getEnergy: async () => { energyReads += 1; return { currentMa: 12, voltageMv: 120000, powerMw: 1440000, totalWh: 5 }; },
        getPower: async () => true,
        setPower: async () => undefined,
      },
    });
    await service.refreshConfiguredPlugs();
    expect(energyReads).toBe(1);
    expect(service.stateStore.getValue<any>({ kind: "plug", plugEndpointId: "hs110" })).toEqual(expect.objectContaining({ alias: "Desk", model: "HS110", energy: expect.objectContaining({ powerMw: 1440000 }) }));
  });

  test("does not request or report energy for a non-capable plug", async () => {
    const configStore = new ConfigStore(new MemoryStore());
    await configStore.save({ bridge: {}, plugs: [{ id: "hs100", ipv4: "192.168.1.21", port: 9999 }], favorites: [], settings: {} });
    let energyReads = 0;
    const service = new ApplicationService({
      configStore,
      plugs: {
        getSysInfo: async () => ({ alias: "Fan", model: "HS100", relayState: false, hasEnergy: false }),
        getEnergy: async () => { energyReads += 1; return { powerMw: 1 }; },
        getPower: async () => false,
        setPower: async () => undefined,
      },
    });
    await service.refreshConfiguredPlugs();
    expect(energyReads).toBe(0);
    expect(service.stateStore.getValue<any>({ kind: "plug", plugEndpointId: "hs100" })?.energy).toBeUndefined();
  });
});
