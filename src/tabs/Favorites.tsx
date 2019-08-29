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
import { GroupsApi } from "../hue/GroupsApi";
import { LightsApi } from "../hue/LightsApi";
import { getStatus, Groups } from "../models/Group";
import { Lights } from "../models/Light";
import { Type, verify } from "../models/Type";
import { register } from "./common/Alerter";
import { ItemButton } from "./common/Button";
import { grey, yellow } from "./common/Style";
import { Status } from "./editor/components/StatusToggle";

interface State {
  lights?: Lights;
  groups?: Groups;
  favoriteLights: string[];
  favoriteGroups: string[];
}

export class LightsComponent extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
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

  async componentDidMount() {
    console.log(`Favorites did mount`);
    register("Favorites", this.update.bind(this));
    await this.poll();
  }

  async poll() {
    console.log(`Polling...`);
    await this.update();
    setTimeout(() => {
      this.poll();
    }, 5000);
  }

  async update() {
    const allLightsPromise = this.lightsApi.getAll();
    const allGroupsPromise = this.groupsApi.getAll();
    this.setState({
      lights: await allLightsPromise,
      groups: await allGroupsPromise,
    });
  }

  async onClick(id: string) {
    const typeAndId = id.split("的");
    const type = verify(typeAndId[0] as Type);
    switch (type) {
      case Type.GROUP:
        switch (getStatus(this.state.groups[id])) {
          case Status.ON: await this.groupsApi.putAction(id, { on: false }); break;
          case Status.OFF: await this.groupsApi.putAction(id, { on: true }); break;
          case Status.INDETERMINATE: await this.groupsApi.putAction(id, { on: true }); break;
          default:
            console.log(`Invalid group state: ${JSON.stringify(this.state.groups[id], null, 2)}`);
            break;
        }
        break;
      case Type.LIGHT:
        await this.lightsApi.putState(id, { on: !this.state.lights[id].state.on });
        break;
    }
    await this.update();
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
              id={`的${light.id}`}
              isFavorite={this.state.favoriteLights.includes(light.id)}
              key={`light-${light.id}`}
              colorMap={light.state.on ? yellow : grey}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={this.onFavoriteClick.bind(this)}
              title={light.name}
              reachable={light.state.reachable}
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
