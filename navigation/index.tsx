import { FontAwesome } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { ColorSchemeName, Pressable } from 'react-native';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import NotFoundScreen from '../screens/NotFoundScreen';
import TabFavoritesScreen from '../screens/TabFavoritesScreen';
import TabLightsScreen from '../screens/TabLightsScreen';
import TabGroupsScreen from '../screens/TabGroupsScreen';
import { RootStackParamList, RootTabParamList, RootTabScreenProps } from '../types';
import LinkingConfiguration from './LinkingConfiguration';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '../components/Themed';
import LightEditor from '../screens/editor/LightEditor';
import GroupEditor from '../screens/editor/GroupEditor';

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Root" component={TopTabView} options={{ headerShown: false }} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="LightEditor" component={LightEditor} />
        <Stack.Screen name="GroupEditor" component={GroupEditor} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

function TopTabView() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{flex: 1, paddingTop: insets.top, 
                            paddingLeft: insets.left, 
                            paddingRight: insets.right, 
                            paddingBottom: insets.bottom}}>
      <TopTabNavigator />
    </View>
  )
}

const TopTab = createMaterialTopTabNavigator<RootTabParamList>();

function TopTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <TopTab.Navigator
      initialRouteName="Favorites"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
      }}>
      <TopTab.Screen
        name="Favorites"
        component={TabFavoritesScreen}
        options={{
          title: 'FAVORITES',
          tabBarIcon: ({ color }) => <TabBarIcon name="bookmark-o" color={color} />,
        }}
      />
      <TopTab.Screen
        name="Lights"
        component={TabLightsScreen}
        options={{
          title: 'LIGHTS',
          tabBarIcon: ({ color }) => <TabBarIcon name="lightbulb-o" color={color} />,
        }}
      />
      <TopTab.Screen
        name="Groups"
        component={TabGroupsScreen}
        options={{
          title: 'GROUPS',
          tabBarIcon: ({ color }) => <TabBarIcon name="object-group" color={color} />,
        }}
      />
    </TopTab.Navigator>
  );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={20}  {...props} />;
}
