import { HueSnapshot } from "../../../../src/app/types";
import { buildEditorModel } from "../../../../src/protocol/hue/dimmer";
import { previewStructuralDimmerEdit } from "../../../../src/app/dimmerEditing";
import { buildRuleActionFromTarget } from "../../../../src/protocol/hue/catalog/resourceCatalog";
import { DimmerBindingRecognitionInput, DimmerStructuralForm } from "../../../../src/protocol/hue/dimmer";
import fixtureData from "../../../../test/fixtures/dimmer/synthetic-recognized.json";
import malformedFixtureData from "../../../../test/fixtures/dimmer/synthetic-malformed-custom.json";

const fixture = fixtureData as HueSnapshot;
const malformedFixture = malformedFixtureData as HueSnapshot;
const stateFields = ["on", "bri", "hue", "sat", "xy", "ct", "alert", "effect", "transitiontime"] as const;
const simpleRule = ({ rule, conditionIndex }: DimmerBindingRecognitionInput): boolean => rule.conditions.length === 1
  && rule.actions.length === 1
  && conditionIndex === 0;
const simpleActions = [
  { kind: "on" as const, targetKinds: ["light", "group"] as const, fields: ["on"] as const },
  { kind: "off" as const, targetKinds: ["light", "group"] as const, fields: ["on"] as const },
  { kind: "set" as const, targetKinds: ["light", "group"] as const, fields: stateFields },
];
const sceneActivation = {
  actionIndex: 0,
  actions: [{ kind: "activate" as const, targetKinds: ["scene"] as const, fields: ["scene"] as const }],
  matchesRule: simpleRule,
};
const catalog = {
  models: [{
    id: "acme-dimmer",
    label: "Acme four-control dimmer",
    manufacturerNames: ["Acme"],
    modelIds: ["DIM-1"],
    sensorTypes: ["ZLLSwitch"],
    identityKey: (sensor: { uniqueid?: string }) => sensor.uniqueid,
    controls: [
      { id: "one", label: "Top button", gestures: [{ id: "press", event: 1000, label: "Pressed", simpleForm: { actionIndex: 0, actions: simpleActions, matchesRule: simpleRule } }] },
      { id: "two", label: "Bottom button", gestures: [{ id: "press", event: 1001, label: "Pressed", simpleForm: { actionIndex: 0, actions: simpleActions, matchesRule: simpleRule } }] },
      { id: "three", label: "Raise", gestures: [{ id: "hold", event: 1002, label: "Held", simpleForm: sceneActivation }] },
      { id: "four", label: "Lower", gestures: [{ id: "press", event: 1003, label: "Pressed" }] },
      { id: "five", label: "Relative raise", gestures: [{ id: "hold", event: 1004, label: "Held", simpleForm: { actionIndex: 0, actions: [
        { kind: "brighten" as const, targetKinds: ["light"] as const, fields: ["bri_inc"] as const },
        { kind: "dim" as const, targetKinds: ["light"] as const, fields: ["bri_inc"] as const },
      ], matchesRule: simpleRule } }] },
    ],
  }],
};

