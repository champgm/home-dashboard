import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { validatePrivateIpv4 } from "../../config/endpointValidation";
import { useAppRuntime } from "../AppContext";
import { Screen } from "../components/Screen";
import { EditorAction, EditorSection, EditorTextField } from "../editors/editorControls";
import { ExpandableAdvancedSection } from "../components/ExpandableAdvancedSection";

export function BridgeConfigurationScreen(): JSX.Element {
  const runtime = useAppRuntime();
  const [ipv4, setIpv4] = useState(runtime.configStore.getCommitted()?.bridge.ipv4 || "");
  const [message, setMessage] = useState<string>();
  const [bridgeRead, setBridgeRead] = useState<{ config: Record<string, unknown>; capabilities?: Record<string, unknown> }>();
  useEffect(() => runtime.configStore.subscribe(() => setIpv4(runtime.configStore.getCommitted()?.bridge.ipv4 || "")), [runtime]);
  return (
    <Screen showTitle={false} title="Bridge Configuration">
      <EditorSection title="Bridge address">
      <EditorTextField keyboardType="numeric" label="Bound bridge private IPv4 address" onChangeText={setIpv4} placeholder="192.168.x.x" testID="bridge-ipv4" value={ipv4} />
      <EditorAction label="Save address" onPress={async () => {
        const validation = validatePrivateIpv4(ipv4);
        if (!validation.valid) { setMessage(validation.error?.message); return; }
        const saved = await runtime.saveConfig((config) => ({ ...config, bridge: { ipv4: validation.value } }));
        setMessage(saved ? "Saved locally." : "Local storage is unavailable; not saved.");
      }} testID="bridge-save" />
      {message && <Text style={styles.message}>{message}</Text>}
      </EditorSection>
      <ExpandableAdvancedSection summary="Authenticated bridge configuration and capabilities are read-only" testID="bridge-advanced">
        <EditorAction label="Read current bridge information" onPress={() => void runtime.service.readHueAdministration().then((result) => {
          if (result.kind === "success") setBridgeRead(result.value);
          else setMessage(result.diagnostic?.message || "Bridge reads are unavailable.");
        }).catch((error) => setMessage(error instanceof Error ? error.message : "Bridge reads are unavailable."))} testID="bridge-read-configuration" />
        {bridgeRead && <Text style={styles.readout}>{JSON.stringify(bridgeRead, null, 2)}</Text>}
        <Text style={styles.readonly}>Bridge Configuration and Capabilities are inspectable through the authenticated adapter and are never editable here.</Text>
      </ExpandableAdvancedSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: { color: "#b58900", marginTop: 10 },
  readout: { color: "#fdf6e3", fontSize: 12, marginTop: 8 },
  readonly: { color: "#93a1a1", lineHeight: 20, marginTop: 20 },
});
