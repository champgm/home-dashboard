import React from "react";
import { act, fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { HueSnapshot } from "../../../src/app/types";
import { DimmerBindingRecognitionInput, StructuralDimmerEdit } from "../../../src/protocol/hue/dimmer";
import { buildRuleActionFromTarget } from "../../../src/protocol/hue/catalog/resourceCatalog";
import fixtureData from "../../fixtures/dimmer/synthetic-recognized.json";

const fixture = fixtureData as HueSnapshot;
const stateFields = ["on", "bri", "hue", "sat", "xy", "ct", "alert", "effect", "transitiontime"] as const;
const simpleRule = ({ rule, conditionIndex }: DimmerBindingRecognitionInput): boolean => rule.conditions.length === 1
  && rule.actions.length === 1
  && conditionIndex === 0;
const simpleActions = [
  { kind: "on" as const, targetKinds: ["light", "group"] as const, fields: ["on"] as const },
  { kind: "off" as const, targetKinds: ["light", "group"] as const, fields: ["on"] as const },
  { kind: "set" as const, targetKinds: ["light", "group"] as const, fields: stateFields },
];
const relativeForm = {
  actionIndex: 0,
  actions: [
    { kind: "brighten" as const, targetKinds: ["light"] as const, fields: ["bri_inc"] as const },
    { kind: "dim" as const, targetKinds: ["light"] as const, fields: ["bri_inc"] as const },
  ],
  matchesRule: simpleRule,
};
let screenSnapshot = fixture;
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
      { id: "three", label: "Raise", gestures: [{ id: "hold", event: 1002, label: "Held", simpleForm: { actionIndex: 0, actions: [{ kind: "activate" as const, targetKinds: ["scene"] as const, fields: ["scene"] as const }], matchesRule: simpleRule } }] },
      { id: "four", label: "Lower", gestures: [{ id: "press", event: 1003, label: "Pressed" }] },
      { id: "five", label: "Relative raise", gestures: [{ id: "hold", event: 1004, label: "Held", simpleForm: relativeForm }] },
    ],
  }],
};

const stateStore = {
  getAll: jest.fn(() => {
    const entries: Array<[string, { state: { status: string; value: unknown }; pending: boolean }]> = [];
    const add = (kind: string, collection: Record<string, unknown>) => Object.entries(collection).forEach(([id, value]) => entries.push([`${kind}:${id}`, { state: { status: "known", value }, pending: false }]));
    add("sensor", screenSnapshot.sensors); add("light", screenSnapshot.lights); add("group", screenSnapshot.groups); add("scene", screenSnapshot.scenes);
    add("rule", screenSnapshot.rules); add("schedule", screenSnapshot.schedules); add("resourcelink", screenSnapshot.resourcelinks);
    return new Map(entries);
  }),
  get: jest.fn(),
  subscribe: jest.fn((_listener?: () => void) => jest.fn()),
};
const saveSimpleBinding = jest.fn(async () => ({ kind: "success" as const }));
const commitStructuralEdit = jest.fn(async () => ({ kind: "success" as const }));
const mockRuntime = {
  service: {
    stateStore,
    dimmerCatalog: catalog as any,
    saveSimpleBinding,
    commitStructuralEdit,
    previewStructuralEdit: jest.fn((edit: StructuralDimmerEdit) => edit.changeSet
      ? { allowed: true as const, changeSet: edit.changeSet }
      : { allowed: false as const, reason: "missing test change set" }),
    mutateHue: jest.fn(async () => ({ kind: "success" as const })),
  },
  configStore: { getCommitted: jest.fn(() => ({ bridge: {}, plugs: [], favorites: [] })), subscribe: jest.fn(() => jest.fn()) },
};

jest.mock("../../../src/ui/AppContext", () => ({ useAppRuntime: () => mockRuntime }));

import { ConfigureDimmerScreen } from "../../../src/ui/screens/ConfigureDimmerScreen";

