import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

let stateListener: (() => void) | undefined;

const stateStore = {
  getAll: jest.fn(),
  get: jest.fn(),
  subscribe: jest.fn((listener: () => void) => {
    stateListener = listener;
    return jest.fn();
  }),
};
const configStore = {
  getCommitted: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
};
const mockRuntime = {
  service: {
    stateStore,
    refreshHue: jest.fn(),
    refreshConfiguredPlugs: jest.fn(),
    performPrimary: jest.fn(),
    addFavorite: jest.fn(async () => ({ kind: "success" })),
    removeFavorite: jest.fn(async () => ({ kind: "success" })),
    removePlugEndpoint: jest.fn(async () => ({ kind: "success" })),
  },
  configStore,
};

jest.mock("../../../src/ui/AppContext", () => ({
  useAppRuntime: () => mockRuntime,
}));

import { ResourceCollectionScreen } from "../../../src/ui/screens/ResourceCollectionScreen";
import { FavoritesScreen } from "../../../src/ui/screens/FavoritesScreen";
import { PlugsScreen } from "../../../src/ui/screens/PlugsScreen";
import { PlugAdministrationScreen } from "../../../src/ui/screens/PlugAdministrationScreen";

const lightState = {
  state: { status: "known", value: { name: "Kitchen light", state: { on: true } } },
  pending: false,
};

describe("dashboard tile integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stateListener = undefined;
    stateStore.getAll.mockReturnValue(new Map([["light:1", lightState]]));
    stateStore.get.mockImplementation((ref: { kind: string; id?: string; plugEndpointId?: string }) => {
      if (ref.kind === "light" && ref.id === "1") return lightState;
      return undefined;
    });
    configStore.getCommitted.mockReturnValue({ bridge: {}, plugs: [], favorites: [] });
  });

  test("Hue collection tile has primary, Favorite, and Edit but no Delete", () => {
    const view = render(<ResourceCollectionScreen kind="light" title="Lights" navigation={{ navigate: jest.fn() }} />);
    expect(view.getByLabelText("Kitchen light")).toBeTruthy();
    expect(view.getByLabelText("Add Favorite")).toBeTruthy();
    expect(view.getByLabelText("Edit")).toBeTruthy();
    expect(view.queryByText("Delete")).toBeNull();
    expect(view.queryByLabelText(/Delete/i)).toBeNull();
  });

  test("Hue resources arriving after the initial render replace the empty state", () => {
    stateStore.getAll.mockReturnValue(new Map());
    const view = render(<ResourceCollectionScreen kind="light" title="Lights" />);
    expect(view.getByText("No current resources. Refresh when the local bridge is reachable.")).toBeTruthy();

    stateStore.getAll.mockReturnValue(new Map([["light:1", lightState]]));
    act(() => stateListener?.());

    expect(view.getByLabelText("Kitchen light")).toBeTruthy();
    expect(view.queryByText("No current resources. Refresh when the local bridge is reachable.")).toBeNull();
  });

  test("renders search and navigation utilities with the same AwesomeButton primitive", async () => {
    const onSearch = jest.fn();
    const view = render(<ResourceCollectionScreen kind="light" title="Lights" onSearch={onSearch} />);
    expect(view.getByLabelText("Refresh")).toBeTruthy();
    expect(view.getByLabelText("Advanced")).toBeTruthy();
    fireEvent.press(view.getByLabelText("Scan for new lights"));
    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
  });

  test.each([4, 5, 20, 216])("wraps a representative %s-resource collection in the compact grid", (count) => {
    const entries = new Map(Array.from({ length: count }, (_, index) => [
      `light:${index + 1}`,
      { state: { status: "known", value: { name: `Light ${index + 1}`, state: { on: index % 2 === 0 } } }, pending: false },
    ]));
    stateStore.getAll.mockReturnValue(entries);
    const view = render(<ResourceCollectionScreen kind="light" title="Lights" />);
    expect(view.getByTestId("light-dashboard-grid")).toBeTruthy();
    expect(view.getAllByTestId("legacy-resource-primary")).toHaveLength(count + 2);
    view.unmount();
  });

  test("missing Favorite is removable and has no actionable primary tile", async () => {
    configStore.getCommitted.mockReturnValue({ bridge: {}, plugs: [], favorites: [{ kind: "light", id: "missing" }] });
    stateStore.get.mockReturnValue(undefined);
    const view = render(<FavoritesScreen navigation={{ navigate: jest.fn() }} />);
    expect(view.getByLabelText("Missing resource")).toBeTruthy();
    expect(view.getByLabelText("Remove Favorite")).toBeTruthy();
    fireEvent.press(view.getByLabelText("Remove Favorite"));
    await waitFor(() => expect(mockRuntime.service.removeFavorite).toHaveBeenCalledWith({ kind: "light", id: "missing" }));
  });

  test("plug tile has no inline Delete while administration keeps confirmed removal", async () => {
    const endpoint = { id: "plug-1", ipv4: "192.168.1.20", port: 9999 };
    configStore.getCommitted.mockReturnValue({ bridge: {}, plugs: [endpoint], favorites: [] });
    stateStore.get.mockReturnValue({ state: { status: "known", value: { alias: "Lamp", relayState: true } }, pending: false });
    const tile = render(<PlugsScreen navigation={{ navigate: jest.fn() }} />);
    expect(tile.getByLabelText("Edit")).toBeTruthy();
    expect(tile.queryByLabelText(/Delete/i)).toBeNull();
    tile.unmount();

    const admin = render(<PlugAdministrationScreen />);
    fireEvent.press(admin.getByText("Remove"));
    expect(mockRuntime.service.removePlugEndpoint).not.toHaveBeenCalled();
    fireEvent.press(admin.getByLabelText("Cancel"));
    expect(mockRuntime.service.removePlugEndpoint).not.toHaveBeenCalled();
    fireEvent.press(admin.getByText("Remove"));
    fireEvent.press(admin.getByLabelText("Confirm"));
    await waitFor(() => expect(mockRuntime.service.removePlugEndpoint).toHaveBeenCalledWith("plug-1"));
  });

  test("plug Refresh bypasses endpoint backoff", () => {
    const view = render(<PlugsScreen />);
    fireEvent.press(view.getByLabelText("Refresh"));
    return waitFor(() => expect(mockRuntime.service.refreshConfiguredPlugs).toHaveBeenCalledWith({ ignoreBackoff: true }));
  });
});
