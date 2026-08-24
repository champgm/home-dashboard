import React, { PropsWithChildren } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { GroupsScreen } from "../screens/GroupsScreen";
import { LightsScreen } from "../screens/LightsScreen";
import { PlugsScreen } from "../screens/PlugsScreen";
import { RulesScreen } from "../screens/RulesScreen";
import { SchedulesScreen } from "../screens/SchedulesScreen";
import { ScenesScreen } from "../screens/ScenesScreen";
import { SensorsScreen } from "../screens/SensorsScreen";
import { AdvancedHueScreen } from "../screens/AdvancedHueScreen";
import { BridgeConfigurationScreen } from "../screens/BridgeConfigurationScreen";
import { ResourceLinksScreen } from "../screens/ResourceLinksScreen";
import { HueProvisioningScreen } from "../screens/HueProvisioningScreen";
import { HueReauthorizationScreen } from "../screens/HueReauthorizationScreen";
import { PlugAdministrationScreen } from "../screens/PlugAdministrationScreen";
import { LightEditor } from "../editors/LightEditor";
import { GroupEditor } from "../editors/GroupEditor";
import { SceneEditor } from "../editors/SceneEditor";
import { SensorEditor } from "../editors/SensorEditor";
import { RuleEditor } from "../editors/RuleEditor";
import { ScheduleEditor } from "../editors/ScheduleEditor";
import { PlugEditor } from "../editors/PlugEditor";
import { ResourceLinkEditor } from "../editors/ResourceLinkEditor";

const Tabs = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

export function DashboardSurface({ children }: PropsWithChildren<{}>): JSX.Element {
  const insets = useSafeAreaInsets();
  return <View testID="dashboard-surface" style={[styles.dashboardSurface, { paddingTop: insets.top }]}>{children}</View>;
}

function DashboardTabs(): JSX.Element {
  return (
    <DashboardSurface>
      <Tabs.Navigator
        initialRouteName="Favorites"
        screenOptions={{
          tabBarScrollEnabled: true,
          swipeEnabled: true,
          tabBarLabelStyle: { fontSize: 12 },
          tabBarStyle: { backgroundColor: "#073642" },
          tabBarActiveTintColor: "#b58900",
          tabBarInactiveTintColor: "#93a1a1",
        }}
      >
        <Tabs.Screen name="Favorites" component={FavoritesScreen} />
        <Tabs.Screen name="Lights" component={LightsScreen} />
        <Tabs.Screen name="Groups" component={GroupsScreen} />
        <Tabs.Screen name="Scenes" component={ScenesScreen} />
        <Tabs.Screen name="Sensors" component={SensorsScreen} />
        <Tabs.Screen name="Rules" component={RulesScreen} />
        <Tabs.Screen name="Schedules" component={SchedulesScreen} />
        <Tabs.Screen name="Plugs" component={PlugsScreen} />
      </Tabs.Navigator>
    </DashboardSurface>
  );
}

export function AppNavigation(): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#073642" }, headerTintColor: "#fdf6e3" }}>
        <Stack.Screen name="Dashboard" component={DashboardTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Advanced" component={AdvancedHueScreen} options={{ title: "Advanced / Bridge" }} />
        <Stack.Screen name="BridgeConfiguration" component={BridgeConfigurationScreen} options={{ title: "Bridge Configuration" }} />
        <Stack.Screen name="ResourceLinks" component={ResourceLinksScreen} options={{ title: "Resource Links" }} />
        <Stack.Screen name="HueProvisioning" component={HueProvisioningScreen} options={{ title: "Hue Provisioning" }} />
        <Stack.Screen name="HueReauthorization" component={HueReauthorizationScreen} options={{ title: "Hue Reauthorization" }} />
        <Stack.Screen name="PlugAdministration" component={PlugAdministrationScreen} options={{ title: "Plug Endpoints" }} />
        <Stack.Screen name="LightEditor" component={LightEditor} options={{ title: "Light" }} />
        <Stack.Screen name="GroupEditor" component={GroupEditor} options={{ title: "Group" }} />
        <Stack.Screen name="SceneEditor" component={SceneEditor} options={{ title: "Scene" }} />
        <Stack.Screen name="SensorEditor" component={SensorEditor} options={{ title: "Sensor" }} />
        <Stack.Screen name="RuleEditor" component={RuleEditor} options={{ title: "Rule" }} />
        <Stack.Screen name="ScheduleEditor" component={ScheduleEditor} options={{ title: "Schedule" }} />
        <Stack.Screen name="PlugEditor" component={PlugEditor} options={{ title: "Plug" }} />
        <Stack.Screen name="ResourceLinkEditor" component={ResourceLinkEditor} options={{ title: "Resource Link" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  dashboardSurface: { backgroundColor: "#002b36", flex: 1 },
});
