import _ from "lodash";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  View,
} from "react-native";
import AwesomeButton from "react-native-really-awesome-button";

export interface Props {
  title: string;
}

interface State {
  on: boolean;
}

export class ItemButton extends React.Component<Props, State> {
  render() {
    const { height, width } = Dimensions.get("window");
    const margin = width * .01;
    const buttonDimension = width * .2;
    const editButtonDimension = buttonDimension / 3;
    return (
      <View style={[styles.buttonContainer, {
        marginBottom: margin * 4,
        marginLeft: margin,
        marginRight: margin,
        marginTop: margin * 4,
        width: buttonDimension,
        height: buttonDimension,
        maxHeight: buttonDimension,
        maxWidth: buttonDimension,
      }]}>
        <AwesomeButton
          paddingHorizontal={5}
          height={buttonDimension}
          width={buttonDimension}
          onPress={() => console.log("Clicked")}>
          {this.props.title}
        </AwesomeButton>
        <AwesomeButton
          backgroundColor="#3399ff"
          backgroundDarker="#0000ff"
          style={{
            width: buttonDimension / 3,
            height: buttonDimension / 3,
            top: -(buttonDimension / 5.5),
            left: buttonDimension * .75,
          }}
          height={editButtonDimension}
          width={editButtonDimension}>
          <Image
            style={{
              width: editButtonDimension * .8,
              height: editButtonDimension * .8,
            }}
            source={require("../../assets/edit.png")} />
        </AwesomeButton>
        <AwesomeButton
          backgroundColor="#ffcc66"
          backgroundDarker="#ff9900"
          style={{
            width: buttonDimension / 3,
            height: buttonDimension / 3,
            top: -(editButtonDimension + buttonDimension / 5.5),
            left: -(buttonDimension * .06),
          }}
          height={editButtonDimension}
          width={editButtonDimension}>
          <Image
            style={{
              width: editButtonDimension * .8,
              height: editButtonDimension * .8,
            }}
            source={require("../../assets/favorite.png")} />
        </AwesomeButton>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {},
  favoriteButton: {
    bottom: 70,
  },
});