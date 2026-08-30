import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ResourceCollectionScreen } from "../../../src/ui/screens/ResourceCollectionScreen";

const stateStore = {
  getAll: jest.fn(),
  get: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
};
const configStore = {
  getCommitted: jest.fn(() => ({ bridge: {}, plugs: [], favorites: [] })),
  subscribe: jest.fn(() => jest.fn()),
};
const mockRuntime = {
  service: { stateStore, dimmerCatalog: undefined as any, performPrimary: jest.fn(), refreshHue: jest.fn(), addFavorite: jest.fn(), removeFavorite: jest.fn() },
  configStore,
};
jest.mock("../../../src/ui/AppContext", () => ({ useAppRuntime: () => mockRuntime }));

const catalog = {
  models: [{
    id: "recognized",
    label: "Recognized dimmer",
    modelIds: ["DIM-1"],
    controls: [{ id: "press", label: "Press", gestures: [{ id: "one", event: 1000, label: "Pressed" }] }],
    identityKey: (sensor: { uniqueid?: string }) => sensor.uniqueid,
  }],
};

describe("Sensor dimmer routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stateStore.getAll.mockReturnValue(new Map([
      ["sensor:4", { state: { status: "known", value: { name: "Wall switch", type: "ZLLSwitch", modelid: "DIM-1", uniqueid: "physical-a", state: { buttonevent: 1000 } } }, pending: false }],
      ["sensor:9", { state: { status: "known", value: { name: "Temperature", type: "ZLLTemperature", modelid: "OTHER" } }, pending: false }],
    ]));
    mockRuntime.service.dimmerCatalog = catalog;
  });

  test("recognized member opens Configure Dimmer while ordinary Sensor opens SensorEditor", async () => {
    const navigate = jest.fn();
    const view = render(<ResourceCollectionScreen kind="sensor" title="Sensors" navigation={{ navigate }} />);
    const editButtons = view.getAllByLabelText("Edit");
    editButtons[1].parent?.parent?.props.onPress?.();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("ConfigureDimmer", expect.objectContaining({ sensorId: "4", deviceKey: "recognized:physical-a" })));
    navigate.mockClear();
    view.getAllByLabelText("Edit")[0].parent?.parent?.props.onPress?.();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("SensorEditor", { id: "9" }));
  });

  test("a recognized dimmer primary tap opens Configure Dimmer without toggling Sensor config", async () => {
    const navigate = jest.fn();
    const view = render(<ResourceCollectionScreen kind="sensor" title="Sensors" navigation={{ navigate }} />);
    view.getByLabelText("Wall switch").parent?.parent?.props.onPress?.();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("ConfigureDimmer", expect.objectContaining({ sensorId: "4", deviceKey: "recognized:physical-a" })));
    expect(mockRuntime.service.performPrimary).not.toHaveBeenCalled();

    navigate.mockClear();
    view.getByLabelText("Temperature").parent?.parent?.props.onPress?.();
    await waitFor(() => expect(mockRuntime.service.performPrimary).toHaveBeenCalledWith({ kind: "sensor", id: "9" }));
    expect(navigate).not.toHaveBeenCalled();
  });
});