test("projects physical controls, human action labels, exact targets, and Advanced details", () => {
  const model = buildEditorModel({ kind: "sensor", id: "4" }, fixture, catalog);
  expect(model.recognized).toBe(true);
  expect(model.deviceKey).toBe("acme-dimmer:physical-a");
  expect(model.advanced.sensorIds).toEqual(["4", "5"]);
  expect(model.controls[0].gestures[0]).toMatchObject({ controlLabel: "Top button", gestureLabel: "Pressed", classification: "editable_simple", editable: true });
  expect(model.controls[0].gestures[0].action).toMatchObject({ kind: "on", label: "Turn on", targetLabel: "Reading Lamp" });
  expect(model.controls[1].gestures[0].action).toMatchObject({ kind: "set", targetLabel: "Living Room" });
  expect(model.controls[2].gestures[0].action).toMatchObject({ kind: "activate", targetLabel: "Evening" });
  expect(model.advanced.ruleIds).toEqual(expect.arrayContaining(["10", "11", "12", "13", "14"]));
  expect(model.advanced.sensorIds).toEqual(["4", "5"]);
  expect(model.advanced.rawEvents).toEqual(expect.arrayContaining([1000, 1001, 1002, 1003]));
  expect(model.advanced.resourceLinkIds).toEqual(["30"]);
  expect(JSON.stringify(model.controls)).not.toContain("1000");
  expect(JSON.stringify(model.controls)).not.toContain("rule:10");
  expect(JSON.stringify(model.advanced)).toContain("1000");
  expect(JSON.stringify(model)).not.toContain("SECRET_OWNER");
  expect(JSON.stringify(model)).not.toContain("TEST_CREDENTIAL");
});

test("keeps malformed, custom, and missing-target bindings visible and read-only", () => {
  const model = buildEditorModel({ kind: "sensor", id: "4" }, fixture, catalog);
  const classifications = model.rows.map((row) => row.classification);
  expect(classifications).toEqual(expect.arrayContaining(["custom", "malformed"]));
  expect(model.rows.some((row) => row.editable === false && row.reason)).toBe(true);
  expect(model.advanced.customBindings.length).toBeGreaterThan(0);
  expect(model.advanced.unsupportedBindings.length).toBeGreaterThan(0);
});

test("does not recognize an unsupported model or infer a target by matching names", () => {
  const unsupported = buildEditorModel({ kind: "sensor", id: "4" }, { ...fixture, sensors: { "4": { ...(fixture.sensors["4"] as object), modelid: "UNKNOWN" } } }, catalog);
  expect(unsupported.recognized).toBe(false);
  expect(unsupported.advanced.sensorIds).toEqual(["4"]);
  expect(unsupported.advanced.helperSensorIds).not.toContain("5");
  expect(unsupported.rows[0].editable).toBe(false);
  expect(unsupported.advanced.ruleIds).toEqual(expect.arrayContaining(["10", "12", "13", "14"]));
  expect(unsupported.advanced.scheduleIds).toContain("20");
  expect(unsupported.advanced.resourceLinkIds).toContain("30");
  expect(unsupported.advanced.creatorProvenance.length).toBeGreaterThan(0);
  expect(unsupported.advanced.resourceRefs).toEqual(expect.arrayContaining([
    { kind: "sensor", id: "4" },
    { kind: "light", id: "1" },
  ]));

  const noTarget = buildEditorModel({ kind: "sensor", id: "4" }, { ...fixture, lights: {}, groups: {}, scenes: {} }, catalog);
  expect(noTarget.rows.some((row) => row.classification === "missing_target" && !row.editable)).toBe(true);
});

