import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { useAppRuntime } from "../AppContext";
import { Screen } from "../components/Screen";

export function PlugEditor({ route }: { route?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const endpoint = runtime.configStore.getCommitted()?.plugs.find((item) => item.id === route?.params?.id);
  const [alias, setAlias] = useState("");
  const [message, setMessage] = useState<string>();
  return <Screen title="Plug Editor">
    <Text style={styles.locator}>{endpoint ? `${endpoint.ipv4}:${endpoint.port}` : "Plug endpoint not found"}</Text>
    <TextInput onChangeText={setAlias} placeholder="Physical plug alias" placeholderTextColor="#93a1a1" style={styles.input} value={alias} />
    <Pressable onPress={async () => {
      if (!endpoint) { setMessage("Plug is not currently available."); return; }
      const result = await runtime.service.setPlugAlias(endpoint, alias);
      setMessage(result.kind === "success" ? "Alias updated on the physical plug." : result.diagnostic?.message || "Alias not updated.");
    }} style={styles.button}><Text style={styles.buttonText}>Save physical alias</Text></Pressable>
    {message && <Text style={styles.message}>{message}</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  locator: { color: "#93a1a1", marginBottom: 12 },
  input: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, color: "#fdf6e3", marginBottom: 12, padding: 12 },
  button: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, padding: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 10 },
});
