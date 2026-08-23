import React from "react";
import { ResourceCollectionScreen } from "./ResourceCollectionScreen";
import { HueSearchStatusView } from "../components/HueSearchStatus";
import { View } from "react-native";
export function SensorsScreen({ navigation }: { navigation?: any }): JSX.Element {
  return <View style={{ backgroundColor: "#002b36", flex: 1 }}><HueSearchStatusView kind="sensors" /><ResourceCollectionScreen kind="sensor" title="Sensors" navigation={navigation} canCreate /></View>;
}
