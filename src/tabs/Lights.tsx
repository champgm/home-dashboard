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
import { sortBy } from "../common";
import { ItemButton } from "../common/Button";
import { Light, Lights } from "../models/Light";

export interface Props {
  lights: Promise<Lights>;
}

interface State {
  lights?: Lights;
}

export const key = "lights";
export const title = "Lights";
export class LightsComponent extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.props.lights.then((lights) => {
      this.setState({ lights });
    });
  }

  render() {
    const lightButtons = this.state.lights
      ? sortBy(Object.values(this.state.lights), "name")
        .map((light) => {
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

  // sortByName(lights: Light[]): Light[] {
  //   return lights.sort((lightA, lightB) => {
  //     if (lightA.name < lightB.name) { return -1; }
  //     if (lightA.name > lightB.name) { return 1; }
  //     return 0;
  //   });
  // }
}

const styles = StyleSheet.create({
  scene: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#000000",
    flex: 1,
  },
});
