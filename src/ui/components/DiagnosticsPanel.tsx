import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Diagnostic } from "../../app/types";

export function DiagnosticsPanel({ diagnostics }: { diagnostics: readonly Diagnostic[] }): JSX.Element | null {
  if (diagnostics.length === 0) return null;
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Diagnostics</Text>
      {diagnostics.map((item, index) => (
        <Text key={`${item.category}-${index}`} style={styles.item}>{item.category}: {item.message}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: "#073642", borderRadius: 8, marginVertical: 8, padding: 12 },
  heading: { color: "#b58900", fontWeight: "700", marginBottom: 4 },
  item: { color: "#fdf6e3", fontSize: 13, marginTop: 3 },
});
