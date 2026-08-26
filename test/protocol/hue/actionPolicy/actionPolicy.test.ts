import { automationCanBeEnabled, validateImmediateAction, validateStructuredScheduleCommand } from "../../../../src/protocol/hue/HueActionPolicy";

describe("Hue immediate action policy", () => {
  test("allows structured resource writes and rejects administration/delete", () => {
    expect(validateImmediateAction("PUT", "/api/<redacted>/lights/1/state", { on: true }).allowed).toBe(true);
    expect(validateImmediateAction("PUT", "/api/<redacted>/config", { name: "bad" }).allowed).toBe(false);
    expect(validateImmediateAction("DELETE", "/api/<redacted>/lights/1").allowed).toBe(false);
  });

  test("existing dangerous automation is not enableable", () => {
    const decision = automationCanBeEnabled([{ address: "/api/<redacted>/config", method: "PUT", body: {} }]);
    expect(decision.allowed).toBe(false);
  });

  test("maps structured Scene schedule activation to the safe group-0 action endpoint", () => {
    expect(validateStructuredScheduleCommand({ resourceKind: "scene", resourceId: "9", subpath: "action", method: "PUT", body: { scene: "9" } }).allowed).toBe(true);
  });

  test("allows Sensor configuration schedule commands but still rejects bridge configuration", () => {
    expect(validateStructuredScheduleCommand({ resourceKind: "sensor", resourceId: "4", subpath: "config", method: "PUT", body: { on: false } }).allowed).toBe(true);
    expect(validateImmediateAction("PUT", "/api/<redacted>/config", { name: "bridge" }).allowed).toBe(false);
    expect(validateImmediateAction("PUT", "/api/<redacted>/sensors/4/config", { on: false }).allowed).toBe(true);
  });
});
