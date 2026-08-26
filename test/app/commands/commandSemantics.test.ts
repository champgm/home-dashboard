import { ApplicationService } from "../../../src/app/ApplicationService";
import { DeviceStateStore } from "../../../src/app/DeviceStateStore";
import { ConfigStore, KeyValueStore } from "../../../src/storage/ConfigStore";
import { AppConfig, HueSnapshot, PlugEndpoint } from "../../../src/app/types";

class Store implements KeyValueStore {
  value: string | null = null;
  async getItem() { return this.value; }
  async setItem(_key: string, value: string) { this.value = value; }
  async removeItem() { this.value = null; }
}

const emptySnapshot = (): HueSnapshot => ({ lights: {}, groups: {}, scenes: {}, sensors: {}, rules: {}, schedules: {}, resourcelinks: {} });

describe("ApplicationService command semantics", () => {
  test("does not toggle unknown resources", async () => {
    const calls: unknown[] = [];
    const service = new ApplicationService({ hue: { snapshot: async () => emptySnapshot(), setLightState: async () => { calls.push(true); } }, stateStore: new DeviceStateStore() });
    const result = await service.performPrimary({ kind: "light", id: "1" });
    expect(result.kind).toBe("definite_failure");
    expect(calls).toHaveLength(0);
  });

  test("rejects Hue updates and Sensor config writes without a known original", async () => {
    let calls = 0;
    const service = new ApplicationService({
      hue: {
        snapshot: async () => emptySnapshot(),
        mutate: async () => { calls += 1; },
      },
      stateStore: new DeviceStateStore(),
    });
    expect((await service.mutateHue("group", "1", "update", { name: "Room", lights: ["1"] })).kind).toBe("definite_failure");
    expect((await service.mutateHue("sensor", "1", "config", { config: { on: false } })).kind).toBe("definite_failure");
    expect(calls).toBe(0);
  });

  test("submits a validated replacement for a stale Rule binding through the service boundary", async () => {
    const writes: Array<Record<string, unknown>> = [];
    const service = new ApplicationService({
      hue: {
        snapshot: async () => emptySnapshot(),
        mutate: async (_kind, _id, _operation, payload) => { writes.push(payload); },
      },
      stateStore: new DeviceStateStore(),
    });
    service.stateStore.setKnown({ kind: "rule", id: "8" }, {
      conditions: [{ address: "/sensors/4/state/stale-event", operator: "eq", value: "1002" }],
      actions: [{ address: "/lights/1/action", method: "PUT", body: { on: true } }],
    });
    const result = await service.mutateHue("rule", "8", "update", {
      conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1002" }],
      actions: [{ address: "/lights/1/state", method: "PUT", body: { bri: 180, transitiontime: 4 } }],
    });
    expect(result.kind).toBe("success");
    expect(writes).toEqual([{
      conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1002" }],
      actions: [{ address: "/lights/1/state", method: "PUT", body: { bri: 180, transitiontime: 4 } }],
    }]);
  });

  test("known light uses absolute opposite state and refreshes", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const service = new ApplicationService({ hue: { snapshot: async () => emptySnapshot(), setLightState: async (_id, value) => { calls.push(value); } }, stateStore: new DeviceStateStore() });
    service.stateStore.setKnown({ kind: "light", id: "1" }, { state: { on: false } });
    expect((await service.performPrimary({ kind: "light", id: "1" })).kind).toBe("success");
    expect(calls).toEqual([{ on: true }]);
  });

  test("indeterminate group uses absolute On", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const service = new ApplicationService({ hue: { snapshot: async () => emptySnapshot(), setGroupAction: async (_id, value) => { calls.push(value); } }, stateStore: new DeviceStateStore() });
    service.stateStore.setKnown({ kind: "group", id: "1" }, { state: { any_on: true, all_on: false } });
    expect((await service.performPrimary({ kind: "group", id: "1" })).kind).toBe("success");
    expect(calls).toEqual([{ on: true }]);
  });

  test("isolates plug failure from another endpoint", async () => {
    const storage = new Store();
    const configStore = new ConfigStore(storage);
    const endpoints: PlugEndpoint[] = [
      { id: "bad", ipv4: "192.168.1.10", port: 9999 },
      { id: "good", ipv4: "192.168.1.11", port: 9999 },
    ];
    const config: AppConfig = { bridge: {}, plugs: endpoints, favorites: [], settings: {} };
    await configStore.save(config);
    const service = new ApplicationService({ configStore, plugs: {
      getSysInfo: async (endpoint) => { if (endpoint.id === "bad") throw Object.assign(new Error(), { category: "NetworkUnavailable" }); return { relayState: false }; },
      getPower: async () => false,
      setPower: async () => undefined,
    } });
    await service.refreshConfiguredPlugs();
    expect(service.stateStore.get({ kind: "plug", plugEndpointId: "good" })?.state.status).toBe("known");
    expect(service.stateStore.get({ kind: "plug", plugEndpointId: "bad" })?.state.status).toBe("unknown");
  });
});
