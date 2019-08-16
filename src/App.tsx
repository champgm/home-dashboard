import Constants from "expo-constants";
import _ from "lodash";
import React from "react";
import { View } from "react-native";
import { Route } from "react-native-tab-view";
import {
  createAppContainer, createMaterialTopTabNavigator,
  createStackNavigator, NavigationContainer,
} from "react-navigation";
import { GroupEditor } from "./tabs/editor/GroupEditor";
import { LightEditor } from "./tabs/editor/LightEditor";
import { GroupsComponent } from "./tabs/Groups";
import { LightsComponent } from "./tabs/Lights";

export interface Props { }

interface State {
  index: number;
  routes: Route[];
}

const groupStack = createStackNavigator({
  Groups: GroupsComponent,
  GroupEditor,
}, { headerMode: "none" });

const lightStack = createStackNavigator({
  Lights: LightsComponent,
  LightEditor,
}, { headerMode: "none" });

export const AppContainer: NavigationContainer = createAppContainer(createMaterialTopTabNavigator(
  {
    Lights: lightStack,
    Groups: groupStack,
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
