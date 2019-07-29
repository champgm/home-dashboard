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

import huejay from "huejay";
import bridgeConfiguration from "./configuration/Hue.json";

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
    const client = new huejay.Client({
      host: bridgeConfiguration.bridgeIp,
      port: bridgeConfiguration.bridgePort,               // Optional
      username: bridgeConfiguration.bridgeToken, // Optional
      timeout: 15000,            // Optional, timeout in milliseconds (15000 is the default)
    });
    client.lights.getAll()
  .then((lights) => {
    for (const light of lights) {
      console.log(`Light [${light.id}]: ${light.name}`);
      console.log(`  Type:             ${light.type}`);
      console.log(`  Unique ID:        ${light.uniqueId}`);
      console.log(`  Manufacturer:     ${light.manufacturer}`);
      console.log(`  Model Id:         ${light.modelId}`);
      console.log("  Model:");
      console.log(`    Id:             ${light.model.id}`);
      console.log(`    Manufacturer:   ${light.model.manufacturer}`);
      console.log(`    Name:           ${light.model.name}`);
      console.log(`    Type:           ${light.model.type}`);
      console.log(`    Color Gamut:    ${light.model.colorGamut}`);
      console.log(`    Friends of Hue: ${light.model.friendsOfHue}`);
      console.log(`  Software Version: ${light.softwareVersion}`);
      console.log("  State:");
      console.log(`    On:         ${light.on}`);
      console.log(`    Reachable:  ${light.reachable}`);
      console.log(`    Brightness: ${light.brightness}`);
      console.log(`    Color mode: ${light.colorMode}`);
      console.log(`    Hue:        ${light.hue}`);
      console.log(`    Saturation: ${light.saturation}`);
      console.log(`    X/Y:        ${light.xy[0]}, ${light.xy[1]}`);
      console.log(`    Color Temp: ${light.colorTemp}`);
      console.log(`    Alert:      ${light.alert}`);
      console.log(`    Effect:     ${light.effect}`);
      console.log();
    }
  });
  }

  render() {

    return (
      <View style={styles.root}>
        <TabView
          navigationState={this.state}
          renderScene={SceneMap({
            [Lights.key]: () => (<Lights.Component />),
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
