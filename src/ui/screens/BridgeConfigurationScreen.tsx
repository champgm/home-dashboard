import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { validatePrivateIpv4 } from "../../config/endpointValidation";
import { useAppRuntime } from "../AppContext";
import { Screen } from "../components/Screen";

export function BridgeConfigurationScreen(): JSX.Element {
  const runtime = useAppRuntime();
  const [ipv4, setIpv4] = useState(runtime.configStore.getCommitted()?.bridge.ipv4 || "");
  const [message, setMessage] = useState<string>();
  return (
    <Screen title="Bridge Configuration">
      <Text style={styles.label}>Bound bridge private IPv4 address</Text>
      <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="numeric" onChangeText={setIpv4} placeholder="192.168.x.x" placeholderTextColor="#93a1a1" style={styles.input} value={ipv4} />
      <Pressable onPress={async () => {
        const validation = validatePrivateIpv4(ipv4);
        if (!validation.valid) { setMessage(validation.error?.message); return; }
        const saved = await runtime.saveConfig((config) => ({ ...config, bridge: { ipv4: validation.value } }));
        setMessage(saved ? "Saved locally." : "Local storage is unavailable; not saved.");
      }} style={styles.button}><Text style={styles.buttonText}>Save address</Text></Pressable>
      {message && <Text style={styles.message}>{message}</Text>}
      <Text style={styles.readonly}>Bridge Configuration and Capabilities are inspectable through the authenticated adapter and are never editable here.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: "#fdf6e3", fontSize: 15, marginBottom: 6 },
  input: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, color: "#fdf6e3", marginBottom: 10, padding: 12 },
  button: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, padding: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 10 },
  readonly: { color: "#93a1a1", lineHeight: 20, marginTop: 20 },
});
