import React from "react";
import { ResourceCollectionScreen } from "./ResourceCollectionScreen";
export function SchedulesScreen({ navigation }: { navigation?: any }): JSX.Element {
  return <ResourceCollectionScreen kind="schedule" title="Schedules" navigation={navigation} canCreate />;
}
