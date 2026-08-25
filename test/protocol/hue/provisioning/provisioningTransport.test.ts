import { HueHttpClient, HueHttpResponse } from "../../../../src/protocol/hue/httpTransport";
import { HueResponseError, HueV1Adapter } from "../../../../src/protocol/hue/HueV1Adapter";

interface RequestRecord {
  readonly url: string;
  readonly init: RequestInit;
}

function response(payload: unknown, status = 200): HueHttpResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => payload,
  };
}

class FakeHueHttpClient implements HueHttpClient {
  readonly requests: RequestRecord[] = [];
  private readonly responses: HueHttpResponse[];

  constructor(...responses: HueHttpResponse[]) {
    this.responses = responses;
  }

  async request(url: string, init: RequestInit): Promise<HueHttpResponse> {
    this.requests.push({ url, init });
    const next = this.responses.shift();
    if (!next) throw new Error("No fake Hue response configured.");
    return next;
  }
}

describe("Hue V1 link-button provisioning transport", () => {
  test("uses the unauthenticated API root with the create-user body", async () => {
    const client = new FakeHueHttpClient(response([{ success: { username: "generated-user" } }]));
    const adapter = new HueV1Adapter({ bridgeIpv4: "192.168.1.2", httpClient: client });

    await expect(adapter.provision()).resolves.toBe("generated-user");

    expect(client.requests).toHaveLength(1);
    expect(client.requests[0].url).toBe("http://192.168.1.2/api");
    expect(client.requests[0].url).not.toContain("/api/config");
    expect(client.requests[0].init.method).toBe("POST");
    expect(JSON.parse(String(client.requests[0].init.body))).toEqual({ devicetype: "home-dashboard" });
  });

  test("preserves Hue link-button-not-pressed as a protocol rejection", async () => {
    const client = new FakeHueHttpClient(response([{
      error: { type: 101, description: "link button not pressed" },
    }]));
    const adapter = new HueV1Adapter({ bridgeIpv4: "192.168.1.2", httpClient: client });

    const provisioning = adapter.provision();
    await expect(provisioning).rejects.toMatchObject({
      responseKind: "definite_failure",
      category: "ProtocolRejected",
    });
    await expect(provisioning).rejects.toThrow("link button not pressed");
  });

  test("rejects a success envelope that does not contain a username", async () => {
    const client = new FakeHueHttpClient(response([{ success: { message: "created" } }]));
    const adapter = new HueV1Adapter({ bridgeIpv4: "192.168.1.2", httpClient: client });

    const provisioning = adapter.provision();
    await expect(provisioning).rejects.toBeInstanceOf(HueResponseError);
    await expect(provisioning).rejects.toThrow("did not create a local API user");
  });

  test("rejects malformed provisioning envelopes instead of treating them as success", async () => {
    const client = new FakeHueHttpClient(response({ unexpected: true }));
    const adapter = new HueV1Adapter({ bridgeIpv4: "192.168.1.2", httpClient: client });

    await expect(adapter.provision()).rejects.toBeInstanceOf(HueResponseError);
  });

  test("reads a complete snapshot from the authenticated aggregate API root", async () => {
    const aggregate = {
      lights: { "1": { name: "Kitchen" }, "2": { name: "Hall" } },
      groups: { "1": { name: "Downstairs" } },
      scenes: {},
      sensors: {},
      rules: {},
      schedules: {},
      resourcelinks: {},
      config: { bridgeid: "BRIDGE-1" },
    };
    const client = new FakeHueHttpClient(response(aggregate));
    const adapter = new HueV1Adapter({
      bridgeIpv4: "192.168.1.2",
      credential: "synthetic-credential",
      httpClient: client,
    });

    await expect(adapter.snapshot()).resolves.toMatchObject({
      lights: aggregate.lights,
      groups: aggregate.groups,
      config: aggregate.config,
    });
    expect(client.requests).toHaveLength(1);
    expect(client.requests[0].url).toBe("http://192.168.1.2/api/synthetic-credential");
    expect(client.requests[0].init.method).toBe("GET");
  });
});
