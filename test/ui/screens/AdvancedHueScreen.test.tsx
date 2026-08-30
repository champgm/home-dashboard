import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const readHueAdministration = jest.fn(async () => ({
  kind: "success" as const,
  value: { config: { name: "Bridge" }, capabilities: { lights: true } },
}));
const mockRuntime = {
  readiness: "Ready",
  service: {
    getDiagnostics: jest.fn(() => new Map()),
    readHueAdministration,
  },
  configStore: {
    getCommitted: jest.fn(() => ({ bridge: {}, plugs: [], favorites: [] })),
    subscribe: jest.fn(() => jest.fn()),
  },
  saveConfig: jest.fn(async () => true),
  resetLocalConfiguration: jest.fn(async () => true),
};

jest.mock("../../../src/ui/AppContext", () => ({ useAppRuntime: () => mockRuntime }));

import { AdvancedHueScreen } from "../../../src/ui/screens/AdvancedHueScreen";
import { BridgeConfigurationScreen } from "../../../src/ui/screens/BridgeConfigurationScreen";

test("routes Bridge capabilities to a screen with the authenticated read action", async () => {
  const navigation = { navigate: jest.fn() };
  const advanced = render(<AdvancedHueScreen navigation={navigation} />);
  fireEvent.press(advanced.getByTestId("advanced-bridge-capabilities"));
  expect(navigation.navigate).toHaveBeenCalledWith("BridgeConfiguration");
  advanced.unmount();

  const bridge = render(<BridgeConfigurationScreen />);
  expect(bridge.queryByTestId("bridge-read-configuration")).toBeNull();
  fireEvent.press(bridge.getByTestId("bridge-advanced-toggle"));
  fireEvent.press(bridge.getByTestId("bridge-read-configuration"));
  await waitFor(() => expect(readHueAdministration).toHaveBeenCalledTimes(1));
  expect(bridge.getByText(/\"name\": \"Bridge\"/)).toBeTruthy();
});
