import React, { useEffect, useState } from "react";
import { ResourceRef } from "../../app/types";
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
  return (
    <Screen showTitle={false} title="Plugs">
      <LegacyDashboardGrid testID="plugs-dashboard-grid">
        <LegacyResourceButton hideEdit hideFavorite onPress={() => void runtime.service.refreshConfiguredPlugs({ ignoreBackoff: true })} state="known" title="Refresh" />
        <LegacyResourceButton hideEdit hideFavorite onPress={() => navigation?.navigate("PlugAdministration")} state="known" title="Manage endpoints" />
        {plugs.map((endpoint) => {
          const ref: ResourceRef = { kind: "plug", plugEndpointId: endpoint.id };
          const stored = runtime.service.stateStore.get(ref);
          const value = stored?.state.status === "known" ? stored.state.value as any : undefined;
          return <ResourceTile key={endpoint.id} ref={ref} title={value?.alias || endpoint.ipv4} stored={stored} favorite={favorites.some((favorite) => sameResourceRef(favorite, ref))} onPress={() => void runtime.service.performPrimary(ref)} onFavorite={() => void (favorites.some((favorite) => sameResourceRef(favorite, ref)) ? runtime.service.removeFavorite(ref) : runtime.service.addFavorite(ref))} onEdit={() => navigation?.navigate("PlugEditor", { id: endpoint.id })} />;
        })}
      </LegacyDashboardGrid>
      {plugs.length === 0 && <EmptyState message="No configured plugs. Add one from Advanced." />}
    </Screen>
  );
}

function sameResourceRef(left: ResourceRef, right: ResourceRef): boolean {
  return left.kind === right.kind && left.id === right.id && left.plugEndpointId === right.plugEndpointId;
}
