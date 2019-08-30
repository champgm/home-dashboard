import _ from "lodash";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import { RgbBaseStringMap } from "solarizer/tsc-out/RgbMaps";
import v4 from "uuid/v4";
import { revealAllProperties, sortBy } from "../common";
import { GroupsApi } from "../hue/GroupsApi";
import { LightsApi } from "../hue/LightsApi";
import { getStatus, Groups } from "../models/Group";
import { Lights } from "../models/Light";
import { Type, verify } from "../models/Type";
import { deregister, register } from "./common/Alerter";
import { ItemButton } from "./common/Button";
import { getFavoriteArray, toggleFavorite } from "./common/Favorites";
import { groups, lights } from "./common/HueState";
import { grey, orange, yellow } from "./common/Style";
import { Status } from "./editor/components/StatusToggle";

interface State {
  lights?: Lights;
  groups?: Groups;
  favoriteLights: string[];
  favoriteGroups: string[];
}

export class FavoritesComponent extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  title: any;
  lightsApi: LightsApi;
  groupsApi: GroupsApi;

  constructor(props: NavigationContainerProps & NavigationNavigatorProps<any>) {
    super(props);
    this.title = v4();
    this.state = {
      favoriteLights: [],
      favoriteGroups: [],
    };
    this.lightsApi = new LightsApi();
    this.groupsApi = new GroupsApi();
  }

  componentWillUnmount() { deregister("Favorites"); }
  async componentDidMount() {
    console.log(`Favorites did mount`);
    register("Favorites", this.update.bind(this));
  }

  async update() {
    this.setState({
      lights,
      groups,
      favoriteGroups: await getFavoriteArray("favoriteGroups"),
      favoriteLights: await getFavoriteArray("favoriteLights"),
    });
  }

  async onClick(typeAndIdString: string) {
    const typeAndId = typeAndIdString.split("的");
    const type = verify(typeAndId[0] as Type);
    const id = typeAndId[1];
    switch (type) {
      case Type.GROUP:
        switch (getStatus(this.state.groups[id])) {
          case Status.ON: await this.groupsApi.putAction(id, { on: false }); break;
          case Status.OFF: await this.groupsApi.putAction(id, { on: true }); break;
          case Status.INDETERMINATE: await this.groupsApi.putAction(id, { on: true }); break;
          default: console.log(`Invalid group state: ${JSON.stringify(this.state.groups[id], null, 2)}`); break;
        }
        break;
      case Type.LIGHT:
        await this.lightsApi.putState(id, { on: !this.state.lights[id].state.on });
        break;
    }
    await this.update();
  }

  onEditClick(typeAndIdString: string) {
    console.log(`Edit clicked`);
    const typeAndId = typeAndIdString.split("的");
    const type = verify(typeAndId[0] as Type);
    const id = typeAndId[1];
    switch (type) {
      case Type.GROUP: this.props.navigation.navigate("GroupEditor", { id }); break;
      case Type.LIGHT: this.props.navigation.navigate("LightEditor", { id }); break;
    }
  }

  onFavoriteClick(typeAndIdString: string) {
    console.log(`favorite clicked`);
    const typeAndId = typeAndIdString.split("的");
    const type = verify(typeAndId[0] as Type);
    const id = typeAndId[1];
    switch (type) {
      case Type.GROUP: toggleFavorite("favoriteGroups", id); break;
      case Type.LIGHT: toggleFavorite("favoriteLights", id); break;
    }
  }

  render() {
    const lightButtons = this.state.lights
      ? sortBy(Object.values(this.state.lights), "name")
        .filter((light) => this.state.favoriteLights.includes(light.id))
        .map((light) => {
          return (
            <ItemButton
              id={`${Type.LIGHT}的${light.id}`}
              isFavorite={true}
              key={`light-${light.id}`}
              colorMap={light.state.on ? yellow : grey}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={this.onFavoriteClick.bind(this)}
              title={light.name}
              reachable={light.state.reachable}
            />
          );
        }) : <ActivityIndicator size="large" color="#0000ff" />;
    const groupButtons = this.state.groups
      ? sortBy(Object.values(this.state.groups), "name")
        .filter((group) => this.state.favoriteGroups.includes(group.id))
        .map((group) => {
          let colorMap: RgbBaseStringMap;
          switch (getStatus(group)) {
            case Status.ON: colorMap = yellow; break;
            case Status.OFF: colorMap = grey; break;
            case Status.INDETERMINATE: colorMap = orange; break;
            default:
              break;
          }
          return (
            <ItemButton
              isFavorite={this.state.favoriteGroups.includes(group.id)}
              id={group.id}
              colorMap={colorMap}
              key={`group-${group.id}`}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={(id: string) => toggleFavorite("favoriteGroups", id)}
              title={group.name}
              reachable={true}
            />
          );
        })
      : <ActivityIndicator size="large" color="#0000ff" />;
    return (
      <View style={[styles.scene]} >
        {lightButtons}
        {groupButtons}
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
