import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ResourceRef } from "../../app/types";
import { useAppRuntime } from "../AppContext";
import { ResourceTile } from "../components/ResourceTile";
import { EmptyState, Screen } from "../components/Screen";

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
    <Screen title="Favorites">
      <View style={styles.toolbar}>
        <Pressable onPress={() => navigation?.navigate("Advanced")} style={styles.button}><Text style={styles.buttonText}>Advanced</Text></Pressable>
      </View>
      {favorites.length === 0 ? <EmptyState message="Add Favorites from a resource tile." /> : (
        <View style={styles.grid}>
          {favorites.map((ref, index) => {
            const state = runtime.service.stateStore.get(ref);
            const title = state?.state.status === "known" ? String((state.state.value as any)?.name || (state.state.value as any)?.alias || ref.id || ref.plugEndpointId) : `${ref.kind} ${ref.id || ref.plugEndpointId}`;
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
              />
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", marginBottom: 8 },
  button: { backgroundColor: "#268bd2", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  buttonText: { color: "#fff", fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
});
