import { ApplicationService } from "../../../../src/app/ApplicationService";
import { DeviceStateStore } from "../../../../src/app/DeviceStateStore";
import { HueSnapshot } from "../../../../src/app/types";
import { buildDimmerRuleAction } from "../../../../src/protocol/hue/dimmer/actions";
import { buildEditorModel } from "../../../../src/protocol/hue/dimmer/projector";
import { findDimmerEvent, getDimmerModelCatalog } from "../../../../src/protocol/hue/dimmer/modelCatalog";
import rwl020FixtureData from "../../../fixtures/characterization/hue.household-rwl020.json";
import rwl020SimpleMissingTargetFixtureData from "../../../fixtures/characterization/hue.household-rwl020-simple-missing-target.json";
import zgpFixtureData from "../../../fixtures/characterization/hue.household-zgpswitch.json";

const rwl020Fixture = rwl020FixtureData as HueSnapshot;
const rwl020SimpleMissingTargetFixture = rwl020SimpleMissingTargetFixtureData as HueSnapshot;
const zgpFixture = zgpFixtureData as HueSnapshot;

test("production catalog contains only the two physically characterized household switch models", () => {
  const catalog = getDimmerModelCatalog();
  expect(catalog.models.map((entry) => entry.id)).toEqual(["signify-rwl020", "signify-zgpswitch"]);

  const rwl020 = catalog.models[0];
  expect(findDimmerEvent(rwl020, 1000)).toMatchObject({ control: { label: "On button" }, gesture: { label: "Initial press" } });
  expect(findDimmerEvent(rwl020, 2001)).toMatchObject({ control: { label: "Brighter button" }, gesture: { label: "Held" } });
  expect(findDimmerEvent(rwl020, 3003)).toMatchObject({ control: { label: "Dimmer button" }, gesture: { label: "Released after hold" } });
  expect(findDimmerEvent(rwl020, 4002)).toMatchObject({ control: { label: "Off button" }, gesture: { label: "Short release" } });

  const zgp = catalog.models[1];
  expect([34, 16, 17, 18].map((event) => findDimmerEvent(zgp, event)?.control.label)).toEqual([
    "Large main button", "Button 2", "Button 3", "Button 4",
  ]);
});

test("projects the household RWL020 fixture with exact helpers and direct editable bindings", () => {
  const model = buildEditorModel({ kind: "sensor", id: "12" }, rwl020Fixture);
  expect(model).toMatchObject({ recognized: true, catalogId: "signify-rwl020", modelLabel: "Hue dimmer switch" });
  expect(model.advanced.sensorIds).toEqual(["12"]);
  expect(model.advanced.helperSensorIds).toContain("13");
  expect(model.advanced.resourceLinkIds).toEqual(["57067"]);

  const rule = (id: string) => model.advanced.bindings.find((binding) => binding.advanced.ruleId === id);
  expect(rule("21")).toMatchObject({ controlId: "on", event: 1000, classification: "editable_simple", editable: true, action: { kind: "on" } });
  expect(["22", "23", "24", "25"].map((id) => rule(id)?.action?.kind)).toEqual(["activate", "activate", "activate", "activate"]);
  expect(rule("26")).toMatchObject({ controlId: "off", event: 4000, classification: "editable_simple", action: { kind: "off" } });
  expect(rule("27")).toMatchObject({ controlId: "brighter", event: 2000, classification: "editable_simple", action: { kind: "brighten" } });
  expect(rule("28")).toMatchObject({ controlId: "brighter", event: 2001, classification: "editable_simple", action: { kind: "brighten" } });
  expect(rule("29")).toMatchObject({ controlId: "brighter", event: 2003, classification: "editable_simple", editable: true, action: { kind: "stop" } });
  expect(rule("30")).toMatchObject({ controlId: "dimmer", event: 3000, classification: "editable_simple", action: { kind: "dim" } });
  expect(rule("31")).toMatchObject({ controlId: "dimmer", event: 3001, classification: "editable_simple", action: { kind: "dim" } });
  expect(rule("32")).toMatchObject({ controlId: "dimmer", event: 3003, classification: "editable_simple", editable: true, action: { kind: "stop" } });

  expect(model.advanced.rawEvents).toEqual(expect.arrayContaining([1000, 2000, 2001, 2003, 3000, 3001, 3003, 4000]));
  expect(JSON.stringify(model)).not.toMatch(/00:17:88|Living Room/);
});

