import { ApplicationService } from "../../../src/app/ApplicationService";
import { DeviceStateStore } from "../../../src/app/DeviceStateStore";
import { buildDimmerRuleAction } from "../../../src/protocol/hue/dimmer/actions";
import { HueSnapshot } from "../../../src/app/types";
import { DimmerBindingRecognitionInput, DimmerSimpleBindingForm } from "../../../src/protocol/hue/dimmer";

const snapshot: HueSnapshot = {
  lights: { "1": { name: "Lamp one" }, "2": { name: "Lamp two" } },
  groups: {}, scenes: {}, sensors: { "4": { type: "ZLLSwitch", modelid: "DIM-1", uniqueid: "physical-a" } }, schedules: {}, resourcelinks: {},
  rules: {
    "10": {
      name: "Keep this name",
      status: "disabled",
      conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1000" }],
      actions: [{ address: "/lights/1/state", method: "PUT", body: { on: true } }],
      owner: "another-client",
    },
  },
};

const characterization: DimmerSimpleBindingForm = {
  actionIndex: 0,
  actions: [
    { kind: "on", targetKinds: ["light"], fields: ["on"] },
    { kind: "off", targetKinds: ["light"], fields: ["on"] },
  ],
  matchesRule: ({ rule, conditionIndex }: DimmerBindingRecognitionInput) => rule.conditions.length === 1
    && rule.actions.length === 1
    && conditionIndex === 0,
};

const catalog = {
  models: [{
    id: "test-dimmer",
    label: "Test dimmer",
    modelIds: ["DIM-1"],
    sensorTypes: ["ZLLSwitch"],
    identityKey: (sensor: { uniqueid?: string }) => sensor.uniqueid,
    controls: [{
      id: "top",
      label: "Top button",
      gestures: [
        { id: "press", event: 1000, label: "Pressed", simpleForm: characterization },
        { id: "other", event: 1001, label: "Other", simpleForm: characterization },
      ],
    }],
  }],
};

function seedSnapshot(service: ApplicationService, value: HueSnapshot): void {
  (Object.entries(value.lights) as Array<[string, unknown]>).forEach(([id, resource]) => service.stateStore.setKnown({ kind: "light", id }, resource));
  (Object.entries(value.groups) as Array<[string, unknown]>).forEach(([id, resource]) => service.stateStore.setKnown({ kind: "group", id }, resource));
  (Object.entries(value.scenes) as Array<[string, unknown]>).forEach(([id, resource]) => service.stateStore.setKnown({ kind: "scene", id }, resource));
  (Object.entries(value.sensors) as Array<[string, unknown]>).forEach(([id, resource]) => service.stateStore.setKnown({ kind: "sensor", id }, resource));
  (Object.entries(value.rules) as Array<[string, unknown]>).forEach(([id, resource]) => service.stateStore.setKnown({ kind: "rule", id }, resource));
  (Object.entries(value.schedules) as Array<[string, unknown]>).forEach(([id, resource]) => service.stateStore.setKnown({ kind: "schedule", id }, resource));
  (Object.entries(value.resourcelinks) as Array<[string, unknown]>).forEach(([id, resource]) => service.stateStore.setKnown({ kind: "resourcelink", id }, resource));
}

const simpleIdentity = {
  sensorId: "4",
  catalogId: "test-dimmer",
  controlId: "top",
  gestureId: "press",
  event: 1000,
  deviceKey: "test-dimmer:physical-a",
};

test("simple dimmer save changes one existing Rule action and refreshes once", async () => {
  const mutate = jest.fn(async () => undefined);
  const snapshotRead = jest.fn(async () => snapshot);
  const service = new ApplicationService({ hue: { snapshot: snapshotRead, mutate }, stateStore: new DeviceStateStore(), dimmerCatalog: catalog });
  seedSnapshot(service, snapshot);
  const action = buildDimmerRuleAction({ kind: "off", target: { kind: "light", id: "2" } });

  const result = await service.saveSimpleBinding({ ...simpleIdentity, ruleId: "10", conditionIndex: 0, actionIndex: 0, action, characterization });

  expect(result.kind).toBe("success");
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(mutate).toHaveBeenCalledWith("rule", "10", "update", {
    actions: [{ address: "/lights/2/state", method: "PUT", body: { on: false } }],
  });
  expect(snapshotRead).toHaveBeenCalledTimes(1);
  expect(service.stateStore.getValue<{ name: string }>({ kind: "rule", id: "10" })?.name).toBe("Keep this name");
});

test("simple dimmer save rejects uncharacterized multi-action Rules without writing", async () => {
  const mutate = jest.fn(async () => undefined);
  const service = new ApplicationService({ hue: { snapshot: async () => snapshot, mutate }, stateStore: new DeviceStateStore(), dimmerCatalog: catalog });
  seedSnapshot(service, snapshot);
  const originalRule = snapshot.rules["10"] as Record<string, unknown>;
  service.stateStore.setKnown({ kind: "rule", id: "10" }, {
    ...originalRule,
    actions: [Array.isArray(originalRule.actions) ? originalRule.actions[0] : undefined, { address: "/groups/1/action", method: "PUT", body: { on: false } }],
  });
  const result = await service.saveSimpleBinding({
    ...simpleIdentity,
    ruleId: "10",
    conditionIndex: 0,
    actionIndex: 0,
    action: buildDimmerRuleAction({ kind: "on", target: { kind: "light", id: "1" } }),
    characterization,
  });
  expect(result.kind).toBe("definite_failure");
  expect(mutate).not.toHaveBeenCalled();
});

