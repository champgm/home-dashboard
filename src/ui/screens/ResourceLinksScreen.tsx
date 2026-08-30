import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useAppRuntime } from "../AppContext";
import { Screen, EmptyState } from "../components/Screen";
import { EditorAction, EditorSection, EditorSummaryRow } from "../editors/editorControls";

export function ResourceLinksScreen({ navigation }: { navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const [, setVersion] = useState(0);
  useEffect(() => runtime.service.stateStore.subscribe(() => setVersion((value) => value + 1)), [runtime]);
  const links: Array<[string, any]> = [];
  runtime.service.stateStore.getAll().forEach((state, key) => {
    if (key.startsWith("resourcelink:")) links.push([key.slice("resourcelink:".length), state]);
  });
  return (
    <Screen showTitle={false} title="Resource Links">
      <EditorAction label="New Resource Link" onPress={() => navigation?.navigate("ResourceLinkEditor")} testID="resource-links-new" />
      {links.length === 0 ? <EmptyState message="No Resource Links are currently available." /> : <EditorSection title="Current links">{links.map(([id, state]) => {
        const value = state.state.status === "known" ? state.state.value : undefined;
        return <View key={id} style={styles.row}>
          <EditorSummaryRow label={value?.description || `Resource Link ${id}`} value={state.state.status === "known" ? `ID ${id}` : "Unavailable"} testID={`resource-link-${id}`} />
          {state.state.status === "known" && <EditorAction label="Edit" onPress={() => navigation?.navigate("ResourceLinkEditor", { id })} testID={`resource-link-edit-${id}`} />}
        </View>;
      })}</EditorSection>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", borderBottomColor: "#586e75", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 60 },
});
