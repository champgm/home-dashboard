import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DimmerBindingView } from "../../protocol/hue/dimmer";

export function DimmerControlRow({ binding, testID }: { readonly binding: DimmerBindingView; readonly testID?: string }): JSX.Element {
  const action = binding.action;
  return <View style={[styles.row, !binding.editable && styles.readOnly]} testID={testID || `dimmer-row-${binding.id}`}>
    <Text style={styles.gesture}>{binding.gestureLabel}</Text>
    <Text style={styles.action}>{action?.label || "No current binding"}</Text>
    <Text style={styles.target}>{action?.targetLabel || binding.reason || "Not configured"}</Text>
    {!binding.editable && <Text style={styles.status}>Inspection only</Text>}
  </View>;
}

const styles = StyleSheet.create({
  row: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 9, borderWidth: 1, marginBottom: 8, minHeight: 48, padding: 11 },
  readOnly: { opacity: 0.88 },
  gesture: { color: "#fdf6e3", fontSize: 15, fontWeight: "700" },
  action: { color: "#b58900", marginTop: 5 },
  target: { color: "#fdf6e3", marginTop: 3 },
  status: { color: "#93a1a1", fontSize: 12, marginTop: 5 },
});
