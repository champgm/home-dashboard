import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

let lifecycleListener: (() => void) | undefined;
const mockRuntime = {
  service: {
    isForeground: true,
    subscribeLifecycle: jest.fn((listener: () => void) => { lifecycleListener = listener; return jest.fn(); }),
    getHueSearchStatus: jest.fn(async () => ({ kind: "lights", active: true, recent: true, raw: {} })),
  },
};

jest.mock("../../../src/ui/AppContext", () => ({ useAppRuntime: () => mockRuntime }));

import { HueSearchStatusView } from "../../../src/ui/components/HueSearchStatus";

describe("Hue search status UI", () => {
  beforeEach(() => {
    mockRuntime.service.isForeground = true;
    mockRuntime.service.getHueSearchStatus.mockClear();
    lifecycleListener = undefined;
  });

  test("shows active status and polls only while foreground", async () => {
    jest.useFakeTimers();
    const view = render(<HueSearchStatusView kind="lights" />);
    await waitFor(() => expect(view.getByText("A bridge search is active.")).toBeTruthy());
    const calls = mockRuntime.service.getHueSearchStatus.mock.calls.length;
    act(() => jest.advanceTimersByTime(1000));
    await waitFor(() => expect(mockRuntime.service.getHueSearchStatus.mock.calls.length).toBeGreaterThan(calls));
    mockRuntime.service.isForeground = false;
    act(() => lifecycleListener?.());
    const backgroundCalls = mockRuntime.service.getHueSearchStatus.mock.calls.length;
    act(() => jest.advanceTimersByTime(3000));
    expect(mockRuntime.service.getHueSearchStatus.mock.calls.length).toBe(backgroundCalls);
    view.unmount();
    jest.useRealTimers();
  });

  test("does not leave a passive recent-search banner visible", async () => {
    mockRuntime.service.getHueSearchStatus.mockResolvedValue({ kind: "lights", active: false, recent: true, raw: { lastscan: "recent" } });
    const view = render(<HueSearchStatusView kind="lights" />);
    await act(async () => undefined);
    expect(view.queryByText(/recent search/i)).toBeNull();
  });
});
