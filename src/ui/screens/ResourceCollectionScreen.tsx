import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ResourceRef, ResourceKind } from "../../app/types";
import { ResourceTile } from "../components/ResourceTile";
import { EmptyState, Screen } from "../components/Screen";
import { useAppRuntime } from "../AppContext";
import { ConfirmDestructiveAction } from "../components/ConfirmDestructiveAction";
import { destructiveActionSpec, performConfirmedHueDelete } from "../../app/destructiveActions";

export interface ResourceCollectionScreenProps {
  readonly kind: Exclude<ResourceKind, "plug">;
  readonly title: string;
  readonly navigation?: any;
  readonly canCreate?: boolean;
  readonly onSearch?: () => void;
}

export function ResourceCollectionScreen({ kind, title, navigation, canCreate, onSearch }: ResourceCollectionScreenProps): JSX.Element {
  const runtime = useAppRuntime();
  const [, setVersion] = useState(0);
  const [deleteId, setDeleteId] = useState<string>();
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
  }, [runtime, kind]);
  const editorRoute = `${title.slice(0, -1)}Editor`;
  const favorites = runtime.configStore.getCommitted()?.favorites || [];
  const navigateAdvanced = () => navigation?.getParent?.()?.navigate("Advanced") || navigation?.navigate?.("Advanced");
  return (
    <Screen title={title}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => void runtime.service.refreshHue()} style={styles.button}><Text style={styles.buttonText}>Refresh</Text></Pressable>
        {canCreate && <Pressable onPress={() => navigation?.getParent?.()?.navigate(editorRoute) || navigation?.navigate?.(editorRoute)} style={styles.button}><Text style={styles.buttonText}>New</Text></Pressable>}
        {onSearch && <Pressable onPress={onSearch} style={styles.button}><Text style={styles.buttonText}>Search</Text></Pressable>}
        <Pressable onPress={navigateAdvanced} style={styles.button}><Text style={styles.buttonText}>Advanced</Text></Pressable>
      </View>
      {entries.length === 0 ? <EmptyState message="No current resources. Refresh when the local bridge is reachable." /> : (
        <View style={styles.grid}>
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
                onDelete={() => setDeleteId(id)}
              />
            );
          })}
        </View>
      )}
      <ConfirmDestructiveAction
        visible={Boolean(deleteId)}
        onCancel={() => setDeleteId(undefined)}
        onConfirmed={() => setDeleteId(undefined)}
        spec={deleteId ? destructiveActionSpec(
          `${title.slice(0, -1)} ${deleteId}`,
          title.slice(0, -1),
          "delete the Hue resource from the bridge and remove its matching local Favorite when possible",
          () => performConfirmedHueDelete(runtime.service, runtime.configStore, kind, deleteId, () => runtime.service.deleteHue(kind, deleteId)),
        ) : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  button: { backgroundColor: "#268bd2", borderRadius: 8, margin: 4, paddingHorizontal: 12, paddingVertical: 9 },
  buttonText: { color: "#fff", fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
});

function sameResourceRef(left: ResourceRef, right: ResourceRef): boolean {
  return left.kind === right.kind && left.id === right.id && left.plugEndpointId === right.plugEndpointId;
}
