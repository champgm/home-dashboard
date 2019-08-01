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
import { ItemButton } from "./common/Button";
import { GroupModal } from "./modal/GroupModal";

export interface Props {
  groupsApi: GroupsApi;
  lightsApi: LightsApi;
}

interface State {
  groups?: Groups;
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
    this.setState({ groups });
  }

  onClick(id: string) {

  }

  onEditClick(id: string) {
    // console.log(`Calling edit`);
    this.setState({
      modalVisible: true,
      groupBeingEdited: id,
    });

    setTimeout(() => {
      this.onEditCancel();
    }, 4000);
  }

  onFavoriteClick(id: string) {

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
    return (
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
