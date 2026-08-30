import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

const stateStore = {
  get: jest.fn(),
  getAll: jest.fn(),
};
const mockRuntime = {
  service: {
    stateStore,
    dimmerCatalog: undefined as any,
    mutateHue: jest.fn(async () => ({ kind: "success" as const })),
    createHue: jest.fn(async () => ({ kind: "success" as const })),
    deleteHue: jest.fn(async () => ({ kind: "success" as const })),
  },
  configStore: { getCommitted: jest.fn(() => ({ bridge: {}, plugs: [], favorites: [] })) },
};
jest.mock("../../../src/ui/AppContext", () => ({ useAppRuntime: () => mockRuntime }));

import { SensorEditor } from "../../../src/ui/editors/SensorEditor";

const catalog = {
  models: [{
    id: "recognized",
    label: "Recognized dimmer",
    modelIds: ["DIM-1"],
    controls: [{ id: "press", label: "Top button", gestures: [{ id: "press", event: 1000, label: "Pressed" }] }],
    identityKey: (sensor: { uniqueid?: string }) => sensor.uniqueid,
  }],
};

test("SensorEditor leads with household details and exact Advanced references", () => {
  const sensor = { name: "Wall switch", type: "ZLLSwitch", modelid: "DIM-1", uniqueid: "physical-a", config: { on: true, battery: 80, reachable: true }, state: { buttonevent: 1000, lastupdated: "now" }, capabilities: { inputs: { events: [1000] } } };
  const rule = { name: "True binding", conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1000" }], actions: [], status: "enabled" };
  const falsePositive = { name: "Text mentions /sensors/4", conditions: [{ address: "/sensors/9/state/presence", operator: "eq", value: "true" }], actions: [] };
  stateStore.get.mockImplementation((ref: { kind: string; id?: string }) => ref.kind === "sensor" && ref.id === "4" ? { state: { status: "known", value: sensor }, pending: false } : undefined);
  stateStore.getAll.mockReturnValue(new Map([
    ["sensor:4", { state: { status: "known", value: sensor }, pending: false }],
    ["rule:10", { state: { status: "known", value: rule }, pending: false }],
    ["rule:99", { state: { status: "known", value: falsePositive }, pending: false }],
  ]));
  mockRuntime.service.dimmerCatalog = catalog;
  const navigation = { navigate: jest.fn() };
  const view = render(<SensorEditor route={{ params: { id: "4" } }} navigation={navigation} />);
  expect(view.getAllByText("Reachable").length).toBeGreaterThan(0);
  expect(view.getByText("80%")).toBeTruthy();
  expect(view.getByText("Configure Dimmer")).toBeTruthy();
  expect(view.getByText("1 current reference")).toBeTruthy();
  expect(view.queryByText("1000")).toBeNull();
  expect(view.queryByText(/Capabilities/)).toBeNull();
  fireEvent.press(view.getByTestId("sensor-advanced-toggle"));
  expect(view.getByLabelText(/Raw button event: 1000/)).toBeTruthy();
  expect(view.getByText(/rule \(exact reference/)).toBeTruthy();
  fireEvent.press(view.getByText("Configure Dimmer"));
  expect(navigation.navigate).toHaveBeenCalledWith("ConfigureDimmer", expect.objectContaining({ sensorId: "4", deviceKey: "recognized:physical-a" }));
});

test("Sensor numeric configuration keeps exact entry behind disclosure", () => {
  const sensor = { name: "Light-level sensor", type: "ZLLLightLevel", modelid: "DIM-1", uniqueid: "light-level-a", config: { on: true, tholddark: 10, tholdoffset: 2 } };
  stateStore.get.mockImplementation((ref: { kind: string; id?: string }) => ref.kind === "sensor" && ref.id === "7" ? { state: { status: "known", value: sensor }, pending: false } : undefined);
  stateStore.getAll.mockReturnValue(new Map([
    ["sensor:7", { state: { status: "known", value: sensor }, pending: false }],
  ]));
  mockRuntime.service.dimmerCatalog = catalog;
  const view = render(<SensorEditor route={{ params: { id: "7" } }} />);

  expect(view.getByTestId("sensor-config-tholddark")).toBeTruthy();
  expect(view.queryByTestId("sensor-config-tholddark-exact")).toBeNull();
  fireEvent.press(view.getByTestId("sensor-config-tholddark-exact-toggle"));
  expect(view.getByTestId("sensor-config-tholddark-exact")).toBeTruthy();
});
