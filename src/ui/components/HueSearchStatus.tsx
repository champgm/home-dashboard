import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppRuntime } from "../AppContext";

type HueSearchKind = "lights" | "sensors";
interface HueSearchStatus { readonly kind: HueSearchKind; readonly active: boolean; readonly recent: boolean; readonly raw: unknown; }

export function HueSearchStatusView({ kind }: { kind: HueSearchKind }): JSX.Element {
  const runtime = useAppRuntime();
  const [status, setStatus] = useState<HueSearchStatus>();
  const [message, setMessage] = useState<string>();
  const refreshStatus = async () => {
    try {
      const next = await runtime.service.getHueSearchStatus(kind) as HueSearchStatus | undefined;
      if (!next) {
        setStatus(undefined);
        setMessage("Hue is not configured.");
        return;
      }
      setStatus(next);
      setMessage(undefined);
    } catch (_error) {
      setMessage("Search status is unavailable.");
    }
  };
  useEffect(() => { void refreshStatus(); }, [kind]);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message || (status?.active ? "A bridge search is active." : status?.recent ? "The bridge reports a recent search." : "No active search.")}</Text>
      <Pressable onPress={async () => {
        try {
          const result = await runtime.service.startHueSearch(kind, status) as { status: HueSearchStatus } | undefined;
          if (!result) { setMessage("Hue is not configured."); return; }
          setStatus(result.status);
        } catch (_error) {
          setMessage("Search could not be started.");
        }
      }} style={styles.button}><Text style={styles.buttonText}>Start search</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#073642", borderRadius: 8, marginBottom: 10, padding: 10 },
  text: { color: "#fdf6e3", marginBottom: 8 },
  button: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 6, padding: 8 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
