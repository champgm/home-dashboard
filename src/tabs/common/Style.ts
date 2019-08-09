
import { Dimensions, TextStyle, ViewStyle } from "react-native";
import { createBasesFromColor, rgb, rgbStrings as solarized } from "solarizer";

const blue = createBasesFromColor(rgb.blue, "base01");
const red = createBasesFromColor(rgb.red, "base01");
const green = createBasesFromColor(rgb.green, "base01");

const showBorder = {
  borderColor: "#000000",
  borderRadius: 5,
  borderWidth: 2,
};

export function getStyles() {
  const { height, width } = Dimensions.get("window");
  const widthMargin = width * .1;
  const heightMargin = height * .0125;

  const fieldRowContainer: ViewStyle = {
    ...showBorder,
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    marginLeft: widthMargin,
    marginRight: widthMargin,
  };
  const fieldRowSubContainer: ViewStyle = {
    ...showBorder,
    borderLeftColor: "#000000",
    borderLeftWidth: 2,
    flexDirection: "column",
    justifyContent: "center",
    marginLeft: widthMargin,
    marginRight: widthMargin,
  };
  const fieldRow: ViewStyle = {
    ...showBorder,
    marginBottom: heightMargin,
    flexDirection: "row",
    justifyContent: "flex-start",
    height: 40,
  };
  const label: TextStyle = {
    ...showBorder,
    paddingLeft: widthMargin / 4,
    marginRight: widthMargin / 2,
    textAlignVertical: "center",
  };
  const input: TextStyle = {
    paddingLeft: widthMargin / 4,
    textAlignVertical: "center",
    borderColor: "#000000",
    borderRadius: 5,
    borderWidth: 2,
    flex: 1,
  };
  const lockedInput: TextStyle = {
    backgroundColor: "#d8d8d8",
    borderColor: "#000000",
    borderRadius: 5,
    borderWidth: 2,
    flex: 1,
    paddingLeft: widthMargin / 4,
    textAlignVertical: "center",
  };
  const toggle: TextStyle = {
    ...showBorder,
    paddingLeft: widthMargin / 4,
    flex: 1,
  };
  const lockedToggle: TextStyle = {
    ...showBorder,
    paddingLeft: widthMargin / 4,
    flex: 1,
  };
  const multiSelect: ViewStyle = {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  };
  const multiSelectRow: ViewStyle = {
    ...showBorder,
    marginBottom: heightMargin,
    flexDirection: "row",
    justifyContent: "flex-start",
  };
  return {
    fieldRowContainer,
    fieldRowSubContainer,
    fieldRow,
    input,
    label,
    lockedInput,
    toggle,
    lockedToggle,
    multiSelect,
    multiSelectRow,

    solarized,
    red,
    blue,
    green,
  };
}
