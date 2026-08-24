import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { DashboardSurface } from "../../../src/ui/navigation/AppNavigation";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 0, left: 0 }),
}));

describe("Dashboard safe-area shell", () => {
  test("applies the top inset once to the Dashboard surface", () => {
    const view = render(<DashboardSurface><Text testID="tabs">Tabs</Text></DashboardSurface>);
    const surface = view.getByTestId("dashboard-surface");
    expect(surface.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ paddingTop: 24 }),
    ]));
    expect(view.getByTestId("tabs").props.style).toBeUndefined();
  });

  test("does not add a second inset to a native-stack child", () => {
    const view = render(<DashboardSurface><Text testID="native-stack-child">Native stack child</Text></DashboardSurface>);
    expect(view.getByTestId("native-stack-child").props.style).toBeUndefined();
  });
});
