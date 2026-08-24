import React from "react";
import { render } from "@testing-library/react-native";
import { DiagnosticsPanel } from "../../../src/ui/components/DiagnosticsPanel";

describe("DiagnosticsPanel", () => {
  test("renders stable, bounded diagnostic fields without undefined noise", () => {
    const view = render(<DiagnosticsPanel diagnostics={[{
      key: "plug:left",
      category: "Timeout",
      operation: "Plug refresh",
      resource: "left",
      elapsedMs: 5000,
      message: "The local device did not finish before the five-second deadline.",
      detail: "The endpoint timed out.",
    }]} />);

    expect(view.getByText("Timeout · Plug refresh")).toBeTruthy();
    expect(view.getByText("Endpoint: left")).toBeTruthy();
    expect(view.getByText("Elapsed: 5000 ms")).toBeTruthy();
    expect(view.getByText("The endpoint timed out.")).toBeTruthy();
    expect(view.queryByText(/undefined/)).toBeNull();
  });

  test("does not render an empty panel", () => {
    expect(render(<DiagnosticsPanel diagnostics={[]} />).toJSON()).toBeNull();
  });
});