describe("Configure Dimmer screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    screenSnapshot = fixture;
    mockRuntime.service.dimmerCatalog = catalog as any;
    stateStore.getAll.mockImplementation(() => {
      const entries: Array<[string, { state: { status: string; value: unknown }; pending: boolean }]> = [];
      const add = (kind: string, collection: Record<string, unknown>) => Object.entries(collection).forEach(([id, value]) => entries.push([`${kind}:${id}`, { state: { status: "known", value }, pending: false }]));
      add("sensor", screenSnapshot.sensors); add("light", screenSnapshot.lights); add("group", screenSnapshot.groups); add("scene", screenSnapshot.scenes);
      add("rule", screenSnapshot.rules); add("schedule", screenSnapshot.schedules); add("resourcelink", screenSnapshot.resourcelinks);
      return new Map(entries);
    });
  });

  test("organizes a recognized device by physical controls and keeps IDs/events in Advanced", () => {
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    expect(view.getByText("Acme four-control dimmer")).toBeTruthy();
    expect(view.getByText("Top button")).toBeTruthy();
    expect(view.getAllByText("Pressed").length).toBeGreaterThan(0);
    expect(view.getAllByText("Turn on").length).toBeGreaterThan(0);
    expect(view.getByText("Reading Lamp")).toBeTruthy();
    expect(view.queryByText("1000")).toBeNull();
    expect(view.queryByText("rule:10")).toBeNull();

    fireEvent.press(view.getByTestId("dimmer-advanced-toggle"));
    expect(view.getByLabelText(/Raw button events:.*1000/)).toBeTruthy();
    expect(view.getByLabelText(/Rule IDs:.*10/)).toBeTruthy();
    expect(view.getByLabelText(/Resource Link IDs:.*30/)).toBeTruthy();
  });

  test("keeps recognized binding editors closed and focuses one binding at a time", () => {
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    expect(view.queryByTestId("dimmer-edit-binding:0")).toBeNull();
    expect(view.queryByTestId("dimmer-edit-binding:1")).toBeNull();

    fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:0"));
    expect(view.getByTestId("dimmer-edit-binding:0")).toBeTruthy();
    fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:1"));
    expect(view.queryByTestId("dimmer-edit-binding:0")).toBeNull();
    expect(view.getByTestId("dimmer-edit-binding:1")).toBeTruthy();
  });

  test("subscribes with the state-store instance bound", () => {
    const unsubscribe = jest.fn();
    const subscribe = jest.fn(function (this: unknown, _listener?: () => void) {
      if (this !== stateStore) throw new Error("stateStore subscription lost its instance");
      return unsubscribe;
    });
    stateStore.subscribe.mockImplementationOnce(subscribe);
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    expect(subscribe).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  test("saves a simple binding directly without a preview or provenance confirmation", async () => {
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:0"));
    fireEvent.changeText(view.getByTestId("dimmer-target-filter-binding:0"), "Living Room");
    fireEvent.press(within(view.getByTestId("dimmer-target-binding:0")).getByText("Group: Living Room"));
    fireEvent.press(view.getByTestId("dimmer-save-binding:0"));
    await waitFor(() => expect(saveSimpleBinding).toHaveBeenCalledWith(expect.objectContaining({
      sensorId: "4",
      catalogId: "acme-dimmer",
      controlId: "one",
      gestureId: "press",
      event: 1000,
      deviceKey: "acme-dimmer:physical-a",
      ruleId: "10",
      actionIndex: 0,
    })));
    expect(view.queryByTestId("dimmer-structural-preview")).toBeNull();
    expect(view.queryByText(/provenance/i)).toBeNull();
  });

  test("offers only the action and target forms characterized for the selected gesture", () => {
    const limitedCatalog = {
      models: [{
        ...catalog.models[0],
        controls: [{
          id: "one",
          label: "Top button",
          gestures: [{
            id: "press",
            event: 1000,
            label: "Pressed",
            simpleForm: {
              actionIndex: 0,
              actions: [
                { kind: "on" as const, targetKinds: ["light"] as const, fields: ["on"] as const },
                { kind: "off" as const, targetKinds: ["light"] as const, fields: ["on"] as const },
              ],
              matchesRule: simpleRule,
            },
          }],
        }],
      }],
    };
    mockRuntime.service.dimmerCatalog = limitedCatalog as any;
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:0"));
    const binding = view.getByTestId("dimmer-edit-binding:0");
    expect(within(binding).getByText("Turn on")).toBeTruthy();
    expect(within(binding).getByText("Turn off")).toBeTruthy();
    expect(within(binding).queryByText("Brighten while held")).toBeNull();
    expect(within(binding).queryByText("Set light/group values")).toBeNull();
  });

  test("replaces action fields when changing action type or target", async () => {
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:1"));
    const binding = view.getByTestId("dimmer-edit-binding:1");
    fireEvent.press(within(binding).getByText("Turn off"));
    fireEvent.press(view.getByTestId("dimmer-save-binding:1"));
    await waitFor(() => expect(saveSimpleBinding).toHaveBeenCalledWith(expect.objectContaining({
      action: expect.objectContaining({ address: "/groups/2/action", body: { on: false } }),
    })));
    const firstEdit = (saveSimpleBinding.mock.calls[0] as unknown as [{ action: { body: Record<string, unknown> } }])[0];
    expect(firstEdit.action.body).not.toHaveProperty("bri");

    view.unmount();
    saveSimpleBinding.mockClear();
    const secondView = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(secondView.getByTestId("dimmer-binding-summary-binding:1"));
    fireEvent.changeText(secondView.getByTestId("dimmer-target-filter-binding:1"), "Reading Lamp");
    fireEvent.press(within(secondView.getByTestId("dimmer-target-binding:1")).getByText("Light: Reading Lamp"));
    fireEvent.press(secondView.getByTestId("dimmer-save-binding:1"));
    await waitFor(() => expect(saveSimpleBinding).toHaveBeenCalledWith(expect.objectContaining({
      action: expect.objectContaining({ address: "/lights/1/state" }),
    })));
    const secondEdit = (saveSimpleBinding.mock.calls[0] as unknown as [{ action: { body: Record<string, unknown> } }])[0];
    expect(secondEdit.action.body).toEqual({ on: false, bri: 120 });
  });

  test("keeps target collections compact until the user filters them", () => {
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:0"));
    const target = view.getByTestId("dimmer-target-binding:0");
    expect(within(target).getByText("Light: Reading Lamp")).toBeTruthy();
    expect(within(target).queryByText("Group: Living Room")).toBeNull();
    fireEvent.changeText(view.getByTestId("dimmer-target-filter-binding:0"), "Living Room");
    expect(within(target).getByText("Group: Living Room")).toBeTruthy();
    fireEvent.press(within(target).getByText("Group: Living Room"));
    expect(view.getByTestId("dimmer-target-filter-binding:0").props.value).toBe("");
    expect(within(target).getByText("Group: Living Room")).toBeTruthy();
    expect(within(target).queryByText("Light: Reading Lamp")).toBeNull();
  });

  test("repairs one characterized missing target while locking the existing action", async () => {
    screenSnapshot = { ...fixture, lights: {} };
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:0"));
    const binding = view.getByTestId("dimmer-edit-binding:0");
    expect(within(binding).getByText(/original target was deleted/i)).toBeTruthy();
    expect(within(binding).getByLabelText(/Action to preserve: Turn on/i)).toBeTruthy();
    expect(within(binding).queryByText("Turn off")).toBeNull();
    expect(within(binding).getByText("Repair target")).toBeTruthy();
    expect(within(binding).getByText("Replacement target")).toBeTruthy();
    expect(within(binding).getByText("Group: Living Room")).toBeTruthy();
    expect(within(binding).queryByTestId("dimmer-target-filter-binding:0")).toBeNull();
    expect(view.getByTestId("dimmer-save-binding:0").props.accessibilityState).toEqual({ disabled: true });

    fireEvent.press(within(view.getByTestId("dimmer-target-binding:0")).getByText("Group: Living Room"));
    expect(view.getByTestId("dimmer-save-binding:0").props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(view.getByTestId("dimmer-save-binding:0"));

    await waitFor(() => expect(saveSimpleBinding).toHaveBeenCalledWith(expect.objectContaining({
      ruleId: "10",
      action: { address: "/groups/2/action", method: "PUT", body: { on: true } },
    })));
    expect(view.getByTestId("dimmer-message-binding:0")).toHaveTextContent("Target repaired and refreshed.");
  });

  test("does not offer repair for a missing target in a non-characterized Rule shape", () => {
    screenSnapshot = {
      ...fixture,
      lights: {},
      rules: {
        ...fixture.rules,
        "10": {
          ...(fixture.rules["10"] as Record<string, unknown>),
          actions: [
            { address: "/lights/1/state", method: "PUT", body: { on: true } },
            { address: "/sensors/5/state", method: "PUT", body: { status: 0 } },
          ],
        },
      },
    };
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    expect(view.queryByTestId("dimmer-edit-binding:0")).toBeNull();
    expect(view.queryByText("Repair target")).toBeNull();
  });

  test("preserves an in-progress binding draft across foreground refreshes", async () => {
    let refresh: (() => void) | undefined;
    stateStore.subscribe.mockImplementationOnce((listener?: () => void) => {
      refresh = listener;
      return jest.fn();
    });
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:0"));
    const binding = view.getByTestId("dimmer-edit-binding:0");
    fireEvent.press(within(binding).getByText("Turn off"));

    act(() => refresh?.());

    fireEvent.press(view.getByTestId("dimmer-save-binding:0"));
    await waitFor(() => expect(saveSimpleBinding).toHaveBeenCalledWith(expect.objectContaining({
      action: expect.objectContaining({ body: { on: false } }),
    })));
  });

  test("offers a configurable relative brightness action", async () => {
    screenSnapshot = {
      ...fixture,
      rules: {
        ...fixture.rules,
        "15": {
          conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1004" }],
          actions: [{ address: "/lights/1/state", method: "PUT", body: { bri_inc: 30 } }],
        },
      },
    };
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:5"));
    const binding = view.getByTestId("dimmer-edit-binding:5");
    fireEvent.press(within(binding).getByText("Brighten while held"));
    expect(view.queryByTestId("dimmer-binding:5-bri-inc-exact")).toBeNull();
    fireEvent.press(view.getByTestId("dimmer-binding:5-bri-inc-exact-toggle"));
    fireEvent.changeText(view.getByTestId("dimmer-binding:5-bri-inc-exact"), "40");
    fireEvent.press(view.getByTestId("dimmer-save-binding:5"));
    await waitFor(() => expect(saveSimpleBinding).toHaveBeenCalledWith(expect.objectContaining({
      action: expect.objectContaining({ body: { bri_inc: 40 } }),
    })));
  });

  test("builds a Scene-cycle preview from selected slots and ignores direct route operations", async () => {
    const structuralCatalog = {
      models: [{
        ...catalog.models[0],
        controls: catalog.models[0].controls.map((control) => control.id === "three"
          ? { ...control, gestures: [{ id: "cycle", event: 1005, label: "Pressed", bindingKind: "structural" as const, structuralFormId: "scene-cycle" }] }
          : control),
        structuralForms: [{
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
          buildChangeSet: ({ edit, model: editorModel, snapshot }: any) => {
            const sceneIds = Array.isArray(edit.values?.sceneIds) ? edit.values.sceneIds : [];
            if (sceneIds.length !== 2 || sceneIds.some((id: unknown) => typeof id !== "string" || id.trim() === "" || /[/?#]/.test(id))) return undefined;
            const cycleBindings = editorModel.advanced.bindings.filter((candidate: any) => candidate.classification === "recognized_structural"
              && candidate.structuralFormId === "scene-cycle"
              && typeof candidate.advanced.ruleId === "string");
            if (cycleBindings.length !== 2) return undefined;
            const actions = sceneIds.map((id: string) => {
              const scene = snapshot.scenes[id] && typeof snapshot.scenes[id] === "object" ? snapshot.scenes[id] : {};
              return buildRuleActionFromTarget("scene", id, "activate", undefined, { type: scene.type, group: scene.group });
            });
            return {
              deviceKey: editorModel.deviceKey,
              summary: `Cycle through ${sceneIds.join(",")}`,
              operations: cycleBindings.map((binding: any, index: number) => ({
                  kind: "rule" as const,
                  id: binding.advanced.ruleId,
                  operation: "update" as const,
                  payload: { actions: [actions[index]] },
                  label: `Update Scene cycle Rule ${index + 1}`,
              })),
            };
          },
        }],
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
    stateStore.getAll.mockReturnValue(new Map([
      ...Object.entries(structuralSnapshot.sensors).map(([id, value]) => [`sensor:${id}`, { state: { status: "known", value }, pending: false }] as const),
      ...Object.entries(structuralSnapshot.lights).map(([id, value]) => [`light:${id}`, { state: { status: "known", value }, pending: false }] as const),
      ...Object.entries(structuralSnapshot.groups).map(([id, value]) => [`group:${id}`, { state: { status: "known", value }, pending: false }] as const),
      ...Object.entries(structuralSnapshot.scenes).map(([id, value]) => [`scene:${id}`, { state: { status: "known", value }, pending: false }] as const),
      ...Object.entries(structuralSnapshot.rules).map(([id, value]) => [`rule:${id}`, { state: { status: "known", value }, pending: false }] as const),
    ]));
    mockRuntime.service.dimmerCatalog = structuralCatalog as any;
    const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:5"));
    const fields = view.getByTestId("dimmer-structural-fields-binding:5");
    fireEvent.press(within(fields).getAllByText("Scene: Calm")[0]);
    fireEvent.press(within(fields).getAllByText("Scene: Relaxed")[1]);
    fireEvent.press(view.getByTestId("dimmer-structural-binding:5"));
    await waitFor(() => expect(view.getByTestId("dimmer-structural-preview")).toBeTruthy());
    expect(view.getByText("Cycle through scene-relaxed,scene-evening")).toBeTruthy();
    fireEvent.press(view.getByTestId("dimmer-structural-confirm-trigger"));
    fireEvent.press(view.getByLabelText("Confirm"));
    await waitFor(() => expect(commitStructuralEdit).toHaveBeenCalledTimes(1));
    const submitted = (commitStructuralEdit.mock.calls as unknown as Array<[StructuralDimmerEdit]>)[0]?.[0];
    expect(submitted?.changeSet?.operations.map((operation) => operation.operation)).toEqual(["update", "update"]);
    expect(submitted?.changeSet?.operations.map((operation) => operation.id)).toEqual(["16", "17"]);
    expect(submitted?.changeSet?.operations.map((operation) => operation.payload)).toEqual([
      { actions: [{ address: "/groups/0/action", method: "PUT", body: { scene: "scene-relaxed" } }] },
      { actions: [{ address: "/groups/2/action", method: "PUT", body: { scene: "scene-evening" } }] },
    ]);

    const bypass = render(<ConfigureDimmerScreen route={{ params: {
      sensorId: "4",
      structuralEdit: {
        deviceKey: "acme-dimmer:physical-a",
        operations: [{ kind: "rule", id: "10", operation: "delete", label: "Unrelated delete" }],
      },
    } }} navigation={{ navigate: jest.fn() }} />);
    expect(bypass.queryByTestId("dimmer-structural-preview")).toBeNull();
  });
});
