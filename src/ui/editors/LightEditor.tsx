import React from "react";
import { EditorForm } from "./EditorForm";
export function LightEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  return <EditorForm title="Light Editor" kind="light" id={route?.params?.id} navigation={navigation} note="Only catalog-approved Light metadata and explicit state fields are writable." />;
}
