import { ImageSourcePropType } from "react-native";

export const legacyButtonAssets: {
  readonly edit: ImageSourcePropType;
  readonly favorite: ImageSourcePropType;
  readonly questionMark: ImageSourcePropType;
  readonly lightBulb: ImageSourcePropType;
} = {
  edit: require("../../../assets/edit.png"),
  favorite: require("../../../assets/favorite.png"),
  questionMark: require("../../../assets/questionMark.png"),
  lightBulb: require("../../../assets/lightBulb.png"),
};
