import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ResourceRef } from "../../app/types";
import { useAppRuntime } from "../AppContext";
import { ResourceTile } from "../components/ResourceTile";
import { EmptyState, Screen } from "../components/Screen";

export function PlugsScreen({ navigation }: { navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsubscribeState = runtime.service.stateStore.subscribe(() => setVersion((value) => value + 1));
    const unsubscribeConfig = runtime.configStore.subscribe(() => setVersion((value) => value + 1));
    return () => { unsubscribeState(); unsubscribeConfig(); };
  }, [runtime]);
  const plugs = runtime.configStore.getCommitted()?.plugs || [];
  return (
    <Screen title="Plugs">
      <View style={styles.toolbar}>
        <Pressable onPress={() => void runtime.service.refreshConfiguredPlugs({ ignoreBackoff: true })} style={styles.button}><Text style={styles.buttonText}>Refresh</Text></Pressable>
        <Pressable onPress={() => navigation?.navigate("PlugAdministration")} style={styles.button}><Text style={styles.buttonText}>Manage endpoints</Text></Pressable>
      </View>
      {plugs.length === 0 ? <EmptyState message="No configured plugs. Add one from Advanced." /> : <View style={styles.grid}>
        {plugs.map((endpoint) => {
          const ref: ResourceRef = { kind: "plug", plugEndpointId: endpoint.id };
          const stored = runtime.service.stateStore.get(ref);
          const value = stored?.state.status === "known" ? stored.state.value as any : undefined;
          const subtitle = value ? [value.model, typeof value.relayState === "boolean" ? (value.relayState ? "On" : "Off") : "State unknown", value.hasEnergy && value.energy?.powerMw !== undefined ? `${value.energy.powerMw} mW` : undefined].filter(Boolean).join(" · ") : `${endpoint.ipv4}:${endpoint.port}`;
          return <ResourceTile key={endpoint.id} ref={ref} title={value?.alias || endpoint.ipv4} subtitle={subtitle} stored={stored} onPress={() => void runtime.service.performPrimary(ref)} onEdit={() => navigation?.navigate("PlugEditor", { id: endpoint.id })} />;
        })}
      </View>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", gap: 8, marginBottom: 8 },
  button: { backgroundColor: "#268bd2", borderRadius: 8, padding: 10 },
  buttonText: { color: "#fff", fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
});