test("projects every deployed Hue Tap binding as one direct structured Rule edit", () => {
  const model = buildEditorModel({ kind: "sensor", id: "20" }, zgpFixture);
  expect(model).toMatchObject({ recognized: true, catalogId: "signify-zgpswitch", modelLabel: "Hue tap switch" });
  const buttonBindings = model.advanced.bindings.filter((binding) => binding.advanced.conditionIndex === 0);
  expect(buttonBindings).toHaveLength(4);
  expect(buttonBindings.every((binding) => binding.classification === "editable_simple" && binding.editable)).toBe(true);
  expect(buttonBindings.map((binding) => [binding.event, binding.controlLabel, binding.action?.kind])).toEqual([
    [34, "Large main button", "off"],
    [16, "Button 2", "activate"],
    [17, "Button 3", "activate"],
    [18, "Button 4", "activate"],
  ]);
});

test("projects the deployed one-action RWL020 form as an explicit missing-target repair", () => {
  const missingModel = buildEditorModel({ kind: "sensor", id: "21" }, rwl020SimpleMissingTargetFixture);
  const missingRule = (id: string) => missingModel.advanced.bindings.find((binding) => binding.advanced.ruleId === id);
  expect(missingRule("76")).toMatchObject({ controlId: "on", classification: "missing_target", editable: true, action: { kind: "on" } });
  expect(missingRule("77")).toMatchObject({ controlId: "off", classification: "missing_target", editable: true, action: { kind: "off" } });
  expect(missingRule("75")).toMatchObject({ controlId: "brighter", classification: "missing_target", editable: true, action: { kind: "brighten" } });
  expect(missingRule("73")).toMatchObject({ controlId: "brighter", classification: "missing_target", editable: true, action: { kind: "stop" } });
  expect(missingRule("70")).toMatchObject({ controlId: "dimmer", classification: "missing_target", editable: true, action: { kind: "stop" } });

  const withOriginalGroup: HueSnapshot = {
    ...rwl020SimpleMissingTargetFixture,
    groups: { "7": { name: "Fixture restored group" } },
  };
  const restoredModel = buildEditorModel({ kind: "sensor", id: "21" }, withOriginalGroup);
  const restoredRule = (id: string) => restoredModel.advanced.bindings.find((binding) => binding.advanced.ruleId === id);
  expect(restoredRule("76")).toMatchObject({ classification: "editable_simple", editable: true });
  expect(restoredRule("77")).toMatchObject({ classification: "editable_simple", editable: true });
});

test("repairs a deployed RWL020 brightness-stop target without changing bri_inc zero", async () => {
  const repairSnapshot: HueSnapshot = {
    ...rwl020SimpleMissingTargetFixture,
    groups: { "3": { name: "Fixture replacement group" } },
  };
  const model = buildEditorModel({ kind: "sensor", id: "21" }, repairSnapshot);
  const binding = model.advanced.bindings.find((candidate) => candidate.advanced.ruleId === "73");
  if (!binding?.simpleForm || binding.advanced.actionIndex === undefined || binding.advanced.conditionIndex === undefined) {
    throw new Error("Expected fixture Rule 73 to be a repairable brightness-stop binding.");
  }
  const action = buildDimmerRuleAction({ kind: "stop", target: { kind: "group", id: "3" }, fields: { bri_inc: 0 }, form: binding.simpleForm });
  const mutate = jest.fn(async () => undefined);
  const service = new ApplicationService({ hue: { snapshot: async () => repairSnapshot, mutate }, stateStore: new DeviceStateStore() });
  seedSnapshot(service, repairSnapshot);

  const result = await service.saveSimpleBinding({
    sensorId: "21",
    catalogId: model.catalogId!,
    controlId: binding.controlId,
    gestureId: binding.gestureId,
    event: binding.event!,
    ruleId: binding.advanced.ruleId!,
    conditionIndex: binding.advanced.conditionIndex,
    actionIndex: binding.advanced.actionIndex,
    action,
    characterization: binding.simpleForm,
    deviceKey: model.deviceKey,
  });

  expect(result.kind).toBe("success");
  expect(mutate).toHaveBeenCalledWith("rule", "73", "update", {
    actions: [{ address: "/groups/3/action", method: "PUT", body: { bri_inc: 0 } }],
  });
});