test("follows Resource-Link relationships to linked Rules, Schedules, and helper Sensors", () => {
  const linkedSnapshot: HueSnapshot = {
    ...fixture,
    lights: { ...fixture.lights, "3": { name: "Linked Lamp" } },
    sensors: { ...fixture.sensors, "6": { name: "Automation helper", type: "ZLLSwitch", uniqueid: "helper-b" } },
    rules: {
      ...fixture.rules,
      "60": {
        name: "Linked custom Rule",
        owner: "LINKED_OWNER",
        conditions: [{ address: "/sensors/6/state/presence", operator: "eq", value: "true" }],
        actions: [{ address: "/lights/3/state", method: "PUT", body: { on: true } }],
      },
    },
    schedules: {
      ...fixture.schedules,
      "21": { name: "Linked schedule", command: { address: "/lights/3/state", method: "PUT", body: { on: false } } },
    },
    resourcelinks: {
      "30": { class: "HomeDashboard", description: "Wall switch resources", links: ["/sensors/4", "/rules/10", "/schedules/20", "/resourcelinks/31"] },
      "31": { class: "HomeDashboard", description: "Linked automation", links: ["/rules/60", "/schedules/21", "/sensors/6"] },
    },
  };

  const model = buildEditorModel({ kind: "sensor", id: "4" }, linkedSnapshot, catalog);
  expect(model.advanced.ruleIds).toContain("60");
  expect(model.advanced.scheduleIds).toContain("21");
  expect(model.advanced.resourceLinkIds).toEqual(expect.arrayContaining(["30", "31"]));
  expect(model.advanced.helperSensorIds).toContain("6");
  expect(model.advanced.bindings.find((binding) => binding.advanced.ruleId === "60")).toMatchObject({
    controlId: "unknown-control",
    classification: "custom",
    editable: false,
  });

  const unsupported = buildEditorModel({ kind: "sensor", id: "4" }, {
    ...linkedSnapshot,
    sensors: { ...linkedSnapshot.sensors, "4": { ...(linkedSnapshot.sensors["4"] as object), modelid: "UNKNOWN" } },
  }, catalog);
  expect(unsupported.advanced.ruleIds).toContain("60");
  expect(unsupported.advanced.scheduleIds).toContain("21");
  expect(unsupported.advanced.resourceLinkIds).toEqual(expect.arrayContaining(["30", "31"]));
  expect(unsupported.advanced.helperSensorIds).toContain("6");
  expect(unsupported.advanced.bindings.some((binding) => binding.advanced.ruleId === "60" && !binding.editable)).toBe(true);
});

test("keeps the malformed/custom fixture visible without string-scanning unrelated text", () => {
  const model = buildEditorModel({ kind: "sensor", id: "4" }, malformedFixture, catalog);
  const malformedRow = model.rows.find((row) => row.controlId === "unknown-control");
  expect(malformedRow).toMatchObject({ classification: "unsupported", editable: false });
  expect(malformedRow?.reason).toMatch(/not represented|characterized|supported/i);
  expect(model.advanced.ruleIds).toEqual(["50"]);
});

test("projects relative brightness actions as an editable structured form", () => {
  const model = buildEditorModel({ kind: "sensor", id: "4" }, {
    ...fixture,
    rules: {
      ...fixture.rules,
      "15": {
        conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1004" }],
        actions: [{ address: "/lights/1/state", method: "PUT", body: { bri_inc: 30 } }],
      },
    },
  }, catalog);
  expect(model.rows.find((row) => row.gestureLabel === "Held" && row.controlLabel === "Relative raise")?.action).toMatchObject({
    kind: "brighten",
    label: "Brighten while held",
  });
});

test("treats a catalog event claimed by multiple gestures as ambiguous and read-only", () => {
  const topSimpleForm = (catalog.models[0].controls[0].gestures[0] as any).simpleForm;
  const duplicateCatalog = {
    models: [{
      ...catalog.models[0],
      controls: [
        ...catalog.models[0].controls,
        { id: "duplicate", label: "Duplicate claim", gestures: [{ id: "duplicate-press", event: 1000, label: "Also pressed", simpleForm: topSimpleForm }] },
      ],
    }],
  };
  const model = buildEditorModel({ kind: "sensor", id: "4" }, fixture, duplicateCatalog);
  const binding = model.advanced.bindings.find((candidate) => candidate.advanced.ruleId === "10");
  expect(binding).toMatchObject({ classification: "ambiguous", editable: false });
  expect(binding?.reason).toMatch(/multiple catalog gestures/i);
});

