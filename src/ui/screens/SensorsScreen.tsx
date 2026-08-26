import React from "react";
import { ResourceCollectionScreen } from "./ResourceCollectionScreen";
import { HueSearchStatusView } from "../components/HueSearchStatus";
import { View } from "react-native";
import { useAppRuntime } from "../AppContext";
export function SensorsScreen({ navigation }: { navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  return <View style={{ backgroundColor: "#002b36", flex: 1 }}><HueSearchStatusView kind="sensors" /><ResourceCollectionScreen kind="sensor" title="Sensors" navigation={navigation} canCreate onSearch={() => runtime.service.startHueSearch("sensors")} /></View>;
}
