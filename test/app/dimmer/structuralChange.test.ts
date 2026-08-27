import { ApplicationService } from "../../../src/app/ApplicationService";
import { DeviceStateStore } from "../../../src/app/DeviceStateStore";
import { previewStructuralDimmerEdit } from "../../../src/app/dimmerEditing";
import { buildRuleActionFromTarget } from "../../../src/protocol/hue/catalog/resourceCatalog";
import { DimmerBindingRecognitionInput, DimmerChangeSet, DimmerStructuralForm, StructuralDimmerEdit } from "../../../src/protocol/hue/dimmer";
import { HueSnapshot, ResourceKind } from "../../../src/app/types";
import fixtureData from "../../fixtures/dimmer/synthetic-structural.json";

const baseSnapshot: HueSnapshot = {
  lights: { "1": { name: "Reading Lamp", state: { on: true } } },
  groups: {},
  scenes: {},
  sensors: { "4": { name: "Wall switch", type: "ZLLSwitch", modelid: "DIM-1", uniqueid: "physical-a", state: { buttonevent: 1000 } } },
  schedules: { "20": { name: "Related schedule" } },
  resourcelinks: { "30": { class: "Test", description: "Related automation", links: ["/sensors/4", "/rules/10", "/schedules/20"] } },
  rules: {
    "10": {
      name: "Original",
      status: "disabled",
      conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1000" }],
      actions: [{ address: "/lights/1/state", method: "PUT", body: { on: true } }],
    },
  },
};

function changeSet(): DimmerChangeSet {
  return fixtureData as DimmerChangeSet;
}

const multiResourceForm: DimmerStructuralForm = {
  id: "multi-resource-test",
  label: "Test multi-resource change",
  operationShape: "multiple_resources",
  editor: { kind: "scene_cycle", sceneCount: 2 },
  matchesRule: ({ rule, conditionIndex }: DimmerBindingRecognitionInput) => rule.conditions.length === 1
    && rule.actions.length === 1
    && conditionIndex === 0,
  buildChangeSet: () => changeSet(),
};

const structuralCatalog = {
  models: [{
    id: "synthetic",
    label: "Synthetic dimmer",
    modelIds: ["DIM-1"],
    sensorTypes: ["ZLLSwitch"],
    identityKey: (sensor: { uniqueid?: string }) => sensor.uniqueid,
    controls: [{
      id: "test-control",
      label: "Test control",
      gestures: [{ id: "test-gesture", event: 1000, label: "Pressed", bindingKind: "structural" as const, structuralFormId: "multi-resource-test" }],
    }],
    structuralForms: [multiResourceForm],
  }],
};

