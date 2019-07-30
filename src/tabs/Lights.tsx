import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import { Route, SceneMap, TabView } from "react-native-tab-view";
import v4 from "uuid/v4";
import { ItemButton } from "../common/Button";
import { Lights } from "../models/Light";

export interface Props {
  lights: Promise<Lights>;
}

interface State {
  lights?: Lights;
}

export const key = "lights";
export const title = "Lights";
export class Component extends React.Component<Props, State> {
  title: any;

  constructor(props: Props) {
    super(props);
    this.title = v4();
    this.state = {};
  }

  componentWillMount() {
    this.props.lights.then((lights) => {
      this.setState({ lights });
    });
  }

  render() {
    const lightButtons = this.state.lights
      ? Object.keys(this.state.lights).map((lightId) => {
        const light = this.state.lights[lightId];
        return (
          <ItemButton
            key={v4()}
            title={light.name}
          />
        );
      })
      : <ActivityIndicator size="large" color="#0000ff" />;

    const { height, width } = Dimensions.get("window");
    return (
      <View style={[styles.scene, { paddingTop: height * .02 }]} >
        {lightButtons}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  scene: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ff4081",
    flex: 1,
  },
});
