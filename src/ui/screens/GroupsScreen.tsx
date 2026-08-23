import React from "react";
import { ResourceCollectionScreen } from "./ResourceCollectionScreen";
export function GroupsScreen({ navigation }: { navigation?: any }): JSX.Element {
  return <ResourceCollectionScreen kind="group" title="Groups" navigation={navigation} canCreate />;
}
