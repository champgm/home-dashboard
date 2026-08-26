import React, { useEffect, useState } from "react";
import { ResourceRef, PlugSysInfo } from "../../app/types";
import { LegacyResourceButton } from "../components/LegacyResourceButton";
import { useAppRuntime } from "../AppContext";
import { ResourceTile } from "../components/ResourceTile";
import { EmptyState, Screen } from "../components/Screen";
import { LegacyDashboardGrid, LegacyDashboardUtilityRow } from "../legacy/LegacyDashboardGrid";

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
        <LegacyDashboardUtilityRow testID="plugs-dashboard-utilities">
          <LegacyResourceButton hideEdit hideFavorite onPress={() => void runtime.service.refreshConfiguredPlugs({ ignoreBackoff: true })} state="known" title="Refresh" utility />
          <LegacyResourceButton hideEdit hideFavorite onPress={() => navigation?.navigate("PlugAdministration")} state="known" title="Manage plugs" utility />
        </LegacyDashboardUtilityRow>
        {displayedPlugs.map(({ endpoint, ref, stored }) => {
          const value = stored?.state.status === "known" ? stored.state.value as PlugSysInfo : undefined;
          const lastKnownValue = stored?.lastKnownValue as PlugSysInfo | undefined;
          return <ResourceTile key={endpoint.id} ref={ref} title={value?.alias || lastKnownValue?.alias || endpoint.ipv4} stored={stored} favorite={favorites.some((favorite) => sameResourceRef(favorite, ref))} onPress={() => void runtime.service.performPrimary(ref)} onFavorite={() => void (favorites.some((favorite) => sameResourceRef(favorite, ref)) ? runtime.service.removeFavorite(ref) : runtime.service.addFavorite(ref))} onEdit={() => navigation?.navigate("PlugEditor", { id: endpoint.id })} />;
        })}
      </LegacyDashboardGrid>
      {plugs.length === 0 && <EmptyState message="No configured plugs. Add one from Advanced." />}
    </Screen>
  );
}

function sameResourceRef(left: ResourceRef, right: ResourceRef): boolean {
  return left.kind === right.kind && left.id === right.id && left.plugEndpointId === right.plugEndpointId;
}
