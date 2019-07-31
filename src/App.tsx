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
    return (
      <View style={styles.root}>
        <TabView
          navigationState={this.state}
          renderScene={SceneMap({
            [Lights.key]: () => (
              <LightsComponent
                lights={lightsApi.getAll()} />
            ),
            [Groups.key]: () => (
              <GroupsComponent
                groupsApi={new GroupsApi()}
                lightsApi={new LightsApi()} />
            ),
          })}
          onIndexChange={(index) => this.setState({ index })}
          initialLayout={{ width: Dimensions.get("window").width }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: 16,
    color: "#657b83",
    fontSize: 20,
    fontWeight: "bold",
  },
  root: {
    paddingTop: Constants.statusBarHeight,
    flex: 1,
    backgroundColor: "#002b36",
  },
  scene: {
    flex: 1,
  },
});
