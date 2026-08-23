import { automationCanBeEnabled, validateImmediateAction } from "../../../../src/protocol/hue/HueActionPolicy";

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
});
