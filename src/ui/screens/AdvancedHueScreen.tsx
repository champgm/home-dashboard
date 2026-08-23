import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppRuntime } from "../AppContext";
import { DiagnosticsPanel } from "../components/DiagnosticsPanel";
import { Screen } from "../components/Screen";

export function AdvancedHueScreen({ navigation }: { navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const diagnostics = Array.from(runtime.service.getDiagnostics().values());
  const [message, setMessage] = useState<string>();
  const [bridgeRead, setBridgeRead] = useState<{ config: Record<string, unknown>; capabilities?: Record<string, unknown> }>();
  const go = (name: string) => navigation?.navigate(name);
  return (
    <Screen title="Advanced / Bridge">
      <Text style={styles.readiness}>Readiness: {runtime.readiness}</Text>
      <DiagnosticsPanel diagnostics={diagnostics} />
      {(runtime.readiness === "ConfigError" || runtime.readiness === "StorageError") && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Local configuration could not be read. Nothing was overwritten.</Text>
          <Pressable onPress={async () => setMessage(await runtime.resetLocalConfiguration() ? "Local configuration reset." : "Reset could not be saved.")} style={styles.reset}><Text style={styles.resetText}>Reset Local Configuration</Text></Pressable>
        </View>
      )}
      <Pressable onPress={async () => {
        const result = await runtime.service.readHueAdministration();
        if (result.kind === "success") setBridgeRead(result.value);
        else setMessage(result.diagnostic?.message || "Bridge reads are unavailable.");
      }} style={styles.readButton}><Text style={styles.actionText}>Read Bridge Configuration / Capabilities</Text></Pressable>
      {bridgeRead && <Text selectable style={styles.readout}>{JSON.stringify(bridgeRead, null, 2)}</Text>}
      <View style={styles.group}>
        <Action label="Bridge address and read-only configuration" onPress={() => go("BridgeConfiguration")} />
        <Action label="Resource Links" onPress={() => go("ResourceLinks")} />
        <Action label="Hue initial provisioning" onPress={() => go("HueProvisioning")} />
        <Action label="Same-bridge reauthorization" onPress={() => go("HueReauthorization")} />
        <Action label="Plug endpoint administration" onPress={() => go("PlugAdministration")} />
      </View>
      <Text style={styles.note}>Bridge Configuration and Capabilities are read-only. Firmware, reset, network-reconfiguration, discovery, and cloud operations are not available.</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </Screen>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }): JSX.Element {
  return <Pressable onPress={onPress} style={styles.action}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  readiness: { color: "#fdf6e3", fontSize: 16, marginBottom: 12 },
  group: { marginVertical: 8 },
  action: { backgroundColor: "#268bd2", borderRadius: 8, marginVertical: 5, padding: 14 },
  actionText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  note: { color: "#93a1a1", fontSize: 13, lineHeight: 19, marginTop: 14 },
  warning: { backgroundColor: "#7f302b", borderRadius: 8, marginVertical: 8, padding: 12 },
  warningText: { color: "#fff", lineHeight: 19, marginBottom: 10 },
  reset: { alignSelf: "flex-start", backgroundColor: "#fdf6e3", borderRadius: 6, padding: 9 },
  resetText: { color: "#7f302b", fontWeight: "700" },
  readButton: { backgroundColor: "#586e75", borderRadius: 8, marginVertical: 6, padding: 12 },
  readout: { backgroundColor: "#073642", color: "#fdf6e3", fontSize: 11, marginTop: 8, padding: 8 },
  message: { color: "#b58900", marginTop: 10 },
});