test("catalog-characterized simple save preserves auxiliary conditions and actions", async () => {
  const multiSnapshot: HueSnapshot = {
    ...snapshot,
    rules: {
      "10": {
        ...(snapshot.rules["10"] as Record<string, unknown>),
        conditions: [
          { address: "/sensors/4/state/buttonevent", operator: "eq", value: "1000" },
          { address: "/sensors/4/state/presence", operator: "eq", value: "true" },
        ],
        actions: [
          { address: "/lights/1/state", method: "PUT", body: { on: true } },
          { address: "/groups/2/action", method: "PUT", body: { on: false } },
        ],
      },
    },
  };
  const multiCharacterization: DimmerSimpleBindingForm = {
    actionIndex: 0,
    actions: characterization.actions,
    matchesRule: ({ rule, conditionIndex }: DimmerBindingRecognitionInput) => rule.conditions.length === 2
      && rule.actions.length === 2
      && conditionIndex === 0,
  };
  const multiCatalog = {
    models: [{
      ...catalog.models[0],
      controls: [{ id: "top", label: "Top button", gestures: [{ id: "press", event: 1000, label: "Pressed", simpleForm: multiCharacterization }] }],
    }],
  };
  const mutate = jest.fn(async () => undefined);
  const service = new ApplicationService({ hue: { snapshot: async () => multiSnapshot, mutate }, stateStore: new DeviceStateStore(), dimmerCatalog: multiCatalog });
  seedSnapshot(service, multiSnapshot);

  const result = await service.saveSimpleBinding({
    ...simpleIdentity,
    ruleId: "10",
    conditionIndex: 0,
    actionIndex: 0,
    action: buildDimmerRuleAction({ kind: "off", target: { kind: "light", id: "2" } }),
    characterization: multiCharacterization,
  });

  expect(result.kind).toBe("success");
  expect(mutate).toHaveBeenCalledWith("rule", "10", "update", {
    actions: [
      { address: "/lights/2/state", method: "PUT", body: { on: false } },
      { address: "/groups/2/action", method: "PUT", body: { on: false } },
    ],
  });
});

test("simple save rejects a condition that changed to another catalog gesture", async () => {
  const mutate = jest.fn(async () => undefined);
  const service = new ApplicationService({ hue: { snapshot: async () => snapshot, mutate }, stateStore: new DeviceStateStore(), dimmerCatalog: catalog });
  seedSnapshot(service, {
    ...snapshot,
    rules: {
      ...snapshot.rules,
      "10": {
        ...(snapshot.rules["10"] as Record<string, unknown>),
        conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1001" }],
      },
    },
  });

  const result = await service.saveSimpleBinding({
    ...simpleIdentity,
    ruleId: "10",
    conditionIndex: 0,
    actionIndex: 0,
    action: buildDimmerRuleAction({ kind: "off", target: { kind: "light", id: "2" } }),
    characterization,
  });

  expect(result.kind).toBe("definite_failure");
  expect(mutate).not.toHaveBeenCalled();
});

test("simple save rejects a newly selected target that disappeared from the current snapshot", async () => {
  const mutate = jest.fn(async () => undefined);
  const service = new ApplicationService({ hue: { snapshot: async () => snapshot, mutate }, stateStore: new DeviceStateStore(), dimmerCatalog: catalog });
  seedSnapshot(service, snapshot);
  const result = await service.saveSimpleBinding({
    ...simpleIdentity,
    ruleId: "10",
    conditionIndex: 0,
    actionIndex: 0,
    action: buildDimmerRuleAction({ kind: "off", target: { kind: "light", id: "99" } }),
    characterization,
  });
  expect(result.kind).toBe("definite_failure");
  expect(result.diagnostic?.message).toMatch(/target.*present/i);
  expect(mutate).not.toHaveBeenCalled();
});

test("missing-target repair changes only the selected Rule action address", async () => {
  const missingTargetSnapshot: HueSnapshot = { ...snapshot, lights: { "2": snapshot.lights["2"] } };
  const mutate = jest.fn(async () => undefined);
  const service = new ApplicationService({ hue: { snapshot: async () => missingTargetSnapshot, mutate }, stateStore: new DeviceStateStore(), dimmerCatalog: catalog });
  seedSnapshot(service, missingTargetSnapshot);

  const result = await service.saveSimpleBinding({
    ...simpleIdentity,
    ruleId: "10",
    conditionIndex: 0,
    actionIndex: 0,
    action: buildDimmerRuleAction({ kind: "on", target: { kind: "light", id: "2" } }),
    characterization,
  });

  expect(result.kind).toBe("success");
  expect(mutate).toHaveBeenCalledWith("rule", "10", "update", {
    actions: [{ address: "/lights/2/state", method: "PUT", body: { on: true } }],
  });
});

test("missing-target repair rejects an action-body change", async () => {
  const missingTargetSnapshot: HueSnapshot = { ...snapshot, lights: { "2": snapshot.lights["2"] } };
  const mutate = jest.fn(async () => undefined);
  const service = new ApplicationService({ hue: { snapshot: async () => missingTargetSnapshot, mutate }, stateStore: new DeviceStateStore(), dimmerCatalog: catalog });
  seedSnapshot(service, missingTargetSnapshot);

  const result = await service.saveSimpleBinding({
    ...simpleIdentity,
    ruleId: "10",
    conditionIndex: 0,
    actionIndex: 0,
    action: buildDimmerRuleAction({ kind: "off", target: { kind: "light", id: "2" } }),
    characterization,
  });

  expect(result.kind).toBe("definite_failure");
  expect(result.diagnostic?.message).toMatch(/replace only the target/i);
  expect(mutate).not.toHaveBeenCalled();
});
