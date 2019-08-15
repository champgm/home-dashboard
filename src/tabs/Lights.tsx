import _ from "lodash";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import v4 from "uuid/v4";
import { sortBy } from "../common";
import { LightsApi } from "../hue/LightsApi";
import { Lights } from "../models/Light";
import { register } from "./common/Alerter";
import { ItemButton } from "./common/Button";
import { grey, yellow } from "./common/Style";

interface State {
  lights?: Lights;
}

export class LightsComponent extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  title: any;
  lightsApi: LightsApi;

  constructor(props: NavigationContainerProps & NavigationNavigatorProps<any>) {
    super(props);
    this.title = v4();
    this.state = {};
    this.lightsApi = new LightsApi();
    this.lightsApi = new LightsApi();
  }

  async componentDidMount() {
    console.log(`Lights did mount`);
    register(this.updateLights.bind(this));
    await this.pollLights();
  }
  async pollLights() {
    console.log(`Polling lights...`);
    await this.updateLights();
    setTimeout(() => {
      this.pollLights();
    }, 5000);
  }
  async updateLights() {
    this.setState({ lights: await this.lightsApi.getAll() });
  }

  onClick(id: string) {

  }

  onEditClick(id: string) {
    console.log(`Edit clicked`);
    this.props.navigation.navigate("LightEditor", { id });
  }

  onFavoriteClick(id: string) {
    console.log(`favorite clicked`);
  }
  changeLights(lights: string[]) {
    console.log(`setting light.lights`);
    console.log(`to: ${lights}`);
  }

  onEditCancel() {
    console.log(`edit canceled`);
  }

  async onEditSubmit(id: string) {
    console.log(`edit submitted`);
  }

  render() {
    const lightButtons = this.state.lights
      ? sortBy(Object.values(this.state.lights), "name")
        .map((light) => {
          return (
            <ItemButton
              id={light.id}
              key={`light-${light.id}`}
              colorMap={light.state.on ? yellow : grey}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={this.onFavoriteClick.bind(this)}
              title={light.name}
            />
          );
        })
      : <ActivityIndicator size="large" color="#0000ff" />;
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
    backgroundColor: "#002b36",
    flex: 1,
  },
});
