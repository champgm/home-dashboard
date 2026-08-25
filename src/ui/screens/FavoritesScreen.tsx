import React, { useEffect, useState } from "react";
import { ResourceRef } from "../../app/types";
import { LegacyResourceButton } from "../components/LegacyResourceButton";
import { useAppRuntime } from "../AppContext";
import { ResourceTile } from "../components/ResourceTile";
import { EmptyState, Screen } from "../components/Screen";
import { LegacyDashboardGrid } from "../legacy/LegacyDashboardGrid";

export function FavoritesScreen({ navigation }: { navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const [, setVersion] = useState(0);
  useEffect(() => {
    const unsubscribeState = runtime.service.stateStore.subscribe(() => setVersion((value) => value + 1));
    const unsubscribeConfig = runtime.configStore.subscribe(() => setVersion((value) => value + 1));
    return () => { unsubscribeState(); unsubscribeConfig(); };
  }, [runtime]);
  const favorites = runtime.configStore.getCommitted()?.favorites || [];
  return (
    <Screen showTitle={false} title="Favorites">
      <LegacyDashboardGrid testID="favorites-dashboard-grid">
        <LegacyResourceButton hideEdit hideFavorite onPress={() => navigation?.navigate("Advanced")} state="known" title="Advanced" />
          {favorites.map((ref, index) => {
            const state = runtime.service.stateStore.get(ref);
            const title = state?.state.status === "known" ? String((state.state.value as any)?.name || (state.state.value as any)?.alias || ref.id || ref.plugEndpointId) : `${ref.kind} ${ref.id || ref.plugEndpointId}`;
            const editorRoute = ref.kind === "plug" ? "PlugEditor" : ref.kind === "resourcelink" ? "ResourceLinkEditor" : `${ref.kind[0].toUpperCase()}${ref.kind.slice(1)}Editor`;
            return (
              <ResourceTile
                key={`${ref.kind}-${ref.id || ref.plugEndpointId}-${index}`}
                ref={ref as ResourceRef}
                title={title}
                stored={state}
                missing={!state}
                favorite
                onPress={state ? () => void runtime.service.performPrimary(ref) : undefined}
                onFavorite={() => void runtime.service.removeFavorite(ref)}
                onEdit={state ? () => navigation?.getParent?.()?.navigate(editorRoute, ref.kind === "plug" ? { id: ref.plugEndpointId } : { id: ref.id }) || navigation?.navigate?.(editorRoute, ref.kind === "plug" ? { id: ref.plugEndpointId } : { id: ref.id }) : undefined}
              />
            );
          })}
      </LegacyDashboardGrid>
      {favorites.length === 0 && <EmptyState message="Add Favorites from a resource tile." />}
    </Screen>
  );
}
