import React from "react";
import { EditorForm } from "./EditorForm";
export function GroupEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  return <EditorForm title="Group Editor" kind="group" id={route?.params?.id} navigation={navigation} note="Group membership and metadata use changed-field-only updates." />;
}
