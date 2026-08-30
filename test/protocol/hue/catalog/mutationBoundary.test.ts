import { HueV1Adapter, HueResponseError } from "../../../../src/protocol/hue/HueV1Adapter";
import { HueHttpClient, HueHttpResponse } from "../../../../src/protocol/hue/httpTransport";

function response(value: unknown): HueHttpResponse {
  return { status: 200, ok: true, json: async () => value };
}

describe("Hue catalog mutation boundary", () => {
  test("routes Sensor configuration to /config and strips the UI wrapper", async () => {
    let request: { url: string; body?: string } | undefined;
    const client: HueHttpClient = { request: async (url, init) => { request = { url, body: init.body as string }; return response([{ success: { id: "1" } }]); } };
    await new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "safe-user", httpClient: client }).mutate("sensor", "1", "config", { config: { on: false } });
    expect(request?.url).toBe("http://192.168.1.2/api/safe-user/sensors/1/config");
    expect(JSON.parse(request?.body || "{}")).toEqual({ on: false });
  });

  test("rejects read-only and undeclared fields before network I/O", async () => {
    let calls = 0;
    const client: HueHttpClient = { request: async () => { calls += 1; return response([]); } };
    const adapter = new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "safe-user", httpClient: client });
    await expect(adapter.mutate("light", "1", "update", { state: { reachable: false } })).rejects.toBeInstanceOf(HueResponseError);
    await expect(adapter.mutate("group", "1", "update", { randomField: true })).rejects.toBeInstanceOf(HueResponseError);
    expect(calls).toBe(0);
  });

  test("routes per-light Scene state to the documented lightstates endpoint", async () => {
    let url = "";
    const client: HueHttpClient = { request: async (nextUrl) => { url = nextUrl; return response([{ success: { updated: true } }]); } };
    await new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "safe-user", httpClient: client }).setSceneLightState("3", "7", { on: true, bri: 120 });
    expect(url).toBe("http://192.168.1.2/api/safe-user/scenes/3/lightstates/7");
  });

  test("creates a Room Group with its required type and class pair", async () => {
    let request: { url: string; body: Record<string, unknown> } | undefined;
    const client: HueHttpClient = { request: async (url, init) => {
      request = { url, body: JSON.parse(String(init.body)) as Record<string, unknown> };
      return response([{ success: { id: "6" } }]);
    } };
    await new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "safe-user", httpClient: client }).create("group", {
      name: "Guest Room",
      lights: ["18", "19", "31"],
      type: "Room",
      class: "Guest room",
    });
    expect(request).toEqual({
      url: "http://192.168.1.2/api/safe-user/groups",
      body: { name: "Guest Room", lights: ["18", "19", "31"], type: "Room", class: "Guest room" },
    });
  });

  test("splits Light state and Group action updates onto their V1 subpaths", async () => {
    const requests: Array<{ url: string; body: unknown }> = [];
    const client: HueHttpClient = { request: async (url, init) => {
      requests.push({ url, body: JSON.parse(String(init.body)) });
      return response([{ success: { updated: true } }]);
    } };
    const adapter = new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "safe-user", httpClient: client });
    await adapter.mutate("light", "1", "update", { name: "Kitchen", state: { on: false, bri: 120 } });
    await adapter.mutate("group", "2", "update", { name: "Room", action: { on: true } });
    expect(requests.map((request) => request.url)).toEqual([
      "http://192.168.1.2/api/safe-user/lights/1",
      "http://192.168.1.2/api/safe-user/lights/1/state",
      "http://192.168.1.2/api/safe-user/groups/2",
      "http://192.168.1.2/api/safe-user/groups/2/action",
    ]);
    expect(requests[1].body).toEqual({ on: false, bri: 120 });
    expect(requests[3].body).toEqual({ on: true });
  });

  test("serializes changed Rule actions as bridge-local paths without a phone credential", async () => {
    let body: Record<string, unknown> | undefined;
    const client: HueHttpClient = { request: async (_url, init) => { body = JSON.parse(String(init.body)); return response([{ success: { updated: true } }]); } };
    await new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "current-user", httpClient: client }).mutate("rule", "8", "update", {
      actions: [{ address: "/api/old-user/lights/1/state", method: "PUT", body: { on: true } }],
    });
    expect(body).toEqual({ actions: [{ address: "/lights/1/state", method: "PUT", body: { on: true } }] });
  });

  test("preserves catalog-approved brightness and transition fields in a repaired Rule action", async () => {
    let body: Record<string, unknown> | undefined;
    const client: HueHttpClient = { request: async (_url, init) => { body = JSON.parse(String(init.body)); return response([{ success: { updated: true } }]); } };
    await new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "current-user", httpClient: client }).mutate("rule", "8", "update", {
      actions: [{ address: "/lights/1/state", method: "PUT", body: { bri: 180, transitiontime: 4 } }],
    });
    expect(body).toEqual({ actions: [{ address: "/lights/1/state", method: "PUT", body: { bri: 180, transitiontime: 4 } }] });
  });

  test("serializes a new Schedule time pattern before POST", async () => {
    let request: { url: string; body: Record<string, unknown> } | undefined;
    const client: HueHttpClient = { request: async (url, init) => {
      request = { url, body: JSON.parse(String(init.body)) as Record<string, unknown> };
      return response([{ success: { id: "new-schedule" } }]);
    } };
    await new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "current-user", httpClient: client }).create("schedule", {
      name: "Morning",
      description: "Start day",
      timePattern: { kind: "at", localtime: "T07:00:00" },
      command: { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { on: true } },
    });
    expect(request?.url).toBe("http://192.168.1.2/api/current-user/schedules");
    expect(request?.body).toEqual({
      name: "Morning",
      description: "Start day",
      localtime: "T07:00:00",
      recurring: false,
      command: { address: "/api/current-user/lights/1/state", method: "PUT", body: { on: true } },
    });
    expect(request?.body).not.toHaveProperty("timePattern");
  });

  test("serializes a Sensor schedule command to the allowed Sensor config endpoint", async () => {
    let request: { body: Record<string, unknown> } | undefined;
    const client: HueHttpClient = { request: async (_url, init) => {
      request = { body: JSON.parse(String(init.body)) as Record<string, unknown> };
      return response([{ success: { id: "sensor-schedule" } }]);
    } };
    await new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "current-user", httpClient: client }).create("schedule", {
      name: "Disable sensor",
      description: "Sensor config schedule",
      timePattern: { kind: "at", localtime: "T22:00:00" },
      command: { method: "PUT", resourceKind: "sensor", resourceId: "4", subpath: "config", body: { on: false } },
    });
    expect(request?.body.command).toEqual({ address: "/api/current-user/sensors/4/config", method: "PUT", body: { on: false } });
  });
});
