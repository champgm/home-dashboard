import React from "react";
import { EditorForm } from "./EditorForm";
export function RuleEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  return <EditorForm title="Rule Editor" kind="rule" id={route?.params?.id} navigation={navigation} note="Conditions and actions are structured catalog values. Bridge administration, DELETE, and raw method/body editing are unavailable." />;
}
