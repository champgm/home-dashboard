import { strict as assert } from "node:assert";
import { test } from "node:test";
import { anonymizeDimmerCapture, sanitizeHueSnapshot, selectDimmerCapture } from "../../scripts/capture-hue-dimmer-fixture.mjs";

const snapshot = {
  lights: { "1": { name: "Lamp" }, "2": { name: "Linked lamp" }, "3": { name: "Scheduled lamp" }, "99": { name: "Unrelated" } },
  groups: {}, scenes: {},
  sensors: {
    "4": { name: "Wall switch", uniqueid: "physical-a", state: { buttonevent: 1000 } },
    "5": { name: "Wall switch helper", uniqueid: "physical-a" },
    "6": { name: "Linked helper", uniqueid: "different-helper" },
    "9": { name: "Other", uniqueid: "physical-z" },
  },
  rules: {
    "10": { owner: "LIVE_USER", conditions: [{ address: "/api/LIVE_USER/sensors/4/state/buttonevent" }], actions: [{ address: "/lights/1/state" }] },
    "11": { conditions: [{ address: "/sensors/6/state/presence" }], actions: [{ address: "/lights/2/state" }] },
    "99": { name: "Text says /sensors/4 but is not a condition", conditions: [{ address: "/sensors/9/state/presence" }], actions: [] },
  },
  schedules: { "21": { command: { address: "/lights/3/state" } } },
  resourcelinks: { "30": { links: ["/sensors/4", "/rules/11", "/schedules/21"] } },
};

test("selects exact dimmer-related resources and traverses linked Rule/Schedule payloads", () => {
  const selected = selectDimmerCapture(snapshot, "4");
  assert.deepEqual(Object.keys(selected.sensors), ["4", "5", "6"]);
  assert.deepEqual(Object.keys(selected.rules), ["10", "11"]);
  assert.deepEqual(Object.keys(selected.schedules), ["21"]);
  assert.deepEqual(Object.keys(selected.lights), ["1", "2", "3"]);
  assert.deepEqual(Object.keys(selected.resourcelinks), ["30"]);
  assert.equal(selected.rules["99"], undefined);
});

test("redacts owner, authorization path, and credential fields without logging them", () => {
  const sanitized = sanitizeHueSnapshot(snapshot, "4");
  const serialized = JSON.stringify(sanitized);
  assert.equal(serialized.includes("LIVE_USER"), false);
  assert.equal(serialized.includes("<redacted>"), true);
  assert.equal(serialized.includes("/api/<redacted>/sensors/4"), true);
});

test("traverses nested Resource Links and retains every exact linked helper/resource", () => {
  const nested = {
    ...snapshot,
    resourcelinks: {
      "30": { links: ["/sensors/4", "/resourcelinks/31"] },
      "31": { links: ["/sensors/6", "/lights/2"] },
    },
  };
  const selected = selectDimmerCapture(nested, "4");
  assert.deepEqual(Object.keys(selected.resourcelinks), ["30", "31"]);
  assert.equal(selected.sensors["6"].name, "Linked helper");
  assert.equal(selected.lights["2"].name, "Linked lamp");
});

test("retains Scene targets activated through a nonzero Group action", () => {
  const withGroupScene = {
    ...snapshot,
    scenes: { "scene-a": { name: "Household scene", type: "GroupScene", group: "1" } },
    rules: {
      ...snapshot.rules,
      "10": {
        ...snapshot.rules["10"],
        actions: [{ address: "/groups/1/action", method: "PUT", body: { scene: "scene-a" } }],
      },
    },
  };
  assert.equal(selectDimmerCapture(withGroupScene, "4").scenes["scene-a"].name, "Household scene");
});

test("minimizes and anonymizes household metadata without changing exact references", () => {
  const source = {
    ...snapshot,
    sensors: {
      ...snapshot.sensors,
      "4": { ...snapshot.sensors["4"], name: "Private room switch", uniqueid: "00:11:22:33:44:55:66:77-02-fc00", lastannounced: "private" },
    },
    rules: {
      ...snapshot.rules,
      "10": { ...snapshot.rules["10"], name: "Private room rule", created: "private timestamp" },
    },
  };
  const sanitized = sanitizeHueSnapshot(source, "4");
  const anonymized = anonymizeDimmerCapture(sanitized);
  assert.equal(anonymized.sensors["4"].name, "Fixture sensor 1");
  assert.equal(anonymized.sensors["4"].uniqueid, "fixture-device-1");
  assert.equal(anonymized.sensors["4"].lastannounced, undefined);
  assert.equal(anonymized.rules["10"].name, "Fixture rule 1");
  assert.equal(anonymized.rules["10"].created, undefined);
  assert.equal(anonymized.rules["10"].conditions[0].address, "/api/<redacted>/sensors/4/state/buttonevent");
});
