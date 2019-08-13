
import { Dimensions, TextStyle, ViewStyle } from "react-native";
import { createBasesFromColor, rgb, rgbStrings as solarized } from "solarizer";

const blue = createBasesFromColor(rgb.blue, "base01");
console.log(`blue${JSON.stringify(blue, null, 2)}`);
const red = createBasesFromColor(rgb.red, "base01");
console.log(`red${JSON.stringify(red, null, 2)}`);
const green = createBasesFromColor(rgb.green, "base01");
console.log(`green${JSON.stringify(green, null, 2)}`);

const showBorder = {
  borderColor: "#000000",
  borderRadius: 5,
  borderWidth: 2,
};

export function getStyles() {
  const { height, width } = Dimensions.get("window");
  const widthMargin = width * .1;
  const heightMargin = height * .0125;

  const background: ViewStyle = {
    backgroundColor: solarized.base03,
  };

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

  // Title
  const titleRow: ViewStyle = {
    marginBottom: heightMargin,
    flexDirection: "column",
    justifyContent: "center",
    height: 80,
  };
  const titleLabel: TextStyle = {
    fontWeight: "bold",
    fontSize: 20,
    color: solarized.base0,
    textAlign: "center",
  };
  const titleInput: TextStyle = {
    textAlign: "center",
    color: solarized.base0,
    flex: 1,
    fontSize: 30,
    marginLeft: widthMargin,
    marginRight: widthMargin,
    textAlignVertical: "center",
    borderBottomColor: solarized.base02,
    borderBottomWidth: 2,
    borderBottomLeftRadius: 5,
  };

  // Status toggle
  const statusToggleRow: ViewStyle = {
    // ...showBorder,
    alignSelf: "center",
    marginBottom: heightMargin,
    flexDirection: "row",
    justifyContent: "space-between",
    height: 50,
    width: width * .6,
  };

  const label: TextStyle = {
    ...showBorder,
    paddingLeft: widthMargin / 4,
    marginRight: widthMargin / 2,
    textAlignVertical: "center",
  };
  const input: TextStyle = {
    ...showBorder,
    paddingLeft: widthMargin / 4,
    textAlignVertical: "center",
    flex: 1,
  };
  const lockedInput: TextStyle = {
    ...showBorder,
    backgroundColor: "#d8d8d8",
    flex: 1,
    paddingLeft: widthMargin / 4,
    textAlignVertical: "center",
  };
  const toggle: TextStyle = {
    ...showBorder,
  };
  const lockedToggle: TextStyle = {
    ...showBorder,
  };
  const multiSelect: ViewStyle = {
    ...showBorder,
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  };
  const multiSelectRow: ViewStyle = {
    ...showBorder,
    flex: 1,
    marginBottom: heightMargin,
    flexDirection: "column",
    justifyContent: "flex-start",
  };
  return {
    height,
    width,
    background,
    heightMargin,

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
    titleRow,
    titleLabel,
    titleInput,
    showBorder,
    statusToggleRow,

    solarized,
    red,
    blue,
    green,

  };
}
