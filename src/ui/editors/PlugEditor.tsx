import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { PlugSysInfo } from "../../app/types";
import { useAppRuntime } from "../AppContext";
import { EditorAction, EditorSection, EditorSummaryRow, EditorTextField, ReadOnlyField } from "./editorControls";
import { ExpandableAdvancedSection } from "../components/ExpandableAdvancedSection";
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
  const saveAlias = async (): Promise<void> => {
    if (!endpoint) { setMessage("Plug is not currently available."); return; }
    const result = await runtime.service.setPlugAlias(endpoint, alias);
    setMessage(result.kind === "success" ? "Alias updated on the physical plug." : result.diagnostic?.message || "Alias not updated.");
  };
  const toggleRelay = async (): Promise<void> => {
    if (!endpoint) { setMessage("Plug endpoint not found."); return; }
    const result = await runtime.service.performPrimary({ kind: "plug", plugEndpointId: endpoint.id });
    setMessage(result.kind === "success" ? "Relay command sent and refreshed." : result.diagnostic?.message || "Relay command was not completed.");
  };
  return <Screen showTitle={false} title="Plug Editor">
    {!endpoint && <Text accessibilityRole="alert" style={styles.warning}>This plug endpoint is not currently configured.</Text>}
    <EditorSection title="Plug controls">
      <EditorTextField label="Alias" onChangeText={setAlias} placeholder="Physical plug alias" testID="plug-alias" value={alias} />
      <EditorAction label="Save alias" onPress={() => void saveAlias()} testID="plug-alias-save" />
      <EditorSummaryRow label="Relay" value={value?.relayState === undefined ? "State unavailable" : value.relayState ? "On" : "Off"} />
      <EditorAction label="Toggle relay now" onPress={() => void toggleRelay()} testID="plug-relay" />
    </EditorSection>
    <EditorSection title="Useful status">
      <ReadOnlyField label="Physical alias" value={value?.alias} />
      <ReadOnlyField label="Model" value={value?.model} />
      <ReadOnlyField label="MAC" value={value?.mac} />
      <ReadOnlyField label="Energy" value={value?.hasEnergy ? "Reported" : "Not reported by this plug"} />
    </EditorSection>
    <ExpandableAdvancedSection summary={endpoint ? `${endpoint.ipv4}:${endpoint.port} · device and network details` : "Endpoint details unavailable"} testID="plug-advanced">
      <Text style={styles.locator}>{endpoint ? `${endpoint.ipv4}:${endpoint.port}` : "Plug endpoint not found"}</Text>
      <ReadOnlyField label="Device ID" value={value?.deviceId} />
      <ReadOnlyField label="Hardware version" value={value?.hardwareVersion} />
      <ReadOnlyField label="Software version" value={value?.softwareVersion} />
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
    </ExpandableAdvancedSection>
    {message && <Text style={styles.message}>{message}</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  locator: { color: "#93a1a1", marginBottom: 12 },
  warning: { color: "#dc322f", marginBottom: 10 },
  message: { color: "#b58900", marginTop: 10 },
});
