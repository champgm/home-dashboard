import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { createEndpointId, validatePlugEndpoint, validatePort } from "../../config/endpointValidation";
import { useAppRuntime } from "../AppContext";
import { ConfirmDestructiveAction } from "../components/ConfirmDestructiveAction";
import { Screen } from "../components/Screen";
import { destructiveActionSpec } from "../../app/destructiveActions";

export function PlugAdministrationScreen(): JSX.Element {
  const runtime = useAppRuntime();
  const [ipv4, setIpv4] = useState("");
  const [port, setPort] = useState("9999");
  const [message, setMessage] = useState<string>();
  const [removeId, setRemoveId] = useState<string>();
  const endpoints = runtime.configStore.getCommitted()?.plugs || [];
  return <Screen title="Plug Endpoint Administration">
    <Text style={styles.note}>Only explicit private IPv4 endpoints are accepted. Port defaults to 9999. Removing an endpoint changes local configuration only.</Text>
    <TextInput autoCapitalize="none" keyboardType="numeric" onChangeText={setIpv4} placeholder="Private IPv4" placeholderTextColor="#93a1a1" style={styles.input} value={ipv4} />
    <TextInput keyboardType="numeric" onChangeText={setPort} placeholder="9999" placeholderTextColor="#93a1a1" style={styles.input} value={port} />
    <Pressable onPress={async () => {
      try {
        const endpoint = validatePlugEndpoint({ id: createEndpointId(ipv4), ipv4, port: validatePort(port) });
        const saved = await runtime.saveConfig((config) => ({ ...config, plugs: [...config.plugs.filter((item) => item.id !== endpoint.id), endpoint] }));
        setMessage(saved ? "Endpoint saved locally." : "Endpoint was not saved.");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Invalid endpoint."); }
    }} style={styles.button}><Text style={styles.buttonText}>Add or replace endpoint</Text></Pressable>
    {message && <Text style={styles.message}>{message}</Text>}
    {endpoints.map((endpoint) => <View key={endpoint.id} style={styles.row}><Text style={styles.endpoint}>{endpoint.ipv4}:{endpoint.port}</Text><Pressable onPress={() => setRemoveId(endpoint.id)} style={styles.remove}><Text style={styles.removeText}>Remove</Text></Pressable></View>)}
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
  input: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, color: "#fdf6e3", marginBottom: 8, padding: 12 },
  button: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, padding: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  message: { color: "#b58900", marginVertical: 10 },
  row: { alignItems: "center", borderBottomColor: "#586e75", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  endpoint: { color: "#fdf6e3" },
  remove: { backgroundColor: "#dc322f", borderRadius: 6, padding: 8 },
  removeText: { color: "#fff", fontWeight: "700" },
});
