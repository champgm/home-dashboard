import React from "react";
import { ResourceCollectionScreen } from "./ResourceCollectionScreen";
export function RulesScreen({ navigation }: { navigation?: any }): JSX.Element {
  return <ResourceCollectionScreen kind="rule" title="Rules" navigation={navigation} canCreate />;
}
