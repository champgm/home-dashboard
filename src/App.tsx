import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import { Route, SceneMap, TabView } from "react-native-tab-view";
import * as Groups from "./tabs/Groups";
import { GroupsComponent } from "./tabs/Groups";
import * as Lights from "./tabs/Lights";
import { LightsComponent } from "./tabs/Lights";

import bridgeConfiguration from "./configuration/Hue.json";
import { GroupsApi } from "./hue/GroupsApi";
import { LightsApi } from "./hue/LightsApi";

export interface Props { }

interface State {
  index: number;
  routes: Route[];
}

const FirstRoute = () => (
  <View style={[styles.scene, { backgroundColor: "#ff4081" }]} />
);

const SecondRoute = () => (
  <View style={[styles.scene, { backgroundColor: "#673ab7" }]} />
);
const ThirdRoute = () => (
  <View style={[styles.scene, { backgroundColor: "#673117" }]} />
);

export class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      index: 1,
      routes: [
        { ...Lights },
        { ...Groups },
      ],
    };
  }

  render() {
    const lightsApi = new LightsApi();
    const groupsApi = new GroupsApi();
    return (
      <View style={styles.root}>
        <TabView
          navigationState={this.state}
          renderScene={SceneMap({
            [Lights.key]: () => (<LightsComponent lights={lightsApi.getAll()} />),
            [Groups.key]: () => (<GroupsComponent groups={groupsApi.getAll()} />),
          })}
          onIndexChange={(index) => this.setState({ index })}
          initialLayout={{ width: Dimensions.get("window").width }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    paddingTop: Constants.statusBarHeight,
    flex: 1,
  },
  scene: {
    flex: 1,
  },
});
