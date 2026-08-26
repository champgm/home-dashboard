import React from "react";
import { View } from "react-native";
import { useAppRuntime } from "../AppContext";
import { ResourceCollectionScreen } from "./ResourceCollectionScreen";
import { HueSearchStatusView } from "../components/HueSearchStatus";
export function LightsScreen({ navigation }: { navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  return <View style={{ backgroundColor: "#002b36", flex: 1 }}><HueSearchStatusView kind="lights" /><ResourceCollectionScreen kind="light" title="Lights" navigation={navigation} canCreate={false} onSearch={() => runtime.service.startHueSearch("lights")} /></View>;
}
