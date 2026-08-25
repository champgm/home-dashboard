import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { LegacyResourceButton } from "../../src/ui/components/LegacyResourceButton";

describe("LegacyResourceButton", () => {
  test.each([
    ["on", "#b58900"],
    ["off", "#586e75"],
    ["known", "#268bd2"],
    ["indeterminate", "#cb4b16"],
  ] as const)("maps %s to its legacy face color", (state, color) => {
    const view = render(<LegacyResourceButton state={state} title={state} onPress={jest.fn()} />);
    expect(view.getByLabelText(state).props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ backgroundColor: color }),
    ]));
  });

  test("renders the full-tile Unknown treatment and disables unsafe primary action", () => {
    const onPress = jest.fn();
    const view = render(<LegacyResourceButton state="unknown" title="Missing" onPress={onPress} />);
    expect(view.getByTestId("resource-unknown-icon").props.source).toBeDefined();
    expect(view.getByLabelText("Missing").props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    expect(view.getByLabelText("Unknown resource state")).toBeTruthy();
    fireEvent.press(view.getByLabelText("Missing"));
    expect(onPress).not.toHaveBeenCalled();
  });

  test("keeps Favorite and Edit controls independent from the primary callback", async () => {
    const onPress = jest.fn();
    const onFavorite = jest.fn();
    const onEdit = jest.fn();
    const view = render(<LegacyResourceButton favorite title="Lamp" onEdit={onEdit} onFavorite={onFavorite} onPress={onPress} />);

    fireEvent.press(view.getByLabelText("Remove Favorite"));
    fireEvent.press(view.getByLabelText("Edit"));
    await waitFor(() => {
      expect(onFavorite).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
    expect(onPress).not.toHaveBeenCalled();
    expect(view.queryByLabelText(/Delete/i)).toBeNull();
    expect(view.queryByText(/[★☆✎⌫]/)).toBeNull();
  });

  test("anchors mini-button press targets at the legacy lower corners", () => {
    const view = render(<LegacyResourceButton title="Lamp" onEdit={jest.fn()} onFavorite={jest.fn()} />);
    expect(view.getByLabelText("Add Favorite").props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ left: expect.any(Number), position: "absolute", top: expect.any(Number) }),
    ]));
    expect(view.getByLabelText("Edit").props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ left: expect.any(Number), position: "absolute", top: expect.any(Number) }),
    ]));
    const [, favoriteSurface, editSurface] = view.getAllByTestId("aws-btn-content-2");
    expect(StyleSheet.flatten(favoriteSurface.props.style)).not.toEqual(expect.objectContaining({ position: "absolute" }));
    expect(StyleSheet.flatten(editSurface.props.style)).not.toEqual(expect.objectContaining({ position: "absolute" }));
  });

  test("hides optional mini controls for utility buttons", () => {
    const view = render(<LegacyResourceButton hideEdit hideFavorite title="Scan for new lights" onPress={jest.fn()} />);
    expect(view.queryByLabelText("Add Favorite")).toBeNull();
    expect(view.queryByLabelText("Edit")).toBeNull();
  });

  test("uses the yellow Favorite face when active and retains the light-bulb asset", () => {
    const view = render(<LegacyResourceButton favorite showLightBulb title="Kitchen" onFavorite={jest.fn()} />);
    expect(view.getByLabelText("Remove Favorite").props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ backgroundColor: "#b58900" }),
    ]));
    expect(view.getByLabelText("Light bulb").props.source).toBeDefined();
  });
});
