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
import { Light, Lights } from "../models/Light";
import { ItemButton } from "./common/Button";
import { LightsModal } from "./LightsModal";

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
          let modalVisible = false;
          const toggleModalVisibility = () => {
            modalVisible = !modalVisible;
            console.log(`Modal visibility has been changed: ${modalVisible}`);
            // this.setState(this.state);
          };
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
      <View style={[styles.scene]} >
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
    backgroundColor: "#000000",
    flex: 1,
  },
});
