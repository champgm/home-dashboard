import {
  buildRuleActionFromTarget,
  buildRuleConditionFromSensor,
  buildScheduleCommandFromTarget,
  getHueSensorConfigFields,
  HUE_DOCUMENTED_RESOURCE_FIELDS,
  getHueResourceCatalog,
  isHueCatalogComplete,
  prepareHueMutationPayload,
  validateHueCatalogPayload,
} from "../../../../src/protocol/hue/catalog/resourceCatalog";
import { serializeScheduleTimePattern, validateScheduleTimePattern } from "../../../../src/protocol/hue/catalog/schedules";

describe("Hue V1 resource catalog", () => {
  test("declares every managed resource and writable/read-only field metadata", () => {
    expect(isHueCatalogComplete()).toBe(true);
    expect(Object.keys(getHueResourceCatalog()).sort()).toEqual(["group", "light", "resourcelink", "rule", "scene", "schedule", "sensor"]);
    expect(getHueResourceCatalog().light.fields.find((field) => field.path === "state.reachable")).toEqual(expect.objectContaining({ writable: false, update: false }));
    expect(getHueResourceCatalog().light.fields.find((field) => field.path === "state.bri")?.capability?.({ capabilities: { control: { bri: false } } })).toBe(false);
    expect(getHueResourceCatalog().sensor.fields.find((field) => field.path === "config.on")).toEqual(expect.objectContaining({ endpoint: "config", writable: true }));
    for (const [kind, paths] of Object.entries(HUE_DOCUMENTED_RESOURCE_FIELDS)) {
      const catalogPaths = getHueResourceCatalog()[kind as keyof typeof HUE_DOCUMENTED_RESOURCE_FIELDS].fields.map((field) => field.path);
      expect(paths.every((path) => catalogPaths.includes(path))).toBe(true);
    }
    expect(getHueSensorConfigFields("ZLLLightLevel").map((field) => field.path)).toEqual(["config.on", "config.tholddark", "config.tholdoffset"]);
  });

  test("rejects unknown, read-only, wrong-type, range, and wrong-endpoint writes", () => {
    expect(validateHueCatalogPayload("light", "update", { modelid: "new" }).allowed).toBe(false);
    expect(validateHueCatalogPayload("light", "update", { unsupported: true }).allowed).toBe(false);
    expect(validateHueCatalogPayload("light", "update", { state: { bri: 255 } }).allowed).toBe(false);
    expect(validateHueCatalogPayload("light", "update", { state: { bri: "100" } }).allowed).toBe(false);
    expect(validateHueCatalogPayload("light", "update", { state: { xy: [1.1, 0.2] } }).allowed).toBe(false);
    expect(validateHueCatalogPayload("sensor", "update", { config: { battery: 50 } }).allowed).toBe(false);
    expect(validateHueCatalogPayload("scene", "create", { lightstates: { "1": { on: true } } }).allowed).toBe(false);
    expect(validateHueCatalogPayload("group", "action", { on: true }).allowed).toBe(true);
    expect(validateHueCatalogPayload("rule", "update", { actions: [{ address: "/lights/1/state", method: "PUT", body: { on: true } }] }).allowed).toBe(true);
    expect(validateHueCatalogPayload("rule", "update", { actions: [{ address: "/lights/1/action", method: "PUT", body: { on: true } }] }).allowed).toBe(false);
    expect(validateHueCatalogPayload("sensor", "action", { on: true }).allowed).toBe(false);
    expect(validateHueCatalogPayload("schedule", "create", { name: "Sensor", description: "Disable sensor", timePattern: { kind: "at", localtime: "T07:00:00" }, command: { method: "PUT", resourceKind: "sensor", resourceId: "4", subpath: "config", body: { on: false } } }).allowed).toBe(true);
    expect(validateHueCatalogPayload("rule", "update", { conditions: [], actions: [] }).allowed).toBe(true);
  });

  test("rejects non-viable create payloads and accepts the supported minimum contracts", () => {
    expect(validateHueCatalogPayload("group", "create", {}).allowed).toBe(false);
    expect(validateHueCatalogPayload("scene", "create", {}).allowed).toBe(false);
    expect(validateHueCatalogPayload("sensor", "create", {}).allowed).toBe(false);
    expect(validateHueCatalogPayload("rule", "create", {}).allowed).toBe(false);
    expect(validateHueCatalogPayload("schedule", "create", {}).allowed).toBe(false);
    expect(validateHueCatalogPayload("resourcelink", "create", {}).allowed).toBe(false);
    expect(validateHueCatalogPayload("group", "create", { name: "Empty", lights: [] }).allowed).toBe(false);
    expect(validateHueCatalogPayload("scene", "create", { name: "Empty", type: "LightScene", lights: [] }).allowed).toBe(false);
    expect(validateHueCatalogPayload("group", "create", { name: "Room", lights: ["1"] }).allowed).toBe(true);
    expect(validateHueCatalogPayload("scene", "create", { name: "Evening", type: "LightScene", lights: ["1"] }).allowed).toBe(true);
    expect(validateHueCatalogPayload("sensor", "create", { name: "Dimmer", type: "ZLLSwitch", manufacturername: "Signify", modelid: "RWL", config: { on: true } }).allowed).toBe(true);
    expect(validateHueCatalogPayload("rule", "create", { name: "Rule", conditions: [{ address: "/sensors/1/state/buttonevent", operator: "eq", value: "100" }], actions: [{ address: "/lights/1/state", method: "PUT", body: { on: true } }] }).allowed).toBe(true);
    expect(validateHueCatalogPayload("schedule", "create", { name: "Morning", description: "Start", timePattern: { kind: "at", localtime: "T07:00:00" }, command: { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { on: true } } }).allowed).toBe(true);
    expect(validateHueCatalogPayload("resourcelink", "create", { class: "HomeDashboard", description: "Favorites", links: ["/lights/1"] }).allowed).toBe(true);
  });

  test("validates typed daily, weekly, timer, and randomized schedule boundaries", () => {
    expect(validateScheduleTimePattern({ kind: "recurring-daily", localtime: "T07:00:00", recurring: true }).allowed).toBe(true);
    expect(validateScheduleTimePattern({ kind: "recurring-weekly", localtime: "T07:00:00", weekdays: ["monday", "wednesday"], recurring: true }).allowed).toBe(true);
    expect(validateScheduleTimePattern({ kind: "recurring-weekly", localtime: "T07:00:00", weekdays: [], recurring: true }).allowed).toBe(false);
    expect(validateScheduleTimePattern({ kind: "timer", time: "PT23:59:59" }).allowed).toBe(true);
    expect(validateScheduleTimePattern({ kind: "timer", time: "PT00:05:00", recurring: true }).allowed).toBe(true);
    expect(validateScheduleTimePattern({ kind: "timer", time: "PT24:00:00" }).allowed).toBe(false);
    expect(validateScheduleTimePattern({ kind: "randomized", localtime: "T07:00:00", weekdays: ["monday"], randomSeconds: 300, recurring: true }).allowed).toBe(true);
    expect(validateScheduleTimePattern({ kind: "randomized", localtime: "T25:00:00", weekdays: ["monday"], randomSeconds: 0, recurring: true }).allowed).toBe(false);
    expect(serializeScheduleTimePattern({ kind: "recurring-daily", localtime: "T07:00:00", recurring: true })).toEqual({ localtime: "W127/T07:00:00", recurring: true });
    expect(serializeScheduleTimePattern({ kind: "recurring-weekly", localtime: "T07:00:00", weekdays: ["monday", "wednesday"], recurring: true })).toEqual({ localtime: "W080/T07:00:00", recurring: true });
    expect(serializeScheduleTimePattern({ kind: "randomized", localtime: "T07:00:00", weekdays: ["monday"], randomSeconds: 300, recurring: true })).toEqual({ localtime: "W064/T07:00:00A00:05:00", recurring: true });
    expect(serializeScheduleTimePattern({ kind: "timer", time: "PT00:05:00", recurring: true })).toEqual({ time: "R/PT00:05:00", recurring: false });
  });

  test("prepares nested changed fields while retaining falsy values", () => {
    expect(prepareHueMutationPayload("light", "update", { name: "Lamp", state: { on: true, bri: 100 } }, { name: "Lamp", state: { on: false, bri: 100 } })).toEqual({ allowed: true, payload: { state: { on: false } } });
    expect(prepareHueMutationPayload("group", "update", { name: "Room", action: { on: false } }, { name: "Room", action: { on: true } })).toEqual({ allowed: true, payload: { action: { on: true } } });
    expect(prepareHueMutationPayload("resourcelink", "update", { class: "A", description: "D", links: [] }, { class: "A", description: "D", links: [] })).toEqual({ allowed: true, payload: {} });
    expect(prepareHueMutationPayload("sensor", "config", { config: { on: true } }, { config: { on: false } })).toEqual({ allowed: true, payload: { config: { on: false } } });
  });

  test("builds structured dimmer rule and schedule targets without arbitrary paths", () => {
    expect(buildRuleConditionFromSensor("4", "state.buttonevent", "eq", "100")).toEqual({ address: "/sensors/4/state/buttonevent", operator: "eq", value: "100" });
    expect(buildRuleActionFromTarget("light", "1", "on")).toEqual({ address: "/lights/1/state", method: "PUT", body: { on: true } });
    expect(buildRuleActionFromTarget("group", "2", "off")).toEqual({ address: "/groups/2/action", method: "PUT", body: { on: false } });
    expect(buildRuleActionFromTarget("light", "1", "set", { bri: 180, transitiontime: 4 })).toEqual({ address: "/lights/1/state", method: "PUT", body: { bri: 180, transitiontime: 4 } });
    expect(buildScheduleCommandFromTarget("scene", "9", "activate")).toEqual({ method: "PUT", resourceKind: "scene", resourceId: "9", subpath: "action", body: { scene: "9" } });
    expect(() => buildRuleActionFromTarget("light", "arbitrary", "on")).toThrow();
  });

  test("redacts an explicit schedule command rebuild without rewriting an unchanged command", () => {
    const original = { command: { method: "PUT", resourceKind: "light", resourceId: "4", subpath: "state", body: { on: true } } };
    expect(prepareHueMutationPayload("schedule", "update", original, { command: original.command })).toEqual({ allowed: true, payload: {} });
    expect(prepareHueMutationPayload("schedule", "update", original, { command: { address: "/api/old-secret/lights/4/state", method: "PUT", body: { on: false } } })).toEqual({
      allowed: true,
      payload: { command: { address: "/api/<redacted>/lights/4/state", method: "PUT", body: { on: false } } },
    });
  });

  test("treats a parsed credential marker as metadata when comparing an unchanged Schedule command", () => {
    const original = {
      command: {
        method: "PUT",
        resourceKind: "light",
        resourceId: "4",
        subpath: "state",
        body: { bri: 180, transitiontime: 4 },
        authorizationCredential: "old-user",
      },
    };
    const unchangedEditorDraft = {
      command: {
        method: "PUT",
        resourceKind: "light",
        resourceId: "4",
        subpath: "state",
        body: { bri: 180, transitiontime: 4 },
      },
    };

    expect(prepareHueMutationPayload("schedule", "update", original, unchangedEditorDraft)).toEqual({ allowed: true, payload: {} });
  });

  test.each([
    ["an undeclared Light state field", { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { randomField: true } }],
    ["a read-only Sensor config field", { method: "PUT", resourceKind: "sensor", resourceId: "4", subpath: "config", body: { battery: 0 } }],
    ["an unsupported POST method", { method: "POST", resourceKind: "light", resourceId: "1", subpath: "state", body: { on: true } }],
  ])("rejects structured Schedule commands containing %s at the catalog boundary", (_case, command) => {
    expect(validateHueCatalogPayload("schedule", "update", { command }).allowed).toBe(false);
  });

  test("rejects changed-field preparation without a known original", () => {
    expect(prepareHueMutationPayload("group", "update", undefined, { name: "Room", lights: ["1"] })).toEqual({
      allowed: false,
      reason: "Changed-field-only updates require a known original Hue resource.",
    });
  });
});
