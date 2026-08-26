import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { EditorHueField, EditorRangeField, EditorXyColorField } from "../../../src/ui/editors/editorControls";

describe("editor range and color controls", () => {
  test("changes brightness through a bounded slider while retaining exact entry", () => {
    const onChange = jest.fn();
    const view = render(<EditorRangeField label="Brightness" maximumValue={254} minimumValue={1} onChange={onChange} testID="brightness" value={100} />);

    fireEvent(view.getByTestId("brightness-slider"), "valueChange", 180);
    expect(onChange).toHaveBeenLastCalledWith(180);

    fireEvent.changeText(view.getByTestId("brightness"), "181");
    expect(onChange).toHaveBeenLastCalledWith(181);
  });

  test("displays transition duration in seconds and converts exact entry to Hue deciseconds", () => {
    const onChange = jest.fn();
    const view = render(<EditorRangeField displayScale={0.1} label="Transition duration" maximumValue={600} minimumValue={0} onChange={onChange} testID="transition" unit="seconds" value={4} />);

    expect(view.getByText("Transition duration: 0.4 seconds")).toBeTruthy();
    fireEvent.changeText(view.getByTestId("transition"), "1.5");
    expect(onChange).toHaveBeenCalledWith(15);
  });

  test("offers color-oriented Hue and XY choices with exact-value fallbacks", () => {
    const changeHue = jest.fn();
    const changeXy = jest.fn();
    const hue = render(<EditorHueField label="Hue color" onChange={changeHue} testID="hue" value={20} />);
    fireEvent.press(hue.getByLabelText("Hue color: Blue"));
    expect(changeHue).toHaveBeenCalledWith(43690);
    hue.unmount();

    const xy = render(<EditorXyColorField label="XY color" onChangeText={changeXy} testID="xy" value="0.4,0.5" />);
    fireEvent.press(xy.getByLabelText("XY color: Green"));
    expect(changeXy).toHaveBeenCalledWith("0.17,0.7");
  });
});
