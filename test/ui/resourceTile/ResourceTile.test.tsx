import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ResourceTile } from "../../../src/ui/components/ResourceTile";
import { getLegacyTileMetrics } from "../../../src/ui/theme/legacyDashboard";

describe("legacy ResourceTile grammar", () => {
  test.each([
    ["On", { on: true }, "#b58900"],
    ["Off", { on: false }, "#586e75"],
    ["Known", { brightness: 180 }, "#268bd2"],
  ])("maps %s to the established state color", (title, value, color) => {
    const view = render(<ResourceTile title={title} stored={{ state: { status: "known", value }, pending: false }} onPress={jest.fn()} />);
    const main = view.getByLabelText(title);
    expect(main.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ backgroundColor: color })]));
  });

  test("uses orange for a valid indeterminate group", () => {
    const view = render(<ResourceTile ref={{ kind: "group", id: "1" }} title="Mixed" stored={{ state: { status: "known", value: { state: { any_on: true, all_on: false } } }, pending: false }} onPress={jest.fn()} />);
    expect(view.getByLabelText("Mixed").props.style).toEqual(expect.arrayContaining([expect.objectContaining({ backgroundColor: "#cb4b16" })]));
  });

  test("renders retained image assets for unknown, favorite, and edit controls", () => {
    const view = render(<ResourceTile title="Missing" missing onFavorite={jest.fn()} onEdit={jest.fn()} />);
    expect(view.getByTestId("resource-unknown-icon").props.source).toBeDefined();
    expect(view.getByTestId("resource-favorite-icon").props.source).toBeDefined();
    expect(view.getByTestId("resource-edit-icon").props.source).toBeDefined();
  });

  test("does not place a decorative bulb behind an On light title", () => {
    const view = render(<ResourceTile ref={{ kind: "light", id: "1" }} title="Lamp" stored={{ state: { status: "known", value: { state: { on: true } } }, pending: false }} />);
    expect(view.queryByLabelText("Light bulb")).toBeNull();
  });

  test("corner actions do not invoke the primary action", async () => {
    const onPress = jest.fn();
    const onFavorite = jest.fn();
    const onEdit = jest.fn();
    const view = render(<ResourceTile title="Lamp" onPress={onPress} onFavorite={onFavorite} onEdit={onEdit} />);
    fireEvent.press(view.getByLabelText("Add Favorite"));
    fireEvent.press(view.getByLabelText("Edit"));
    await waitFor(() => {
      expect(onFavorite).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
    expect(onPress).not.toHaveBeenCalled();
  });

  test("derives compact responsive geometry from the window width", () => {
    expect(getLegacyTileMetrics(432).tile).toBe(77);
    expect(getLegacyTileMetrics(432).tile).not.toBe(160);
  });

  test("does not use Unicode action glyphs", () => {
    const view = render(<ResourceTile title="Lamp" onFavorite={jest.fn()} onEdit={jest.fn()} />);
    expect(view.queryByText(/[★☆✎⌫]/)).toBeNull();
  });
});
