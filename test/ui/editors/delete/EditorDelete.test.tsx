import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockRuntime = {
  service: {
    stateStore: {
      get: jest.fn(() => ({ state: { status: "known", value: { name: "Kitchen light" } }, pending: false })),
    },
    deleteHue: jest.fn(),
  },
  configStore: {
    mutate: jest.fn(async () => ({ status: "success" })),
  },
};

jest.mock("../../../../src/ui/AppContext", () => ({
  useAppRuntime: () => mockRuntime,
}));

import { EditorForm } from "../../../../src/ui/editors/EditorForm";
import { HueDeleteAction } from "../../../../src/ui/components/HueDeleteAction";

describe("Hue editor destructive actions", () => {
  beforeEach(() => {
    mockRuntime.service.deleteHue.mockReset().mockResolvedValue({ kind: "success" });
    mockRuntime.configStore.mutate.mockClear();
  });

  test("existing editor opens confirmation, cancel does not delete, confirm deletes once", async () => {
    const navigation = { goBack: jest.fn() };
    const view = render(<HueDeleteAction kind="light" id="1" objectName="Kitchen light" navigation={navigation} />);

    fireEvent.press(view.getByLabelText("Delete Kitchen light"));
    expect(view.getByText("Kitchen light: delete it from the bridge and remove its matching local Favorite when possible")).toBeTruthy();
    expect(mockRuntime.service.deleteHue).not.toHaveBeenCalled();

    fireEvent.press(view.getByLabelText("Cancel"));
    expect(mockRuntime.service.deleteHue).not.toHaveBeenCalled();

    fireEvent.press(view.getByLabelText("Delete Kitchen light"));
    fireEvent.press(view.getByLabelText("Confirm"));
    await waitFor(() => expect(mockRuntime.service.deleteHue).toHaveBeenCalledTimes(1));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  test("existing Hue editor exposes Delete while create mode does not", () => {
    const existing = render(<EditorForm title="Group Editor" kind="group" id="7" />);
    expect(existing.getByTestId("editor-delete")).toBeTruthy();
    existing.unmount();

    const create = render(<EditorForm title="Group Editor" kind="group" />);
    expect(create.queryByTestId("editor-delete")).toBeNull();
  });
});
