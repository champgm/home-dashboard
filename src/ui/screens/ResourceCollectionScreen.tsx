import React, { useEffect, useMemo, useState } from "react";
import { ResourceRef, ResourceKind } from "../../app/types";
import { LegacyResourceButton } from "../components/LegacyResourceButton";
import { ResourceTile } from "../components/ResourceTile";
import { EmptyState, Screen } from "../components/Screen";
import { LegacyDashboardGrid } from "../legacy/LegacyDashboardGrid";
import { useAppRuntime } from "../AppContext";

export interface ResourceCollectionScreenProps {
  readonly kind: Exclude<ResourceKind, "plug">;
  readonly title: string;
  readonly navigation?: any;
  readonly canCreate?: boolean;
  readonly onSearch?: () => void;
}

export function ResourceCollectionScreen({ kind, title, navigation, canCreate, onSearch }: ResourceCollectionScreenProps): JSX.Element {
  const runtime = useAppRuntime();
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const unsubscribeState = runtime.service.stateStore.subscribe(() => setVersion((value) => value + 1));
    const unsubscribeConfig = runtime.configStore.subscribe(() => setVersion((value) => value + 1));
    return () => { unsubscribeState(); unsubscribeConfig(); };
  }, [runtime]);
  const entries = useMemo(() => {
    const result: Array<{ id: string; value?: any; stored?: any }> = [];
    runtime.service.stateStore.getAll().forEach((stored, key) => {
      const prefix = `${kind}:`;
      if (key.startsWith(prefix)) {
        const id = key.slice(prefix.length);
        result.push({ id, stored, value: stored.state.status === "known" ? stored.state.value : undefined });
      }
    });
    return result.sort((left, right) => String(left.value?.name || left.id).localeCompare(String(right.value?.name || right.id)));
  }, [runtime, kind, version]);
  const editorRoute = `${title.slice(0, -1)}Editor`;
  const favorites = runtime.configStore.getCommitted()?.favorites || [];
  const navigateAdvanced = () => navigation?.getParent?.()?.navigate("Advanced") || navigation?.navigate?.("Advanced");
  return (
    <Screen showTitle={false} title={title}>
      <LegacyDashboardGrid testID={`${kind}-dashboard-grid`}>
        <LegacyResourceButton hideEdit hideFavorite onPress={() => void runtime.service.refreshHue()} state="known" title="Refresh" />
        {canCreate && <LegacyResourceButton hideEdit hideFavorite onPress={() => navigation?.getParent?.()?.navigate(editorRoute) || navigation?.navigate?.(editorRoute)} state="known" title={`New ${title.slice(0, -1)}`} />}
        {onSearch && <LegacyResourceButton hideEdit hideFavorite onPress={onSearch} state="known" title={kind === "light" ? "Scan for new lights" : kind === "sensor" ? "Scan for new sensors" : "Search"} />}
        <LegacyResourceButton hideEdit hideFavorite onPress={navigateAdvanced} state="known" title="Advanced" />
        {entries.map(({ id, value, stored }) => {
          const ref: ResourceRef = { kind, id };
          return (
            <ResourceTile
              key={id}
              ref={ref}
              title={value?.name || `${title.slice(0, -1)} ${id}`}
              stored={stored}
              onPress={() => void runtime.service.performPrimary(ref)}
              favorite={favorites.some((favorite) => sameResourceRef(favorite, ref))}
              onFavorite={() => void (favorites.some((favorite) => sameResourceRef(favorite, ref)) ? runtime.service.removeFavorite(ref) : runtime.service.addFavorite(ref))}
              onEdit={() => navigation?.getParent?.()?.navigate(editorRoute, { id }) || navigation?.navigate?.(editorRoute, { id })}
            />
          );
        })}
      </LegacyDashboardGrid>
      {entries.length === 0 && <EmptyState message="No current resources. Refresh when the local bridge is reachable." />}
    </Screen>
  );
}

function sameResourceRef(left: ResourceRef, right: ResourceRef): boolean {
  return left.kind === right.kind && left.id === right.id && left.plugEndpointId === right.plugEndpointId;
}
