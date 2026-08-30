import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { createEndpointId, validatePlugEndpoint, validatePort } from "../../config/endpointValidation";
import { useAppRuntime } from "../AppContext";
import { ConfirmDestructiveAction } from "../components/ConfirmDestructiveAction";
import { Screen } from "../components/Screen";
import { destructiveActionSpec } from "../../app/destructiveActions";
import { EditorAction, EditorSection, EditorSummaryRow, EditorTextField } from "../editors/editorControls";

export function PlugAdministrationScreen(): JSX.Element {
  const runtime = useAppRuntime();
  const [ipv4, setIpv4] = useState("");
  const [port, setPort] = useState("9999");
  const [editingId, setEditingId] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [removeId, setRemoveId] = useState<string>();
  const [, setVersion] = useState(0);
  useEffect(() => runtime.configStore.subscribe(() => setVersion((value) => value + 1)), [runtime]);
  const endpoints = runtime.configStore.getCommitted()?.plugs || [];
  const clearForm = (): void => { setEditingId(undefined); setIpv4(""); setPort("9999"); };
  return <Screen showTitle={false} title="Plug Endpoint Administration">
    <Text style={styles.note}>Private IPv4 endpoints only. Port defaults to 9999. Removal affects this phone's local configuration.</Text>
    <EditorSection title={editingId ? "Edit endpoint" : "Add endpoint"}>
    <EditorTextField keyboardType="numeric" label="Private IPv4" onChangeText={setIpv4} placeholder="192.168.x.x" testID="plug-admin-ipv4" value={ipv4} />
    <EditorTextField keyboardType="numeric" label="Port" onChangeText={setPort} placeholder="9999" testID="plug-admin-port" value={port} />
    <EditorAction label={editingId ? "Save endpoint" : "Add endpoint"} onPress={async () => {
      try {
        const endpoint = validatePlugEndpoint({ id: createEndpointId(ipv4), ipv4, port: validatePort(port) });
        const saved = await runtime.configStore.upsertPlugEndpoint(endpoint, editingId);
        setMessage(saved.status === "success" ? "Endpoint saved locally." : saved.error.message);
        if (saved.status === "success") clearForm();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Invalid endpoint."); }
    }} testID="plug-admin-save" />
    {editingId && <EditorAction label="Cancel edit" onPress={clearForm} testID="plug-admin-cancel" />}
    </EditorSection>
    {message && <Text style={styles.message}>{message}</Text>}
    <EditorSection title="Configured endpoints">
    {endpoints.length === 0 && <Text style={styles.empty}>No plug endpoints configured.</Text>}
    {endpoints.map((endpoint) => <View key={endpoint.id} style={styles.row}>
      <EditorSummaryRow label={endpoint.id} value={`${endpoint.ipv4}:${endpoint.port}`} testID={`plug-admin-endpoint-${endpoint.id}`} />
      <View style={styles.rowActions}>
        <Pressable accessibilityLabel="Edit" accessibilityRole="button" onPress={() => { setEditingId(endpoint.id); setIpv4(endpoint.ipv4); setPort(String(endpoint.port)); setMessage(undefined); }} style={styles.edit}><Text style={styles.editText}>Edit</Text></Pressable>
        <Pressable accessibilityLabel="Remove" accessibilityRole="button" onPress={() => setRemoveId(endpoint.id)} style={styles.remove}><Text style={styles.removeText}>Remove</Text></Pressable>
      </View>
    </View>)}
    </EditorSection>
    <ConfirmDestructiveAction
      visible={Boolean(removeId)}
      onCancel={() => setRemoveId(undefined)}
      onConfirmed={() => setRemoveId(undefined)}
      spec={removeId ? destructiveActionSpec(removeId, "plug endpoint", "remove only this phone's endpoint record", async () => runtime.service.removePlugEndpoint(removeId)) : undefined}
    />
  </Screen>;
}

const styles = StyleSheet.create({
  note: { color: "#93a1a1", lineHeight: 19, marginBottom: 12 },
  message: { color: "#b58900", marginVertical: 10 },
  empty: { color: "#93a1a1", paddingVertical: 10 },
  row: { alignItems: "center", borderBottomColor: "#586e75", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", minHeight: 60 },
  rowActions: { flexDirection: "row", gap: 6, marginLeft: 8 },
  edit: { alignItems: "center", backgroundColor: "#586e75", borderRadius: 6, justifyContent: "center", minHeight: 48, minWidth: 56, paddingHorizontal: 8 },
  editText: { color: "#fff" },
  remove: { alignItems: "center", backgroundColor: "#dc322f", borderRadius: 6, justifyContent: "center", minHeight: 48, minWidth: 74, paddingHorizontal: 8 },
  removeText: { color: "#fff", fontWeight: "700" },
});
