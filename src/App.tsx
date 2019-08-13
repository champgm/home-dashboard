import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import { View } from "react-native";
import { Route } from "react-native-tab-view";
import {
  createAppContainer,
  createMaterialTopTabNavigator,
  createStackNavigator,
  NavigationContainer,
} from "react-navigation";

import { GroupsComponent } from "./tabs/Groups";
import { LightsComponent } from "./tabs/Lights";
import { GroupEditor } from "./tabs/editor/GroupEditor";

export interface Props { }

interface State {
  index: number;
  routes: Route[];
}

const groupStack = createStackNavigator({
  Home: GroupsComponent,
  Editor: GroupEditor,
}, { headerMode: "none" });

const lightStack = createStackNavigator({
  Home: LightsComponent,
});

export const AppContainer: NavigationContainer = createAppContainer(createMaterialTopTabNavigator(
  {
    Groups: groupStack,
    // Lights: lightStack,
  },
  {
    /* Other configuration remains unchanged */
  },
));

export class AppContainerContainer extends React.Component {
  constructor(props: Props) {
    super(props);
  }
  render() {
    return (
      <View style={{
        flex: 1,
        paddingTop: Constants.statusBarHeight,
      }}>
        <AppContainer />
      </View>);
  }
}