const structuralIdentity: StructuralDimmerEdit = {
  sensorId: "4",
  catalogId: "synthetic",
  deviceKey: "synthetic:physical-a",
  formId: "multi-resource-test",
  controlId: "test-control",
  gestureId: "test-gesture",
  event: 1000,
  ruleId: "10",
  conditionIndex: 0,
  bindingId: "binding:0",
  values: {},
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

function serviceFor(
  mutate: (kind: Exclude<ResourceKind, "plug">, id: string, operation: "update" | "status", payload: Record<string, unknown>) => Promise<unknown>,
  deadlineMs = 5000,
) {
  const snapshot = jest.fn(async () => baseSnapshot);
  const service = new ApplicationService({ hue: { snapshot, mutate }, stateStore: new DeviceStateStore(), dimmerCatalog: structuralCatalog, deadlineMs });
  seedSnapshot(service, baseSnapshot);
  return { service, snapshot };
}

test("structural success runs ordered operations and refreshes once", async () => {
  const writes: string[] = [];
  const { service, snapshot } = serviceFor(async (_kind, _id, operation) => { writes.push(operation); });
  const result = await service.commitStructuralEdit(structuralIdentity);
  expect(result.status).toBe("completed");
  expect(result.kind).toBe("success");
  expect(writes).toEqual(["update", "status", "status"]);
  expect(result.succeeded).toHaveLength(3);
  expect(result.failedOrAmbiguous).toHaveLength(0);
  expect(result.unattempted).toHaveLength(0);
  expect(snapshot).toHaveBeenCalledTimes(1);
});

test("a definite or ambiguous operation stops dependent work and reports the remainder", async () => {
  let calls = 0;
  const { service, snapshot } = serviceFor(async () => {
    calls += 1;
    if (calls === 2) throw Object.assign(new Error("response lost"), { category: "Ambiguous" });
  });
  const result = await service.commitStructuralEdit(structuralIdentity);
  expect(result.status).toBe("stopped");
  expect(result.kind).toBe("ambiguous");
  expect(calls).toBe(2);
  expect(result.succeeded.map((item) => item.operation.operation)).toEqual(["update"]);
  expect(result.failedOrAmbiguous.map((item) => item.operation.operation)).toEqual(["disable"]);
  expect(result.unattempted.map((item) => item.operation.operation)).toEqual(["enable"]);
  expect(snapshot).toHaveBeenCalledTimes(1);
});

test.each([0, 1, 2])("a definite failure at operation %i leaves later operations unattempted", async (failureIndex) => {
  const writes: string[] = [];
  const { service, snapshot } = serviceFor(async (_kind, _id, operation) => {
    writes.push(operation);
    if (writes.length - 1 === failureIndex) throw Object.assign(new Error("rejected"), { category: "ProtocolRejected" });
  });
  const result = await service.commitStructuralEdit(structuralIdentity);
  expect(result.kind).toBe("definite_failure");
  expect(writes).toHaveLength(failureIndex + 1);
  expect(result.unattempted).toHaveLength(2 - failureIndex);
  expect(snapshot).toHaveBeenCalledTimes(1);
});

test("a timeout-after-send is ambiguous, stops without retry, and refreshes once", async () => {
  let writes = 0;
  const { service, snapshot } = serviceFor(async () => {
    writes += 1;
    await new Promise<void>(() => undefined);
  }, 1);
  const result = await service.commitStructuralEdit(structuralIdentity);
  expect(result.kind).toBe("ambiguous");
  expect(writes).toBe(1);
  expect(result.succeeded).toHaveLength(0);
  expect(result.failedOrAmbiguous).toHaveLength(1);
  expect(result.unattempted).toHaveLength(2);
  expect(snapshot).toHaveBeenCalledTimes(1);
});

test("structural preview rejects operations outside the catalog/policy contract", () => {
  const service = new ApplicationService();
  const result = service.previewStructuralEdit({
    operations: [{ kind: "rule", id: "10", operation: "update", payload: { actions: [{ address: "/config", method: "PUT", body: {} }] }, label: "Unsafe" }],
  });
  expect(result.allowed).toBe(false);
});

test("structural preview rejects a single-resource Rule update as a simple edit", () => {
  const result = previewStructuralDimmerEdit({
    changeSet: {
      summary: "Change one Rule",
      operations: [{ kind: "rule", id: "10", operation: "update", payload: { name: "Changed" }, label: "Change one Rule" }],
    },
  });
  expect(result.allowed).toBe(false);
  if (result.allowed) throw new Error("Expected a single-resource Rule update to be rejected as structural.");
  expect(result.reason).toMatch(/direct Save|simple Rule/i);
});

test("commit rejects an unbound raw change set instead of deleting an unrelated Rule", async () => {
  const remove = jest.fn(async () => undefined);
  const { service } = serviceFor(async () => undefined);
  const result = await service.commitStructuralEdit(changeSet() as unknown as StructuralDimmerEdit);
  expect(result.kind).toBe("definite_failure");
  expect(remove).not.toHaveBeenCalled();
});

const sceneCycleSnapshot: HueSnapshot = {
  lights: { "1": { name: "Reading Lamp" } },
  groups: { "2": { name: "Living Room" } },
  scenes: {
    "scene-evening": { name: "Relaxed", type: "GroupScene", group: "2" },
    "scene-relaxed": { name: "Calm", type: "LightScene", lights: ["1"] },
  },
  sensors: { "4": { name: "Wall switch", type: "ZLLSwitch", modelid: "DIM-1", uniqueid: "physical-a", state: { buttonevent: 1005 } } },
  schedules: {},
  resourcelinks: {},
  rules: {
    "10": {
      name: "Scene cycle slot one",
      status: "disabled",
      conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1005" }],
      actions: [buildRuleActionFromTarget("scene", "scene-evening", "activate", undefined, { type: "GroupScene", group: "2" })],
    },
    "11": {
      name: "Scene cycle slot two",
      status: "disabled",
      conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1005" }],
      actions: [buildRuleActionFromTarget("scene", "scene-relaxed", "activate", undefined, { type: "LightScene" })],
    },
  },
};

const sceneCycleForm: DimmerStructuralForm = {
  id: "scene-cycle",
  label: "Cycle scenes",
  actionKind: "cycle",
  operationShape: "multiple_resources",
  editor: { kind: "scene_cycle", sceneCount: 2 },
  matchesRule: ({ rule, actionReferences }: DimmerBindingRecognitionInput) => rule.actions.length === 1
    && actionReferences.length === 1
    && actionReferences.every((reference) => reference.status === "recognized" && reference.kind === "scene")
    && rule.actions[0].method === "PUT"
    && typeof rule.actions[0].body?.scene === "string",
  buildChangeSet: ({ edit, model, snapshot }) => {
    const sceneIds = Array.isArray(edit.values?.sceneIds) ? edit.values.sceneIds : [];
    if (sceneIds.length !== 2 || sceneIds.some((id) => typeof id !== "string" || id.trim() === "")) return undefined;
    const cycleBindings = model.advanced.bindings.filter((candidate) => candidate.classification === "recognized_structural"
      && candidate.structuralFormId === "scene-cycle"
      && typeof candidate.advanced.ruleId === "string");
    if (cycleBindings.length !== 2) return undefined;
    const actions = sceneIds.map((id) => {
      const scene = snapshot.scenes[id] && typeof snapshot.scenes[id] === "object" ? snapshot.scenes[id] as Record<string, unknown> : {};
      return buildRuleActionFromTarget("scene", id, "activate", undefined, {
        type: typeof scene.type === "string" ? scene.type : undefined,
        group: typeof scene.group === "string" ? scene.group : undefined,
      });
    });
    return {
      deviceKey: model.deviceKey,
      summary: `Cycle through ${sceneIds.join(", ")}`,
      // The characterized cycle spans two existing Rules. Updating both
      // resources is why this form is structural; neither is deleted or
      // recreated merely to force the structural path.
      operations: cycleBindings.map((binding, index) => ({
          kind: "rule" as const,
          id: binding.advanced.ruleId,
          operation: "update" as const,
          payload: { actions: [actions[index]] },
          label: `Update Scene cycle Rule ${index + 1}`,
      })),
    };
  },
};

const sceneCycleCatalog = {
  models: [{
    id: "synthetic",
    label: "Synthetic dimmer",
    modelIds: ["DIM-1"],
    sensorTypes: ["ZLLSwitch"],
    identityKey: (sensor: { uniqueid?: string }) => sensor.uniqueid,
    controls: [{ id: "cycle-control", label: "Scene cycle", gestures: [{ id: "cycle", event: 1005, label: "Pressed", bindingKind: "structural" as const, structuralFormId: "scene-cycle" }] }],
    structuralForms: [sceneCycleForm],
  }],
};

test("a characterized Scene-cycle multi-resource update is explicitly structural and uses Scene endpoints", async () => {
  const snapshot = jest.fn(async () => sceneCycleSnapshot);
  const remove = jest.fn(async () => undefined);
  const create = jest.fn(async () => undefined);
  const mutate = jest.fn(async () => undefined);
  const service = new ApplicationService({ hue: { snapshot, mutate, create, delete: remove }, stateStore: new DeviceStateStore(), dimmerCatalog: sceneCycleCatalog });
  seedSnapshot(service, sceneCycleSnapshot);
  const edit: StructuralDimmerEdit = {
    sensorId: "4",
    catalogId: "synthetic",
    deviceKey: "synthetic:physical-a",
    formId: "scene-cycle",
    controlId: "cycle-control",
    gestureId: "cycle",
    event: 1005,
    ruleId: "10",
    conditionIndex: 0,
    bindingId: "binding:0",
    values: { sceneIds: ["scene-relaxed", "scene-evening"] },
  };
  const preview = service.previewStructuralEdit(edit);
  expect(preview.allowed).toBe(true);
  if (preview.allowed) expect(preview.changeSet.operations.map((operation) => operation.id)).toEqual(["10", "11"]);
  const result = await service.commitStructuralEdit(edit);

  expect(result.kind).toBe("success");
  expect(create).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
  expect(result.operations.map((operation) => operation.operation.id)).toEqual(["10", "11"]);
  expect(mutate).toHaveBeenCalledTimes(2);
  expect(mutate).toHaveBeenNthCalledWith(1, "rule", "10", "update", {
    actions: [{ address: "/groups/0/action", method: "PUT", body: { scene: "scene-relaxed" } }],
  });
  expect(mutate).toHaveBeenNthCalledWith(2, "rule", "11", "update", {
    actions: [{ address: "/groups/2/action", method: "PUT", body: { scene: "scene-evening" } }],
  });
  expect(result.succeeded.map((item) => item.operation.operation)).toEqual(["update", "update"]);
  expect(result.succeeded.map((item) => item.operation.id)).toEqual(["10", "11"]);
  expect(snapshot).toHaveBeenCalledTimes(1);
});

test("a characterized Rule replacement preserves behavior metadata and creates before deleting", async () => {
  const replacementForm: DimmerStructuralForm = {
    id: "scene-replacement",
    label: "Replace Scene rule",
    actionKind: "cycle",
    operationShape: "replace_rule",
    editor: { kind: "scene_cycle", sceneCount: 2 },
    matchesRule: ({ rule, actionReferences }: DimmerBindingRecognitionInput) => rule.conditions.length === 1
      && rule.actions.length === 1
      && actionReferences[0]?.status === "recognized"
      && actionReferences[0].kind === "scene",
    buildChangeSet: ({ edit, model, rule }) => ({
      deviceKey: model.deviceKey,
      summary: "Replace the characterized Scene Rule.",
      operations: [
        {
          kind: "rule",
          operation: "create",
          payload: {
            name: rule.name,
            status: rule.status,
            conditions: rule.conditions,
            actions: [buildRuleActionFromTarget("scene", "scene-relaxed", "activate", undefined, { type: "LightScene" })],
          },
          label: "Create replacement Scene Rule",
        },
        {
          kind: "rule",
          id: edit.ruleId,
          operation: "delete",
          label: "Delete original Scene Rule",
        },
      ],
    }),
  };
  const replacementCatalog = {
    models: [{
      ...sceneCycleCatalog.models[0],
      controls: [{ id: "cycle-control", label: "Scene cycle", gestures: [{ id: "cycle", event: 1005, label: "Pressed", bindingKind: "structural" as const, structuralFormId: "scene-replacement" }] }],
      structuralForms: [replacementForm],
    }],
  };
  const replacementSnapshot: HueSnapshot = {
    ...sceneCycleSnapshot,
    rules: { "10": sceneCycleSnapshot.rules["10"] },
  };
  const originalRule = replacementSnapshot.rules["10"] as { readonly conditions?: unknown };
  const snapshot = jest.fn(async () => replacementSnapshot);
  const order: string[] = [];
  const create = jest.fn(async (_kind: Exclude<ResourceKind, "plug">, payload: Record<string, unknown>) => {
    order.push("create");
    expect(payload).toMatchObject({ name: "Scene cycle slot one", status: "disabled" });
    expect(payload.conditions).toEqual(originalRule.conditions);
  });
  const remove = jest.fn(async (_kind: Exclude<ResourceKind, "plug">, id: string) => { order.push(`delete:${id}`); });
  const service = new ApplicationService({
    hue: { snapshot, create, delete: remove },
    stateStore: new DeviceStateStore(),
    dimmerCatalog: replacementCatalog,
  });
  seedSnapshot(service, replacementSnapshot);

  const result = await service.commitStructuralEdit({
    sensorId: "4",
    catalogId: "synthetic",
    deviceKey: "synthetic:physical-a",
    formId: "scene-replacement",
    controlId: "cycle-control",
    gestureId: "cycle",
    event: 1005,
    ruleId: "10",
    conditionIndex: 0,
    bindingId: "binding:0",
    values: { sceneIds: ["scene-relaxed", "scene-evening"] },
  });

  expect(result.kind).toBe("success");
  expect(order).toEqual(["create", "delete:10"]);
  expect(create).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(snapshot).toHaveBeenCalledTimes(1);
});

test("structural commit rejects a stale binding after the current Rule event changes", async () => {
  const writes = jest.fn(async () => undefined);
  const { service } = serviceFor(writes);
  service.stateStore.setKnown({ kind: "rule", id: "10" }, {
    ...(baseSnapshot.rules["10"] as Record<string, unknown>),
    conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1001" }],
  });
  const result = await service.commitStructuralEdit(structuralIdentity);
  expect(result.kind).toBe("definite_failure");
  expect(writes).not.toHaveBeenCalled();
});

test("structural commit rejects a binding-id mismatch before issuing any operation", async () => {
  const writes = jest.fn(async () => undefined);
  const { service } = serviceFor(writes);
  const result = await service.commitStructuralEdit({ ...structuralIdentity, bindingId: "binding:999" });
  expect(result.kind).toBe("definite_failure");
  expect(result.diagnostic?.message).toMatch(/same characterized binding/i);
  expect(writes).not.toHaveBeenCalled();
});
