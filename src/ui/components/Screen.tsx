import React, { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export function Screen({ title, children }: PropsWithChildren<{ title: string }>): JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </ScrollView>
  );
}

export function EmptyState({ message }: { message: string }): JSX.Element {
  return <Text style={styles.empty}>{message}</Text>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#002b36", flex: 1 },
  content: { padding: 12 },
  title: { color: "#b58900", fontSize: 25, fontWeight: "700", marginBottom: 8 },
  empty: { color: "#93a1a1", fontSize: 16, paddingVertical: 16 },
});