test("uses the catalog matcher for a simple Rule with preserved auxiliary conditions/actions", () => {
  const multiForm = {
    actionIndex: 0,
    actions: simpleActions,
    matchesRule: ({ rule, conditionIndex }: DimmerBindingRecognitionInput) => rule.conditions.length === 2
      && rule.actions.length === 2
      && conditionIndex === 0,
  };
  const multiCatalog = {
    models: [{
      ...catalog.models[0],
      controls: [{ id: "multi", label: "Multi-condition button", gestures: [{ id: "press", event: 1006, label: "Pressed", simpleForm: multiForm }] }],
    }],
  };
  const multiSnapshot = {
    ...fixture,
    rules: {
      ...fixture.rules,
      "17": {
        conditions: [
          { address: "/sensors/4/state/buttonevent", operator: "eq", value: "1006" },
          { address: "/sensors/5/state/presence", operator: "eq", value: "true" },
        ],
        actions: [
          { address: "/lights/1/state", method: "PUT", body: { on: true } },
          { address: "/groups/2/action", method: "PUT", body: { on: false } },
        ],
      },
    },
  };
  const row = buildEditorModel({ kind: "sensor", id: "4" }, multiSnapshot, multiCatalog).rows.find((candidate) => candidate.controlLabel === "Multi-condition button");
  expect(row).toMatchObject({ classification: "editable_simple", editable: true });
});

test("keeps a structural event read-only when its existing Rule is not characterized", () => {
  const structuralForm = {
    id: "scene-cycle",
    label: "Cycle scenes",
    actionKind: "cycle" as const,
    operationShape: "multiple_resources" as const,
    editor: { kind: "scene_cycle" as const, sceneCount: 2 },
    matchesRule: ({ rule }: DimmerBindingRecognitionInput) => rule.actions.length === 2,
    buildChangeSet: () => undefined,
  } satisfies DimmerStructuralForm;
  const structuralCatalog = {
    models: [{
      ...catalog.models[0],
      controls: [{ id: "cycle", label: "Scene cycle", gestures: [{ id: "cycle", event: 1007, label: "Pressed", bindingKind: "structural" as const, structuralFormId: "scene-cycle" }] }],
      structuralForms: [structuralForm],
    }],
  };
  const model = buildEditorModel({ kind: "sensor", id: "4" }, {
    ...fixture,
    rules: {
      ...fixture.rules,
      "18": {
        conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1007" }],
        actions: [{ address: "/lights/1/state", method: "PUT", body: { on: true } }],
      },
    },
  }, structuralCatalog);
  const row = model.rows.find((candidate) => candidate.structuralFormId === "scene-cycle");
  expect(row).toMatchObject({ classification: "custom", editable: false });
  expect(row?.reason).toMatch(/does not match/i);
});

test("keeps a Scene-cycle read-only when a permissive matcher sees a non-Scene action", () => {
  const structuralForm = {
    id: "scene-cycle",
    label: "Cycle scenes",
    actionKind: "cycle" as const,
    operationShape: "multiple_resources" as const,
    editor: { kind: "scene_cycle" as const, sceneCount: 2 },
    // The projector still enforces the Scene activation contract when a
    // catalog matcher is accidentally broader than the characterized form.
    matchesRule: ({ rule }: DimmerBindingRecognitionInput) => rule.actions.length === 1,
    buildChangeSet: () => undefined,
  } satisfies DimmerStructuralForm;
  const structuralCatalog = {
    models: [{
      ...catalog.models[0],
      controls: [{ id: "cycle", label: "Scene cycle", gestures: [{ id: "cycle", event: 1008, label: "Pressed", bindingKind: "structural" as const, structuralFormId: "scene-cycle" }] }],
      structuralForms: [structuralForm],
    }],
  };
  const model = buildEditorModel({ kind: "sensor", id: "4" }, {
    ...fixture,
    rules: {
      ...fixture.rules,
      "19": {
        conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1008" }],
        actions: [{ address: "/lights/1/state", method: "PUT", body: { on: true } }],
      },
    },
  }, structuralCatalog);
  const row = model.rows.find((candidate) => candidate.structuralFormId === "scene-cycle");
  expect(row).toMatchObject({ classification: "custom", editable: false });
});

