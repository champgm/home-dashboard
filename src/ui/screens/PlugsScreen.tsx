import React, { useEffect, useState } from "react";
import { ResourceRef, PlugSysInfo } from "../../app/types";
import { StyleSheet, Text, View } from "react-native";
import { LegacyResourceButton } from "../components/LegacyResourceButton";
import { useAppRuntime } from "../AppContext";
import { ResourceTile } from "../components/ResourceTile";
import { EmptyState, Screen } from "../components/Screen";
import { LegacyDashboardGrid } from "../legacy/LegacyDashboardGrid";

export function PlugsScreen({ navigation }: { navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsubscribeState = runtime.service.stateStore.subscribe(() => setVersion((value) => value + 1));
    const unsubscribeConfig = runtime.configStore.subscribe(() => setVersion((value) => value + 1));
    return () => { unsubscribeState(); unsubscribeConfig(); };
  }, [runtime]);
  const plugs = runtime.configStore.getCommitted()?.plugs || [];
  const favorites = runtime.configStore.getCommitted()?.favorites || [];
  const displayedPlugs = plugs
    .map((endpoint, configuredIndex) => {
      const ref: ResourceRef = { kind: "plug", plugEndpointId: endpoint.id };
      return { endpoint, configuredIndex, ref, stored: runtime.service.stateStore.get(ref) };
    })
    .sort((left, right) => {
      const leftKnown = left.stored?.state.status === "known";
      const rightKnown = right.stored?.state.status === "known";
      return Number(rightKnown) - Number(leftKnown) || left.configuredIndex - right.configuredIndex;
    });
  return (
    <Screen showTitle={false} title="Plugs">
      <LegacyDashboardGrid testID="plugs-dashboard-grid">
        <LegacyResourceButton hideEdit hideFavorite onPress={() => void runtime.service.refreshConfiguredPlugs({ ignoreBackoff: true })} state="known" title="Refresh" />
        <LegacyResourceButton hideEdit hideFavorite onPress={() => navigation?.navigate("PlugAdministration")} state="known" title="Manage endpoints" />
        {displayedPlugs.map(({ endpoint, ref, stored }) => {
          const value = stored?.state.status === "known" ? stored.state.value as PlugSysInfo : undefined;
          return <ResourceTile key={endpoint.id} ref={ref} title={value?.alias || endpoint.ipv4} stored={stored} favorite={favorites.some((favorite) => sameResourceRef(favorite, ref))} onPress={() => void runtime.service.performPrimary(ref)} onFavorite={() => void (favorites.some((favorite) => sameResourceRef(favorite, ref)) ? runtime.service.removeFavorite(ref) : runtime.service.addFavorite(ref))} onEdit={() => navigation?.navigate("PlugEditor", { id: endpoint.id })} />;
        })}
      </LegacyDashboardGrid>
      {displayedPlugs.map(({ endpoint, stored }) => <PlugInformation key={`info-${endpoint.id}`} endpoint={endpoint} stored={stored} />)}
      {plugs.length === 0 && <EmptyState message="No configured plugs. Add one from Advanced." />}
    </Screen>
  );
}

function PlugInformation({ endpoint, stored }: { readonly endpoint: { readonly id: string; readonly ipv4: string; readonly port: number }; readonly stored?: any }): JSX.Element {
  const value = stored?.state.status === "known" ? stored.state.value as PlugSysInfo : undefined;
  const status = stored?.state.status === "known" ? "Reachable / current" : "Unreachable or not yet read";
  return <View style={styles.information} testID={`plug-information-${endpoint.id}`}>
    <Text style={styles.informationTitle}>{value?.alias || "Configured plug"}</Text>
    <Text style={styles.status}>{status}</Text>
    <Text style={styles.locator}>Technical locator: {endpoint.ipv4}:{endpoint.port}</Text>
    {value && <>
      {present("Model", value.model)}
      {present("Device ID", value.deviceId)}
      {present("Hardware", value.hardwareVersion)}
      {present("Software", value.softwareVersion)}
      {present("MAC", value.mac)}
      {present("Signal", value.rssi ?? value.signalLevel)}
      {present("Relay", value.relayState === undefined ? undefined : value.relayState ? "On" : "Off")}
      {present("Features", value.feature)}
      {value.hasEnergy && <>
        <Text style={styles.energyTitle}>Energy</Text>
        {present("Current (mA)", value.energy?.currentMa)}
        {present("Voltage (mV)", value.energy?.voltageMv)}
        {present("Power (mW)", value.energy?.powerMw)}
        {present("Total (Wh)", value.energy?.totalWh)}
        {present("Today (Wh)", value.energy?.todayWh)}
        {present("Month (Wh)", value.energy?.monthWh)}
      </>}
    </>}
  </View>;
}

function present(label: string, value: unknown): JSX.Element | null {
  return value === undefined || value === null || value === "" ? null : <Text style={styles.detail}>{label}: {String(value)}</Text>;
}

function sameResourceRef(left: ResourceRef, right: ResourceRef): boolean {
  return left.kind === right.kind && left.id === right.id && left.plugEndpointId === right.plugEndpointId;
}

const styles = StyleSheet.create({
  information: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, marginTop: 8, padding: 10 },
  informationTitle: { color: "#fdf6e3", fontWeight: "700" },
  status: { color: "#b58900", marginTop: 3 },
  locator: { color: "#93a1a1", marginTop: 3 },
  detail: { color: "#fdf6e3", marginTop: 3 },
  energyTitle: { color: "#b58900", fontWeight: "700", marginTop: 8 },
});
