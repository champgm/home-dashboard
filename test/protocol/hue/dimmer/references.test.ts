import {
  parseHueResourceReference,
  parseResourceLinkReference,
  parseRuleActionReference,
  parseRuleConditionReference,
  parseScheduleCommandReference,
} from "../../../../src/protocol/hue/dimmer";

describe("dimmer exact Hue reference parsing", () => {
  test("parses authenticated Sensor condition paths without retaining the API user", () => {
    const result = parseRuleConditionReference({
      address: "/api/SECRET_API_USER/sensors/%34/state/buttonevent",
      operator: "eq",
      value: "1002",
    });

    expect(result).toMatchObject({ status: "recognized", kind: "sensor", id: "4", field: "buttonevent" });
    expect(JSON.stringify(result)).not.toContain("SECRET_API_USER");
    expect((result as { path: string }).path).toBe("/api/<redacted>/sensors/%34/state/buttonevent");
  });

  test("parses Light, Group, and Scene activation action forms", () => {
    expect(parseRuleActionReference({ address: "/lights/%31/state", method: "PUT", body: { on: true } })).toMatchObject({ kind: "light", id: "1", endpoint: "state" });
    expect(parseRuleActionReference({ address: "/groups/2/action", method: "PUT", body: { bri: 120 } })).toMatchObject({ kind: "group", id: "2", endpoint: "action" });
    expect(parseRuleActionReference({ address: "/api/u/groups/0/action", method: "PUT", body: { scene: "7" } })).toMatchObject({ kind: "scene", id: "7" });
    expect(parseRuleActionReference({ address: "/groups/2/action", method: "PUT", body: { scene: "scene-group" } })).toMatchObject({ kind: "scene", id: "scene-group" });
  });

  test("parses address and structured Schedule command forms", () => {
    expect(parseScheduleCommandReference({
      address: "/api/SECRET/sensors/4/config",
      method: "PUT",
      body: { on: false },
    })).toMatchObject({ kind: "sensor", id: "4", endpoint: "config" });
    expect(parseScheduleCommandReference({
      method: "PUT",
      resourceKind: "scene",
      resourceId: "8",
      subpath: "action",
      body: { scene: "8" },
      authorizationCredential: "SECRET",
    })).toMatchObject({ status: "recognized", kind: "scene", id: "8" });
    expect(JSON.stringify(parseScheduleCommandReference({ authorizationCredential: "SECRET", resourceKind: "scene", resourceId: "8", subpath: "action" }))).not.toContain("SECRET");
  });

  test("parses Resource Link roots and rejects trailing subresources", () => {
    expect(parseResourceLinkReference("/resourcelinks/9")).toMatchObject({ kind: "resourcelink", id: "9" });
    expect(parseResourceLinkReference("/sensors/4")).toMatchObject({ kind: "sensor", id: "4" });
    expect(parseResourceLinkReference("/sensors/4/state/buttonevent")).toMatchObject({ status: "unsupported" });
  });

  test("retains malformed paths as explicit inspectable results", () => {
    const result = parseHueResourceReference("/api/SECRET/sensors/4/state/buttonevent/extra");
    expect(result).toMatchObject({ status: "malformed", ref: { kind: "sensor", id: "4" } });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(parseHueResourceReference("sensors/4/state/buttonevent")).toMatchObject({ status: "malformed" });
    expect(parseHueResourceReference("/sensors//4/state/buttonevent")).toMatchObject({ status: "malformed" });
    expect(parseHueResourceReference("/sensors/4%2F5/state/buttonevent")).toMatchObject({ status: "malformed" });
  });

  test("rejects encoded-slash or mismatched IDs in structured Schedule commands", () => {
    expect(parseScheduleCommandReference({ resourceKind: "sensor", resourceId: "4%2F5", subpath: "config", method: "PUT" })).toMatchObject({ status: "malformed" });
    expect(parseScheduleCommandReference({ resourceKind: "scene", resourceId: "7", subpath: "action", body: { scene: "8" } })).toMatchObject({ status: "unsupported" });
  });
});
