import _ from "lodash";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import { RgbBaseStringMap } from "solarizer/tsc-out/RgbMaps";
import v4 from "uuid/v4";
import { sortBy } from "../common";
import { GroupsApi } from "../hue/GroupsApi";
import { LightsApi } from "../hue/LightsApi";
import { getStatus, Groups } from "../models/Group";
import { register } from "./common/Alerter";
import { ItemButton } from "./common/Button";
import { grey, orange, yellow } from "./common/Style";
import { Status } from "./editor/components/StatusToggle";

interface State {
  groups?: Groups;
}

export class GroupsComponent extends React.Component<NavigationContainerProps & NavigationNavigatorProps<any>, State> {
  title: any;
  lightsApi: LightsApi;
  groupsApi: GroupsApi;

  constructor(props: NavigationContainerProps & NavigationNavigatorProps<any>) {
    super(props);
    this.title = v4();
    this.state = {};
    this.groupsApi = new GroupsApi();
    this.lightsApi = new LightsApi();
  }

  async componentDidMount() {
    console.log(`Groups did mount`);
    register("Groups", this.updateGroups.bind(this));
    await this.pollGroups();
  }

  async pollGroups() {
    console.log(`Polling groups...`);
    await this.updateGroups();
    setTimeout(() => {
      this.pollGroups();
    }, 5000);
  }

  async updateGroups() {
    this.setState({ groups: await this.groupsApi.getAll() });
  }

  async onClick(id: string) {
    switch (getStatus(this.state.groups[id])) {
      case Status.ON: await this.groupsApi.putAction(id, { on: false }); break;
      case Status.OFF: await this.groupsApi.putAction(id, { on: true }); break;
      case Status.INDETERMINATE: await this.groupsApi.putAction(id, { on: true }); break;
      default:
        console.log(`Invalid group state: ${JSON.stringify(this.state.groups[id], null, 2)}`);
        break;
    }
    this.setState({ groups: await this.groupsApi.getAll() });
  }

  onEditClick(id: string) {
    console.log(`Edit clicked`);
    this.props.navigation.navigate("GroupEditor", { id });
  }

  onFavoriteClick(id: string) {
    console.log(`favorite clicked`);
  }

  render() {
    const groupButtons = this.state.groups
      ? sortBy(Object.values(this.state.groups), "name")
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
              id={group.id}
              colorMap={colorMap}
              key={`group-${group.id}`}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={this.onFavoriteClick.bind(this)}
              title={group.name}
            />
          );
        })
      : <ActivityIndicator size="large" color="#0000ff" />;
    return (
      <View style={[styles.scene]} >
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
