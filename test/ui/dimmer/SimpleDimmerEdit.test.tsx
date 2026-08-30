import React from "react";
import { fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { HueSnapshot } from "../../../src/app/types";
import { DimmerBindingRecognitionInput } from "../../../src/protocol/hue/dimmer";
import fixtureData from "../../fixtures/dimmer/synthetic-recognized.json";

const fixture = fixtureData as HueSnapshot;
const simpleForm = {
  actionIndex: 0,
  actions: [
    { kind: "on" as const, targetKinds: ["light", "group"] as const, fields: ["on"] as const },
    { kind: "off" as const, targetKinds: ["light", "group"] as const, fields: ["on"] as const },
  ],
  matchesRule: ({ rule, conditionIndex }: DimmerBindingRecognitionInput): boolean => rule.conditions.length === 1
    && rule.actions.length === 1
    && conditionIndex === 0,
};
const catalog = {
  models: [{
    id: "acme-dimmer",
    label: "Acme four-control dimmer",
    manufacturerNames: ["Acme"],
    modelIds: ["DIM-1"],
    sensorTypes: ["ZLLSwitch"],
    identityKey: (sensor: { uniqueid?: string }) => sensor.uniqueid,
    controls: [{ id: "one", label: "Top button", gestures: [{ id: "press", event: 1000, label: "Pressed", simpleForm }] }],
  }],
};

const stateStore = {
  getAll: jest.fn(() => new Map(Object.entries({
    ...Object.fromEntries(Object.entries(fixture.sensors).map(([id, value]) => [`sensor:${id}`, { state: { status: "known", value }, pending: false }])),
    ...Object.fromEntries(Object.entries(fixture.lights).map(([id, value]) => [`light:${id}`, { state: { status: "known", value }, pending: false }])),
    ...Object.fromEntries(Object.entries(fixture.groups).map(([id, value]) => [`group:${id}`, { state: { status: "known", value }, pending: false }])),
    ...Object.fromEntries(Object.entries(fixture.scenes).map(([id, value]) => [`scene:${id}`, { state: { status: "known", value }, pending: false }])),
    ...Object.fromEntries(Object.entries(fixture.rules).map(([id, value]) => [`rule:${id}`, { state: { status: "known", value }, pending: false }])),
  }))),
  subscribe: jest.fn(() => jest.fn()),
};
const saveSimpleBinding = jest.fn(async () => ({ kind: "success" as const }));
const mockRuntime = {
  service: { stateStore, dimmerCatalog: catalog, saveSimpleBinding },
  configStore: { getCommitted: jest.fn(() => ({ bridge: {}, plugs: [], favorites: [] })), subscribe: jest.fn(() => jest.fn()) },
};

jest.mock("../../../src/ui/AppContext", () => ({ useAppRuntime: () => mockRuntime }));

import { ConfigureDimmerScreen } from "../../../src/ui/screens/ConfigureDimmerScreen";

test("Save on a recognized binding is direct and does not render a structural preview", async () => {
  const view = render(<ConfigureDimmerScreen route={{ params: { sensorId: "4" } }} navigation={{ navigate: jest.fn() }} />);
  fireEvent.press(view.getByTestId("dimmer-binding-summary-binding:0"));
  fireEvent.changeText(view.getByTestId("dimmer-target-filter-binding:0"), "Living Room");
  fireEvent.press(within(view.getByTestId("dimmer-target-binding:0")).getByText("Group: Living Room"));
  fireEvent.press(view.getByTestId("dimmer-save-binding:0"));
  await waitFor(() => expect(saveSimpleBinding).toHaveBeenCalledTimes(1));
  expect(saveSimpleBinding).toHaveBeenCalledWith(expect.objectContaining({ ruleId: "10", actionIndex: 0 }));
  expect(view.queryByTestId("dimmer-structural-preview")).toBeNull();
});
