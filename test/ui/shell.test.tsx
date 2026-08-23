import React from "react";
import { render } from "@testing-library/react-native";
import { ResourceTile } from "../../src/ui/components/ResourceTile";

describe("modern UI shell components", () => {
  test("renders the full-tile unknown indication without treating it as Off", () => {
    const view = render(<ResourceTile ref={{ kind: "light", id: "1" }} title="Unreachable light" />);
    expect(view.getByText("?")).toBeTruthy();
    expect(view.getByText("Unknown")).toBeTruthy();
  });
});
