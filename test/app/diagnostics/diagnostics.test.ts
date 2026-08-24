import { ApplicationService } from "../../../src/app/ApplicationService";
import { DeviceStateStore } from "../../../src/app/DeviceStateStore";
import { HueSnapshot, PlugEndpoint } from "../../../src/app/types";
import { ConfigStore, KeyValueStore } from "../../../src/storage/ConfigStore";

class MemoryStore implements KeyValueStore {
  value: string | null = null;
  async getItem(): Promise<string | null> { return this.value; }
  async setItem(_key: string, value: string): Promise<void> { this.value = value; }
  async removeItem(): Promise<void> { this.value = null; }
}

const emptySnapshot = (): HueSnapshot => ({
  lights: {},
  groups: {},
  scenes: {},
  sensors: {},
  rules: {},
  schedules: {},
  resourcelinks: {},
});

describe("current diagnostics", () => {
  test("uses one Hue bridge diagnostic for a failed snapshot and clears it on success", async () => {
    let fail = true;
    const state = new DeviceStateStore();
    ["light", "group", "scene", "sensor", "rule", "schedule", "resourcelink"].forEach((kind) => {
      state.setKnown({ kind: kind as any, id: "1" }, { state: { on: false } });
    });
    const service = new ApplicationService({
      stateStore: state,
      hue: {
        snapshot: async () => {
          if (fail) throw Object.assign(new Error("bridge unavailable"), { category: "NetworkUnavailable" });
          return emptySnapshot();
        },
      },
    });

    await service.refreshHue();
    expect(Array.from(service.getDiagnostics().keys())).toEqual(["hue:bridge"]);
    expect(service.getDiagnostics().get("hue:bridge")).toMatchObject({ category: "NetworkUnavailable" });

    fail = false;
    await service.refreshHue();
    expect(service.getDiagnostics().has("hue:bridge")).toBe(false);
  });

  test("keeps one attributable diagnostic per failed plug and clears only recovered plugs", async () => {
    const storage = new MemoryStore();
    const configStore = new ConfigStore(storage);
    const endpoints: PlugEndpoint[] = [
      { id: "left", ipv4: "192.168.1.10", port: 9999 },
      { id: "right", ipv4: "192.168.1.11", port: 9999 },
    ];
    await configStore.save({ bridge: {}, plugs: endpoints, favorites: [], settings: {} });
    const failed = new Set(["left", "right"]);
    const service = new ApplicationService({
      configStore,
      plugs: {
        getSysInfo: async (endpoint) => {
          if (failed.has(endpoint.id)) throw Object.assign(new Error(`offline ${endpoint.id}`), { category: "Timeout" });
          return { alias: endpoint.id, relayState: false };
        },
        getPower: async () => false,
        setPower: async () => undefined,
      },
    });

    await service.refreshConfiguredPlugs();
    expect(Array.from(service.getDiagnostics().keys()).sort()).toEqual(["plug:left", "plug:right"]);
    expect(service.getDiagnostics().get("plug:left")).toMatchObject({ resource: "left", category: "Timeout" });

    failed.delete("left");
    await service.refreshPlug(endpoints[0]);
    expect(service.getDiagnostics().has("plug:left")).toBe(false);
    expect(service.getDiagnostics().has("plug:right")).toBe(true);
  });

  test("keeps provisioning and bridge diagnostics separate", () => {
    const service = new ApplicationService();
    service.setDiagnostic("hue:provisioning", { category: "ProtocolRejected", message: "link button not pressed" });
    service.setDiagnostic("hue:bridge", { category: "Timeout", message: "bridge timed out" });
    expect(Array.from(service.getDiagnostics().keys()).sort()).toEqual(["hue:bridge", "hue:provisioning"]);
  });
});
