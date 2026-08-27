import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { ResourceRef, ResourceKind } from "../../app/types";
import { LegacyResourceButton } from "../components/LegacyResourceButton";
import { ResourceTile } from "../components/ResourceTile";
import { EmptyState, Screen } from "../components/Screen";
import { LegacyDashboardGrid, LegacyDashboardUtilityRow } from "../legacy/LegacyDashboardGrid";
import { useAppRuntime } from "../AppContext";
import { buildEditorModel, snapshotFromStateStore } from "../../protocol/hue/dimmer";

export interface ResourceCollectionScreenProps {
  readonly kind: Exclude<ResourceKind, "plug">;
  readonly title: string;
  readonly navigation?: any;
  readonly canCreate?: boolean;
  readonly onSearch?: () => Promise<unknown> | void;
}

export function ResourceCollectionScreen({ kind, title, navigation, canCreate, onSearch }: ResourceCollectionScreenProps): JSX.Element {
  const runtime = useAppRuntime();
  const [version, setVersion] = useState(0);
  const [searchMessage, setSearchMessage] = useState<string>();
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
  const navigateEditor = (id: string): void => {
    if (kind === "sensor") {
      const snapshot = snapshotFromStateStore(runtime.service.stateStore);
      const model = buildEditorModel({ kind: "sensor", id }, snapshot, runtime.service.dimmerCatalog);
      if (model.recognized) {
        navigateFromCollection(navigation, "ConfigureDimmer", { sensorId: id, deviceKey: model.deviceKey });
        return;
      }
    }
    navigateFromCollection(navigation, editorRoute, { id });
  };
  const startSearch = async () => {
    if (!onSearch) return;
    try {
      const result = await onSearch() as { started?: boolean; status?: { active?: boolean; recent?: boolean } } | undefined;
      if (!result) {
        setSearchMessage("Search could not be started because Hue is not configured.");
      } else if (result.started) {
        setSearchMessage("Bridge search started. Results will appear after the bridge reports them.");
      } else if (result.status?.active) {
        setSearchMessage("A bridge search is already active; another search was not started.");
      } else if (result.status?.recent) {
        setSearchMessage("The bridge reports a recent search; another search was not started.");
      } else {
        setSearchMessage("The bridge did not start the search.");
      }
    } catch (_error) {
      setSearchMessage("Search status or start request failed.");
    }
  };
  return (
    <Screen showTitle={false} title={title}>
      {searchMessage && <Text accessibilityRole="alert" style={styles.searchMessage}>{searchMessage}</Text>}
      <LegacyDashboardGrid testID={`${kind}-dashboard-grid`}>
        <LegacyDashboardUtilityRow testID={`${kind}-dashboard-utilities`}>
          <LegacyResourceButton hideEdit hideFavorite onPress={() => void runtime.service.refreshHue()} state="known" title="Refresh" utility />
          {canCreate && <LegacyResourceButton hideEdit hideFavorite onPress={() => navigation?.getParent?.()?.navigate(editorRoute) || navigation?.navigate?.(editorRoute)} state="known" title={`New ${title.slice(0, -1)}`} utility />}
          {onSearch && <LegacyResourceButton hideEdit hideFavorite onPress={() => void startSearch()} state="known" title={kind === "light" ? "Scan for new lights" : kind === "sensor" ? "Scan for new sensors" : "Search"} utility />}
          <LegacyResourceButton hideEdit hideFavorite onPress={navigateAdvanced} state="known" title="Config" utility />
        </LegacyDashboardUtilityRow>
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
              onEdit={stored?.state.status === "known" ? () => navigateEditor(id) : undefined}
            />
          );
        })}
      </LegacyDashboardGrid>
      {entries.length === 0 && <EmptyState message="No current resources. Refresh when the local bridge is reachable." />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchMessage: { backgroundColor: "#073642", borderRadius: 8, color: "#fdf6e3", marginBottom: 10, padding: 10 },
});

function sameResourceRef(left: ResourceRef, right: ResourceRef): boolean {
  return left.kind === right.kind && left.id === right.id && left.plugEndpointId === right.plugEndpointId;
}

function navigateFromCollection(navigation: any, route: string, params?: Record<string, unknown>): void {
  const parent = navigation?.getParent?.();
  if (parent?.navigate) {
    parent.navigate(route, params);
    return;
  }
  navigation?.navigate?.(route, params);
}
