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
import { GroupEditor } from "./tabs/editor/GroupEditor";
import { LightEditor } from "./tabs/editor/LightEditor";
import { RuleEditor } from "./tabs/editor/RuleEditor";
import { SensorEditor } from "./tabs/editor/SensorEditor";
import { FavoritesComponent } from "./tabs/Favorites";
import { GroupsComponent } from "./tabs/Groups";
import { LightsComponent } from "./tabs/Lights";
import { RulesComponent } from "./tabs/Rules";
import { SensorsComponent } from "./tabs/Sensors";

export interface Props { }

interface State {
  index: number;
  routes: Route[];
}

const favoritesStack = createStackNavigator({
  Favorites: FavoritesComponent,
}, { headerMode: "none" });

const groupStack = createStackNavigator({
  Groups: GroupsComponent,
  GroupEditor,
}, { headerMode: "none" });

const lightStack = createStackNavigator({
  Lights: LightsComponent,
  LightEditor,
}, { headerMode: "none" });

const sensorStack = createStackNavigator({
  Sensors: SensorsComponent,
  SensorEditor,
}, { headerMode: "none" });

const ruleStack = createStackNavigator({
  Rules: RulesComponent,
  RuleEditor,
}, { headerMode: "none" });

export const AppContainer: NavigationContainer = createAppContainer(createMaterialTopTabNavigator(
  {
    Favorites: favoritesStack,
    Groups: groupStack,
    Lights: lightStack,
    Sensors: sensorStack,
    Rules: ruleStack,
  },
  {
    swipeEnabled: true,
    tabBarPosition:"bottom",
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
