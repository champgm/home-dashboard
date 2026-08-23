import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { useAppRuntime } from "../AppContext";
import { Screen } from "../components/Screen";

export function ResourceLinkEditor({ route }: { route?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const stored = id ? runtime.service.stateStore.get({ kind: "resourcelink", id }) : undefined;
  const value = stored?.state.status === "known" ? stored.state.value as { class?: string; description?: string; links?: string[] } : undefined;
  const [resourceClass, setResourceClass] = useState(value?.class || "HomeDashboard");
  const [description, setDescription] = useState(value?.description || "");
  const [links, setLinks] = useState((value?.links || []).join("\n"));
  const [message, setMessage] = useState<string>();
  const payload = { class: resourceClass, description, links: links.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) };
  return <Screen title="Resource Link Editor">
    <Text style={styles.label}>Class</Text>
    <TextInput onChangeText={setResourceClass} placeholder="HomeDashboard" placeholderTextColor="#93a1a1" style={styles.input} value={resourceClass} />
    <Text style={styles.label}>Description</Text>
    <TextInput onChangeText={setDescription} placeholder="Description" placeholderTextColor="#93a1a1" style={styles.input} value={description} />
    <Text style={styles.label}>Links (one Hue resource path per line)</Text>
    <TextInput multiline onChangeText={setLinks} placeholder="/lights/1" placeholderTextColor="#93a1a1" style={[styles.input, styles.multiline]} value={links} />
    <Pressable onPress={async () => {
      const result = id ? await runtime.service.mutateHue("resourcelink", id, "update", payload) : await runtime.service.createHue("resourcelink", payload);
      setMessage(result.kind === "success" ? "Resource Link saved and refreshed." : result.diagnostic?.message || "Resource Link was not saved.");
    }} style={styles.button}><Text style={styles.buttonText}>{id ? "Save changed fields" : "Create Resource Link"}</Text></Pressable>
    {message && <Text style={styles.message}>{message}</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  label: { color: "#fdf6e3", marginBottom: 5, marginTop: 8 },
  input: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, color: "#fdf6e3", padding: 12 },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  button: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, marginTop: 14, padding: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 10 },
});
