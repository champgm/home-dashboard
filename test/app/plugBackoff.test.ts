import { ApplicationService } from "../../src/app/ApplicationService";
import { AppConfig, PlugEndpoint } from "../../src/app/types";
import { ConfigStore, KeyValueStore } from "../../src/storage/ConfigStore";

class MemoryStore implements KeyValueStore {
  value: string | null = null;
  async getItem(): Promise<string | null> { return this.value; }
  async setItem(_key: string, value: string): Promise<void> { this.value = value; }
  async removeItem(): Promise<void> { this.value = null; }
}

describe("per-plug refresh backoff", () => {
  test("backs off only the failing endpoint and manual refresh clears its backoff", async () => {
    const endpoints: PlugEndpoint[] = [
      { id: "seasonal", ipv4: "192.168.2.225", port: 9999 },
      { id: "reachable", ipv4: "192.168.2.226", port: 9999 },
    ];
    const config: AppConfig = { bridge: {}, plugs: endpoints, favorites: [], settings: {} };
    const configStore = new ConfigStore(new MemoryStore());
    await configStore.save(config);
    let now = 0;
    let seasonalOnline = false;
    const calls: string[] = [];
    const service = new ApplicationService({
      configStore,
      now: () => now,
      plugs: {
        getSysInfo: async (endpoint) => {
          calls.push(endpoint.id);
          if (endpoint.id === "seasonal" && !seasonalOnline) {
            throw Object.assign(new Error("offline"), { category: "NetworkUnavailable" });
          }
          return { alias: endpoint.id, relayState: false };
        },
        getPower: async () => false,
        setPower: async () => undefined,
      },
    });

    await service.refreshConfiguredPlugs();
    expect(calls).toEqual(["seasonal", "reachable"]);

    now = 5_000;
    await service.refreshConfiguredPlugs();
    expect(calls).toEqual(["seasonal", "reachable", "reachable"]);

    now = 10_000;
    await service.refreshConfiguredPlugs();
    expect(calls).toEqual(["seasonal", "reachable", "reachable", "seasonal", "reachable"]);

    now = 15_000;
    seasonalOnline = true;
    await service.refreshConfiguredPlugs({ ignoreBackoff: true });
    expect(calls.slice(-2)).toEqual(["seasonal", "reachable"]);
    expect(service.getDiagnostic("plug:seasonal")).toBeUndefined();

    await service.refreshConfiguredPlugs();
    expect(calls.slice(-2)).toEqual(["seasonal", "reachable"]);
  });
});
