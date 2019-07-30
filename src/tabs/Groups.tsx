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
import { ItemButton } from "../common/Button";
import { Group, Groups } from "../models/Group";

export interface Props {
  groups: Promise<Groups>;
}

interface State {
  groups?: Groups;
}

export const key = "groups";
export const title = "Groups";
export class Component extends React.Component<Props, State> {
  title: any;

  constructor(props: Props) {
    super(props);
    this.title = v4();
    this.state = {};
  }

  componentWillMount() {
    this.props.groups.then((groups) => {
      this.setState({ groups });
    });
  }

  render() {
    const groupButtons = this.state.groups
      ? this.sortByName(Object.values(this.state.groups))
        .map((group) => {
          console.log(`Attaching group: ${group.name}`);
          return (
            <ItemButton
              key={v4()}
              title={group.name}
            />
          );
        })
      : <ActivityIndicator size="large" color="#0000ff" />;

    const { height, width } = Dimensions.get("window");
    return (
      <View style={[styles.scene, { paddingTop: height * .02 }]} >
        {groupButtons}
      </View>
    );
  }

  sortByName(groups: Group[]): Group[] {
    return groups.sort((groupA, groupB) => {
      if (groupA.name < groupB.name) { return -1; }
      if (groupA.name > groupB.name) { return 1; }
      return 0;
    });
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
