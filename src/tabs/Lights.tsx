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
import { deregister, register } from "./common/Alerter";
import { ItemButton } from "./common/Button";
import { getFavoriteArray, toggleFavorite } from "./common/Favorites";
import { lights } from "./common/HueState";
import { grey, yellow } from "./common/Style";

interface State {
  lights?: Lights;
  favorites: string[];
}

export class LightsComponent extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  title: any;
  lightsApi: LightsApi;

  constructor(props: NavigationContainerProps & NavigationNavigatorProps<any>) {
    super(props);
    this.title = v4();
    this.state = { favorites: [] };
    this.lightsApi = new LightsApi();
  }

  componentWillUnmount() { deregister("Lights"); }
  async componentDidMount() {
    console.log(`Lights did mount`);
    register("Lights", this.updateLights.bind(this));
  }

  async updateLights() {
    this.setState({
      lights,
      favorites: await getFavoriteArray("favoriteLights"),
    });
  }

  async onClick(id: string) {
    await this.lightsApi.putState(id, { on: !this.state.lights[id].state.on });
    await this.updateLights();
  }

  onEditClick(id: string) {
    console.log(`Edit clicked`);
    this.props.navigation.navigate("LightEditor", { id });
  }

  onFavoriteClick(id: string) {
    console.log(`favorite clicked`);
  }

  render() {
    const lightButtons = this.state.lights
      ? sortBy(Object.values(this.state.lights), "name")
        .map((light) => {
          return (
            <ItemButton
              isFavorite={this.state.favorites.includes(light.id)}
              id={light.id}
              key={`light-${light.id}`}
              colorMap={light.state.on ? yellow : grey}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={(id: string) => toggleFavorite("favoriteLights", id)}
              title={light.name}
              reachable={light.state.reachable}
            />
          );
        }).concat(
          <ItemButton
            colorMap={grey}
            key={`light-SCAN`}
            onClick={this.lightsApi.searchForNew}
            title={"Scan for new lights"}
            reachable={true}
            hideEditButton={true}
            hideFavoritesButton={true}
          />,
        )
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
