import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import {
  Button,
  Dimensions,
  StyleSheet, View,
} from "react-native";
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
    return (
      <View style={styles.buttonContainer}>
        <Button
          key={v4()}
          onPress={() => console.log("Clicked")}
          title={this.props.title}
          color={"#bababa"}
          accessibilityLabel={this.props.title}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    paddingBottom: 10,
    maxWidth: 133,
  },
  button: {
    width: 88,
    height: 88,
    maxHeight: 88,
    maxWidth: 88,
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