test("repairs a deployed RWL020 relative-brightness target regardless of JSON member order", async () => {
  const repairSnapshot: HueSnapshot = {
    ...rwl020SimpleMissingTargetFixture,
    groups: { "3": { name: "Fixture replacement group" } },
  };
  const model = buildEditorModel({ kind: "sensor", id: "21" }, repairSnapshot);
  const binding = model.advanced.bindings.find((candidate) => candidate.advanced.ruleId === "75");
  if (!binding?.simpleForm || binding.advanced.actionIndex === undefined || binding.advanced.conditionIndex === undefined || !binding.action) {
    throw new Error("Expected fixture Rule 75 to be a repairable relative-brightness binding.");
  }
  const action = buildDimmerRuleAction({ kind: "brighten", target: { kind: "group", id: "3" }, fields: binding.action.fields, form: binding.simpleForm });
  const mutate = jest.fn(async () => undefined);
  const service = new ApplicationService({ hue: { snapshot: async () => repairSnapshot, mutate }, stateStore: new DeviceStateStore() });
  seedSnapshot(service, repairSnapshot);

  const result = await service.saveSimpleBinding({
    sensorId: "21",
    catalogId: model.catalogId!,
    controlId: binding.controlId,
    gestureId: binding.gestureId,
    event: binding.event!,
    ruleId: binding.advanced.ruleId!,
    conditionIndex: binding.advanced.conditionIndex,
    actionIndex: binding.advanced.actionIndex,
    action,
    characterization: binding.simpleForm,
    deviceKey: model.deviceKey,
  });

  expect(result.kind).toBe("success");
  expect(mutate).toHaveBeenCalledWith("rule", "75", "update", {
    actions: [{ address: "/groups/3/action", method: "PUT", body: { bri_inc: 30, transitiontime: 9 } }],
  });
});

test("production recognition fails closed when exact characterized capabilities are absent or changed", () => {
  const sensor = rwl020Fixture.sensors["12"] as Record<string, unknown>;
  const withoutCapabilities: HueSnapshot = {
    ...rwl020Fixture,
    sensors: { ...rwl020Fixture.sensors, "12": { ...sensor, capabilities: undefined } },
  };
  expect(buildEditorModel({ kind: "sensor", id: "12" }, withoutCapabilities).recognized).toBe(false);

  const capabilities = sensor.capabilities as { inputs: Array<{ events: Array<{ buttonevent: number; eventtype: string }> }> };
  const changedCapabilities: HueSnapshot = {
    ...rwl020Fixture,
    sensors: {
      ...rwl020Fixture.sensors,
      "12": {
        ...sensor,
        capabilities: {
          ...capabilities,
          inputs: capabilities.inputs.map((input, index) => index === 0
            ? { ...input, events: input.events.map((event, eventIndex) => eventIndex === 0 ? { ...event, buttonevent: 9999 } : event) }
            : input),
        },
      },
    },
  };
  expect(buildEditorModel({ kind: "sensor", id: "12" }, changedCapabilities).recognized).toBe(false);
});

test("a household Scene-cycle slot save updates one Rule and preserves its helper action", async () => {
  const model = buildEditorModel({ kind: "sensor", id: "12" }, rwl020Fixture);
  const binding = model.advanced.bindings.find((candidate) => candidate.advanced.ruleId === "22");
  if (!binding?.simpleForm || binding.advanced.actionIndex === undefined || binding.advanced.conditionIndex === undefined) {
    throw new Error("Expected fixture Rule 22 to be a characterized simple binding.");
  }
  const targetId = "U3S3Vi0bU6RVbt8";
  const target = rwl020Fixture.scenes[targetId] as { type?: string; group?: string };
  const action = buildDimmerRuleAction({
    kind: "activate",
    target: { kind: "scene", id: targetId },
    targetDetails: target,
    form: binding.simpleForm,
  });
  const mutate = jest.fn(async () => undefined);
  const snapshot = jest.fn(async () => rwl020Fixture);
  const service = new ApplicationService({ hue: { snapshot, mutate }, stateStore: new DeviceStateStore() });
  seedSnapshot(service, rwl020Fixture);

  const result = await service.saveSimpleBinding({
    sensorId: "12",
    catalogId: model.catalogId!,
    controlId: binding.controlId,
    gestureId: binding.gestureId,
    event: binding.event!,
    ruleId: binding.advanced.ruleId!,
    conditionIndex: binding.advanced.conditionIndex,
    actionIndex: binding.advanced.actionIndex,
    action,
    characterization: binding.simpleForm,
    deviceKey: model.deviceKey,
  });

  expect(result.diagnostic).toBeUndefined();
  expect(result).toMatchObject({ kind: "success" });
  const original = rwl020Fixture.rules["22"] as { actions: unknown[] };
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(mutate).toHaveBeenCalledWith("rule", "22", "update", {
    actions: [action, original.actions[1]],
  });
  expect(snapshot).toHaveBeenCalledTimes(1);
});

function seedSnapshot(service: ApplicationService, snapshot: HueSnapshot): void {
  const kinds = ["light", "group", "scene", "sensor", "rule", "schedule", "resourcelink"] as const;
  for (const kind of kinds) {
    const collectionName = kind === "resourcelink" ? "resourcelinks" : `${kind}s` as keyof HueSnapshot;
    const collection = snapshot[collectionName] as Record<string, unknown>;
    Object.entries(collection).forEach(([id, value]) => service.stateStore.setKnown({ kind, id }, value));
  }
}
