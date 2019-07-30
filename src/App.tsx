import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  View,
} from "react-native";
import { Route, SceneMap, TabView } from "react-native-tab-view";
import * as Lights from "./tabs/Lights";

import bridgeConfiguration from "./configuration/Hue.json";
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

export class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      index: 0,
      routes: [
        { ...Lights },
        { key: "first", title: "First" },
        { key: "second", title: "Second" },
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
            [Lights.key]: () => (<Lights.Component lights={lightsApi.getAll()} />),
            first: FirstRoute,
            second: SecondRoute,
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
