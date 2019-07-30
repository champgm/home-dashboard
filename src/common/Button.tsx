import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import {
  Button,
  Dimensions,
  StyleSheet, View,
} from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { Route, SceneMap, TabView } from "react-native-tab-view";
import v4 from "uuid/v4";

export interface Props {
  title: string;

}

interface State {
  on: boolean;
}

export class ItemButton extends React.Component<Props, State> {
  render() {
    const { height, width } = Dimensions.get("window");
    const padding = width * .01;
    const buttonDimension = 90;
    return (
      <View style={[styles.buttonContainer, {
        paddingBottom: padding,
        paddingLeft: padding,
        paddingRight: padding,
        paddingTop: padding,
      }]}>
        <View style={styles.button}>
          <AwesomeButton
            // key={v4()}
            height={buttonDimension}
            width={buttonDimension}
            stretch={true}
            onPress={() => console.log("Clicked")}>
            {this.props.title}
          </AwesomeButton>
        </View>
      </View>
    );
  }
}

const buttonSideLength = 90;
const styles = StyleSheet.create({
  buttonContainer: {
    // flex: 1,
    // paddingBottom: 100,
    maxWidth: 133,
  },
  button: {
    width: buttonSideLength,
    height: buttonSideLength,
    maxHeight: buttonSideLength,
    maxWidth: buttonSideLength,
  },
  editButton: {
    width: 33,
    height: 33,
    top: -40,
    left: 35,
  },
  favoriteButton: {
    bottom: 70,
  },
});
