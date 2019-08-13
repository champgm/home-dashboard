import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import { NavigationContainerProps, NavigationNavigatorProps } from "react-navigation";
import v4 from "uuid/v4";
import { sortBy } from "../common";
import { GroupsApi } from "../hue/GroupsApi";
import { LightsApi } from "../hue/LightsApi";
import { Group, Groups } from "../models/Group";
import { Lights } from "../models/Light";
import { ItemButton } from "./common/Button";
import { GroupEditor } from "./editor/GroupEditor";

interface State {
  groups?: Groups;
  allLights?: Lights;
}

export const key = "groups";
export const title = "Groups";
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
    console.log(`Getting groups and lights`);
    const groupsPromise = this.groupsApi.getAll();
    const allLightsPromise = this.lightsApi.getAll();
    const groups = await groupsPromise;
    console.log(`groups: ${JSON.stringify(groups, null, 2)}`);
    const allLights = await allLightsPromise;
    this.setState({ groups, allLights });
    this.props.navigation.navigate("Editor", { id: "3" });
  }

  onClick(id: string) {

  }

  onEditClick(id: string) {
    console.log(`Edit clicked`);
    this.props.navigation.navigate("Editor", { id });
  }

  onFavoriteClick(id: string) {
    console.log(`favorite clicked`);
  }
  changeLights(lights: string[]) {
    console.log(`setting group.lights`);
    console.log(`to: ${lights}`);

  }

  onEditCancel() {
    console.log(`edit canceled`);
  }

  async onEditSubmit(id: string) {
    console.log(`edit submitted`);
    // Do something here first
  }

  render() {
    const groupButtons = this.state.groups
      ? sortBy(Object.values(this.state.groups), "name")
        .map((group) => {
          return (
            <ItemButton
              id={group.id}
              key={`group-${group.id}`}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={this.onFavoriteClick.bind(this)}
              title={group.name}
            />
          );
        })
      : <ActivityIndicator size="large" color="#0000ff" />;

    const { height, width } = Dimensions.get("window");

    return (
      // <View style={[styles.scene, { paddingTop: height * .02 }]} >
      <View style={[styles.scene]} >
        {groupButtons}
        {/* <GroupModal
          groupsApi={this.props.groupsApi}
          lightsApi={this.props.lightsApi}
          visible={this.state.modalVisible}
          key={this.state.groupBeingEdited}
          id={this.state.groupBeingEdited}
          onEditCancel={this.onEditCancel.bind(this)}
          onEditSubmit={this.onEditSubmit.bind(this)}
        /> */}
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
