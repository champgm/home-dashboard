import { Dimensions, ViewStyle } from "react-native";

export function getStyles() {
  const { height, width } = Dimensions.get("window");
  const widthMargin = width * .1;
  const heightMargin = height * .0125;

  const fieldRowContainerStyle: ViewStyle = {
    marginLeft: widthMargin,
    marginRight: widthMargin,
  };
  const fieldRowStyle: ViewStyle = {
    marginBottom: heightMargin,
    flexDirection: "row",
    height: 40,
  };
  const labelStyle: ViewStyle = {
    marginRight: widthMargin / 2,
  };
  const inputStyle: ViewStyle = {
    paddingLeft: widthMargin / 4,
  };
  const lockedInputStyle: ViewStyle = {
    paddingLeft: widthMargin / 4,
    backgroundColor: "#d8d8d8",
  };

  return {
    fieldRowContainerStyle,
    fieldRowStyle,
    inputStyle,
    labelStyle,
    lockedInputStyle,
  };
}
