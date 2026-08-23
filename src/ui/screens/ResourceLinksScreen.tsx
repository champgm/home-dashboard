import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppRuntime } from "../AppContext";
import { Screen, EmptyState } from "../components/Screen";
import { ResourceRef } from "../../app/types";
import { ConfirmDestructiveAction } from "../components/ConfirmDestructiveAction";
import { destructiveActionSpec, performConfirmedHueDelete } from "../../app/destructiveActions";

export function ResourceLinksScreen({ navigation }: { navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const [, setVersion] = useState(0);
  useEffect(() => runtime.service.stateStore.subscribe(() => setVersion((value) => value + 1)), [runtime]);
  const links: Array<[string, any]> = [];
  const [deleteId, setDeleteId] = useState<string>();
  runtime.service.stateStore.getAll().forEach((state, key) => {
    if (key.startsWith("resourcelink:")) links.push([key.slice("resourcelink:".length), state]);
  });
  return (
    <Screen title="Resource Links">
      <Pressable onPress={() => navigation?.navigate("ResourceLinkEditor")} style={styles.button}><Text style={styles.buttonText}>New Resource Link</Text></Pressable>
      {links.length === 0 ? <EmptyState message="No Resource Links are currently available." /> : links.map(([id, state]) => {
        const value = state.state.status === "known" ? state.state.value : undefined;
        return <View key={id} style={styles.row}><Text style={styles.text}>{value?.description || id}</Text><View style={styles.actions}><Pressable onPress={() => navigation?.navigate("ResourceLinkEditor", { id })}><Text style={styles.edit}>Edit</Text></Pressable><Pressable onPress={() => setDeleteId(id)}><Text style={styles.delete}>Delete</Text></Pressable></View></View>;
      })}
      <ConfirmDestructiveAction visible={Boolean(deleteId)} onCancel={() => setDeleteId(undefined)} onConfirmed={() => setDeleteId(undefined)} spec={deleteId ? destructiveActionSpec(`Resource Link ${deleteId}`, "Resource Link", "delete it from the bridge and remove its matching local Favorite when possible", () => performConfirmedHueDelete(runtime.service, runtime.configStore, "resourcelink", deleteId, () => runtime.service.deleteHue("resourcelink", deleteId))) : undefined} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, marginBottom: 12, padding: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { alignItems: "center", borderBottomColor: "#586e75", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  text: { color: "#fdf6e3" },
  edit: { color: "#b58900", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 16 },
  delete: { color: "#dc322f", fontWeight: "700" },
});
