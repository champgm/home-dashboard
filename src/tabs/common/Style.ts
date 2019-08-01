import { Dimensions, TextStyle, ViewStyle } from "react-native";

export function getStyles() {
  const { height, width } = Dimensions.get("window");
  const widthMargin = width * .1;
  const heightMargin = height * .0125;

  const fieldRowContainer: ViewStyle = {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    marginLeft: widthMargin,
    marginRight: widthMargin,
  };
  const fieldRow: ViewStyle = {
    marginBottom: heightMargin,
    flexDirection: "row",
    height: 40,
  };
  const label: TextStyle = {
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
  const lockedInput: ViewStyle = {
    paddingLeft: widthMargin / 4,
    backgroundColor: "#d8d8d8",
  };

  return {
    fieldRowContainer,
    fieldRow,
    input,
    label,
    lockedInput,
  };
}