test("represents Scene cycling as a characterized structural form with explicit slots", () => {
  const structuralForm = {
    id: "scene-cycle",
    label: "Cycle scenes",
    actionKind: "cycle" as const,
    operationShape: "multiple_resources" as const,
    editor: { kind: "scene_cycle" as const, sceneCount: 2 },
    matchesRule: ({ rule, actionReferences }: DimmerBindingRecognitionInput) => rule.actions.length === 1
      && actionReferences.length === 1
      && actionReferences.every((reference) => reference.status === "recognized" && reference.kind === "scene")
      && rule.actions[0].method === "PUT"
      && typeof rule.actions[0].body?.scene === "string",
    buildChangeSet: ({ edit, model: editorModel, snapshot }) => {
      const sceneIds = Array.isArray(edit.values?.sceneIds) ? edit.values.sceneIds : [];
      if (sceneIds.length !== 2 || sceneIds.some((id) => typeof id !== "string" || id.trim() === "" || /[/?#]/.test(id))) return undefined;
      const cycleBindings = editorModel.advanced.bindings.filter((candidate) => candidate.classification === "recognized_structural"
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
        deviceKey: editorModel.deviceKey,
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
  } satisfies DimmerStructuralForm;
  const structuralCatalog = {
    models: [{
      ...catalog.models[0],
      controls: [{ id: "cycle", label: "Scene cycle", gestures: [{ id: "cycle", event: 1005, label: "Pressed", bindingKind: "structural" as const, structuralFormId: "scene-cycle" }] }],
      structuralForms: [structuralForm],
    }],
  };
  const structuralSnapshot = {
    ...fixture,
    scenes: {
      ...fixture.scenes,
      "scene-evening": { name: "Relaxed", type: "GroupScene", group: "2" },
      "scene-relaxed": { name: "Calm", type: "LightScene", lights: ["1"] },
    },
    rules: {
      ...fixture.rules,
      "16": {
        name: "Scene cycle slot one",
        status: "disabled",
        conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1005" }],
        actions: [{ address: "/groups/2/action", method: "PUT", body: { scene: "scene-evening" } }],
      },
      "17": {
        name: "Scene cycle slot two",
        status: "disabled",
        conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1005" }],
        actions: [{ address: "/groups/0/action", method: "PUT", body: { scene: "scene-relaxed" } }],
      },
    },
  };
  const model = buildEditorModel({ kind: "sensor", id: "4" }, structuralSnapshot, structuralCatalog);
  const row = model.rows.find((candidate) => candidate.structuralFormId === "scene-cycle");
  expect(row).toMatchObject({ classification: "recognized_structural", editable: true, action: { kind: "cycle", label: "Cycle scenes" } });
  const binding = model.advanced.bindings.find((candidate) => candidate.id === row?.id);
  const changeSet = structuralForm.buildChangeSet?.({
    edit: { deviceKey: model.deviceKey, bindingId: binding?.id, formId: "scene-cycle", values: { sceneIds: ["scene-evening", "scene-relaxed"] } },
    model,
    binding: binding!,
    rule: binding!.advanced.ruleShape!,
    snapshot: structuralSnapshot,
  });
  const preview = changeSet && previewStructuralDimmerEdit({ changeSet });
  expect(preview?.allowed).toBe(true);
  expect(preview && preview.allowed && preview.changeSet.operations.map((operation) => operation.operation)).toEqual(["update", "update"]);
  expect(preview && preview.allowed && preview.changeSet.operations.map((operation) => operation.id)).toEqual(["16", "17"]);
  expect(preview && preview.allowed && preview.changeSet.operations.map((operation) => operation.payload)).toEqual([
    { actions: [{ address: "/groups/2/action", method: "PUT", body: { scene: "scene-evening" } }] },
    { actions: [{ address: "/groups/0/action", method: "PUT", body: { scene: "scene-relaxed" } }] },
  ]);
});
