import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import v4 from "uuid/v4";
import { sortBy } from "../common";
import { GroupsApi } from "../hue/GroupsApi";
import { LightsApi } from "../hue/LightsApi";
import { Group, Groups } from "../models/Group";
import { Lights } from "../models/Light";
import { ItemButton } from "./common/Button";
import { getMultiSelect, getMultiSelectRow } from "./modal";
import { GroupModal } from "./modal/GroupModal";

export interface Props {
  groupsApi: GroupsApi;
  lightsApi: LightsApi;
}

interface State {
  groups?: Groups;
  allLights?: Lights;
  modalVisible: boolean;
  groupBeingEdited: string;
}

export const key = "groups";
export const title = "Groups";
export class GroupsComponent extends React.Component<Props, State> {
  title: any;

  constructor(props: Props) {
    super(props);
    this.title = v4();
    this.state = {
      modalVisible: false,
      groupBeingEdited: "-1",
    };
  }

  async componentDidMount() {
    const groups = await this.props.groupsApi.getAll();
    const allLights = await this.props.lightsApi.getAll();
    this.setState({
      groups,
      allLights,
    });
  }

  onClick(id: string) {

  }

  onEditClick(id: string) {
    // console.log(`Calling edit`);
    this.setState({
      modalVisible: true,
      groupBeingEdited: id,
    });

    // setTimeout(() => {
    //   this.onEditCancel();
    // }, 6000);
  }

  onFavoriteClick(id: string) {

  }
  changeLights(lights: string[]) {
    console.log(`setting group.lights`);
    console.log(`to: ${lights}`);
    this.state.groups["4"].lights = lights;
    this.setState({
      groups: { ["4"]: this.state.groups["4"] },
    });
  }

  onEditCancel() {
    this.setState({
      modalVisible: false,
      groupBeingEdited: "-1",
    });
  }

  async onEditSubmit(id: string) {
    // Do something here first
    this.setState({
      modalVisible: false,
      groupBeingEdited: "-1",
    });
  }

  render() {
    const groupButtons = this.state.groups
      ? sortBy(Object.values(this.state.groups), "name")
        .map((group) => {
          return (
            <ItemButton
              id={group.id}
              key={v4()}
              onClick={this.onClick.bind(this)}
              onEditClick={this.onEditClick.bind(this)}
              onFavoriteClick={this.onFavoriteClick.bind(this)}
              title={group.name}
            />
          );
        })
      : <ActivityIndicator size="large" color="#0000ff" />;

    const { height, width } = Dimensions.get("window");

    const multiPicker = this.state.groups
      ? getMultiSelect(this.state.groups["4"].lights, Object.values(this.state.allLights), this.changeLights.bind(this))
      : <ActivityIndicator size="large" color="#0000ff" />;

    // <View>
    // {multiPicker}
    //       </View>

    return (
      <View>
        <View style={[styles.scene, { paddingTop: height * .02 }]} >
          {groupButtons}
          <GroupModal
            groupsApi={this.props.groupsApi}
            lightsApi={this.props.lightsApi}
            visible={this.state.modalVisible}
            key={this.state.groupBeingEdited}
            id={this.state.groupBeingEdited}
            onEditCancel={this.onEditCancel.bind(this)}
            onEditSubmit={this.onEditSubmit.bind(this)}
          />
        </View>
        <View>
          {multiPicker}
        </View>
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
