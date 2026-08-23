import React from "react";
import { ResourceCollectionScreen } from "./ResourceCollectionScreen";
export function ScenesScreen({ navigation }: { navigation?: any }): JSX.Element {
  return <ResourceCollectionScreen kind="scene" title="Scenes" navigation={navigation} canCreate />;
}
