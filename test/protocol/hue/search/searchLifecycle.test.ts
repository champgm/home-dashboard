import { HueV1Adapter } from "../../../../src/protocol/hue/HueV1Adapter";
import { HueHttpClient, HueHttpResponse } from "../../../../src/protocol/hue/httpTransport";
import { parseSearchStatus } from "../../../../src/protocol/hue/search";

function response(value: unknown): HueHttpResponse { return { status: 200, ok: true, json: async () => value }; }

describe("Hue bridge-owned search lifecycle", () => {
  test("checks /new before starting an inactive search", async () => {
    const urls: string[] = [];
    const client: HueHttpClient = { request: async (url) => { urls.push(url); return response(url.endsWith("/lights/new") ? {} : [{ success: { id: "search" } }]); } };
    const result = await new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "safe", httpClient: client }).startSearch("lights");
    expect(result.started).toBe(true);
    expect(urls).toEqual(["http://192.168.1.2/api/safe/lights/new", "http://192.168.1.2/api/safe/lights"]);
  });

  test("does not POST when the bridge reports active or recent search state", async () => {
    const urls: string[] = [];
    const client: HueHttpClient = { request: async (url) => { urls.push(url); return response({ active: true, lastscan: "2026-08-25T12:00:00" }); } };
    const result = await new HueV1Adapter({ bridgeIpv4: "192.168.1.2", credential: "safe", httpClient: client }).startSearch("sensors");
    expect(result.started).toBe(false);
    expect(urls).toEqual(["http://192.168.1.2/api/safe/sensors/new"]);
  });

  test("treats the V1 lastscan active marker as an active bridge search", () => {
    const status = parseSearchStatus("lights", { lastscan: "active" });
    expect(status.active).toBe(true);
    expect(status.recent).toBe(true);
  });
});
