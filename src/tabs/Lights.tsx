import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import { Route, SceneMap, TabView } from "react-native-tab-view";
import v4 from "uuid/v4";
import { ItemButton } from "../common/Button";

export interface Props {
}

interface State {
}

export const key = "lights";
export const title = "Lights";
export class Component extends React.Component<Props, State> {
  title: any;
  constructor(props: Props) {
    super(props);
    this.title = v4();

  }
  render() {

    return (
      <View style={[styles.scene, { backgroundColor: "#ff4081" }]} >
        <ItemButton
          title={this.title}
        ></ItemButton>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },
});
