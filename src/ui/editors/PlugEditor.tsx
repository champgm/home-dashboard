import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { PlugSysInfo } from "../../app/types";
import { useAppRuntime } from "../AppContext";
import { EditorSection, ReadOnlyField } from "./editorControls";
import { Screen } from "../components/Screen";

export function PlugEditor({ route }: { route?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const endpoint = runtime.configStore.getCommitted()?.plugs.find((item) => item.id === route?.params?.id);
  const stored = endpoint ? runtime.service.stateStore.get({ kind: "plug", plugEndpointId: endpoint.id }) : undefined;
  const value = stored?.state.status === "known" ? stored.state.value as PlugSysInfo : undefined;
  const [alias, setAlias] = useState(value?.alias || "");
  const [message, setMessage] = useState<string>();
  useEffect(() => {
    if (value?.alias && !alias) setAlias(value.alias);
  }, [value?.alias]);
  return <Screen title="Plug Editor">
    <EditorSection title="Editable plug fields">
      <Text style={styles.label}>Physical alias</Text>
      <TextInput accessibilityLabel="Physical alias" onChangeText={setAlias} placeholder="Physical plug alias" placeholderTextColor="#93a1a1" style={styles.input} value={alias} />
      <Pressable onPress={async () => {
        if (!endpoint) { setMessage("Plug is not currently available."); return; }
        const result = await runtime.service.setPlugAlias(endpoint, alias);
        setMessage(result.kind === "success" ? "Alias updated on the physical plug." : result.diagnostic?.message || "Alias not updated.");
      }} style={styles.button}><Text style={styles.buttonText}>Save physical alias</Text></Pressable>
    </EditorSection>
    <EditorSection title="Returned plug details">
      <Text style={styles.locator}>{endpoint ? `${endpoint.ipv4}:${endpoint.port}` : "Plug endpoint not found"}</Text>
      <ReadOnlyField label="Physical alias" value={value?.alias} />
      <ReadOnlyField label="Model" value={value?.model} />
      <ReadOnlyField label="Device ID" value={value?.deviceId} />
      <ReadOnlyField label="Hardware version" value={value?.hardwareVersion} />
      <ReadOnlyField label="Software version" value={value?.softwareVersion} />
      <ReadOnlyField label="MAC" value={value?.mac} />
      <ReadOnlyField label="RSSI" value={value?.rssi} />
      <ReadOnlyField label="Signal level" value={value?.signalLevel} />
      <ReadOnlyField label="Relay state" value={value?.relayState === undefined ? undefined : value.relayState ? "On" : "Off"} />
      <ReadOnlyField label="Features" value={value?.feature} />
      {value?.hasEnergy && <>
        <ReadOnlyField label="Current (mA)" value={value.energy?.currentMa} />
        <ReadOnlyField label="Voltage (mV)" value={value.energy?.voltageMv} />
        <ReadOnlyField label="Power (mW)" value={value.energy?.powerMw} />
        <ReadOnlyField label="Total (Wh)" value={value.energy?.totalWh} />
        <ReadOnlyField label="Today (Wh)" value={value.energy?.todayWh} />
        <ReadOnlyField label="Month (Wh)" value={value.energy?.monthWh} />
      </>}
      {!value?.hasEnergy && <ReadOnlyField label="Energy" value="Not reported by this plug" />}
    </EditorSection>
    {message && <Text style={styles.message}>{message}</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  locator: { color: "#93a1a1", marginBottom: 12 },
  label: { color: "#fdf6e3", marginBottom: 5 },
  input: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, color: "#fdf6e3", marginBottom: 12, padding: 12 },
  button: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, padding: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 10 },
});
