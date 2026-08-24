import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppNavigation } from "./navigation/AppNavigation";
import { AppProvider, useOptionalAppRuntime } from "./AppContext";

function BootView(): JSX.Element {
  const runtime = useOptionalAppRuntime();
  const insets = useSafeAreaInsets();
  if (!runtime) {
    return <View style={[styles.boot, { paddingTop: insets.top }]}><ActivityIndicator color="#b58900" size="large" /><Text style={styles.text}>Starting local dashboard…</Text></View>;
  }
  return <AppNavigation />;
}

export function AppShell(): JSX.Element {
  return <SafeAreaProvider><AppProvider><BootView /></AppProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  boot: { alignItems: "center", backgroundColor: "#002b36", flex: 1, justifyContent: "center" },
  text: { color: "#fdf6e3", marginTop: 12 },
});
