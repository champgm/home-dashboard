import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppRuntime } from "../AppContext";
import { DiagnosticsPanel } from "../components/DiagnosticsPanel";
import { Screen } from "../components/Screen";
import { ExpandableAdvancedSection } from "../components/ExpandableAdvancedSection";
import { EditorAction, EditorSection, EditorSummaryRow } from "../editors/editorControls";

export function AdvancedHueScreen({ navigation }: { navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const diagnostics = Array.from(runtime.service.getDiagnostics().values());
  const [message, setMessage] = useState<string>();
  const go = (name: string) => navigation?.navigate(name);
  return (
    <Screen showTitle={false} title="Advanced / Bridge">
      <EditorSummaryRow label="Readiness" value={runtime.readiness} />
      {(runtime.readiness === "ConfigError" || runtime.readiness === "StorageError") && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Local configuration could not be read. Nothing was overwritten.</Text>
          <EditorAction label="Reset Local Configuration" onPress={() => void runtime.resetLocalConfiguration().then((saved) => setMessage(saved ? "Local configuration reset." : "Reset could not be saved."))} testID="advanced-reset" />
        </View>
      )}
      <EditorSection title="Bridge">
        <EditorSummaryRow label="Bridge configuration" onPress={() => go("BridgeConfiguration")} testID="advanced-bridge-configuration" value="Address and read-only bridge information" />
        <EditorSummaryRow label="Bridge capabilities" onPress={() => go("BridgeConfiguration")} testID="advanced-bridge-capabilities" value="Read current authenticated information" />
      </EditorSection>
      <EditorSection title="Hue access">
        <EditorSummaryRow label="Hue provisioning" onPress={() => go("HueProvisioning")} testID="advanced-provisioning" value="Initial link-button setup" />
        <EditorSummaryRow label="Same-bridge reauthorization" onPress={() => go("HueReauthorization")} testID="advanced-reauthorization" value="Replace a rejected credential" />
        <EditorSummaryRow label="Resource Links" onPress={() => go("ResourceLinks")} testID="advanced-resource-links" value="Manage bridge resource links" />
      </EditorSection>
      <EditorSection title="Plugs"><EditorSummaryRow label="Endpoint administration" onPress={() => go("PlugAdministration")} testID="advanced-plug-administration" value="Manage this phone's private endpoints" /></EditorSection>
      <ExpandableAdvancedSection title="Diagnostics" summary={`${diagnostics.length} current diagnostic${diagnostics.length === 1 ? "" : "s"}`} testID="advanced-diagnostics">
        <DiagnosticsPanel diagnostics={diagnostics} />
      </ExpandableAdvancedSection>
      <Text style={styles.note}>Bridge configuration and capabilities are read-only. Firmware, discovery, cloud, and network-reconfiguration operations are unavailable.</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: "#93a1a1", fontSize: 13, lineHeight: 19, marginTop: 14 },
  warning: { backgroundColor: "#7f302b", borderRadius: 8, marginVertical: 8, padding: 12 },
  warningText: { color: "#fff", lineHeight: 19, marginBottom: 10 },
  message: { color: "#b58900", marginTop: 10 },
});
