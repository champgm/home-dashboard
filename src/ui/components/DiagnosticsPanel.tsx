import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Diagnostic } from "../../app/types";

export function DiagnosticsPanel({ diagnostics }: { diagnostics: readonly Diagnostic[] }): JSX.Element | null {
  if (diagnostics.length === 0) return null;
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Diagnostics</Text>
      {diagnostics.map((item) => <View key={item.key || `${item.category}:${item.operation || "current"}:${item.resource || "root"}`} style={styles.item}>
        <Text style={styles.title}>{item.category}{item.operation ? ` · ${item.operation}` : ""}</Text>
        {item.resource && <Text style={styles.detail}>Endpoint: {item.resource}</Text>}
        {item.elapsedMs !== undefined && <Text style={styles.detail}>Elapsed: {item.elapsedMs} ms</Text>}
        {item.statusCode !== undefined && <Text style={styles.detail}>HTTP status: {item.statusCode}</Text>}
        {item.protocolCode !== undefined && <Text style={styles.detail}>Protocol code: {item.protocolCode}</Text>}
        <Text style={styles.message}>{item.message}</Text>
        {item.detail && <Text selectable style={styles.detail}>{item.detail}</Text>}
      </View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: "#073642", borderRadius: 8, marginVertical: 8, padding: 12 },
  heading: { color: "#b58900", fontWeight: "700", marginBottom: 4 },
  item: { borderTopColor: "#586e75", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 6, paddingTop: 6 },
  title: { color: "#cb4b16", fontSize: 13, fontWeight: "700" },
  message: { color: "#fdf6e3", fontSize: 13, marginTop: 3 },
  detail: { color: "#93a1a1", fontSize: 12, marginTop: 3 },
});
