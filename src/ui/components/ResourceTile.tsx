import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ResourceRef } from "../../app/types";
import { StoredResourceState } from "../../app/DeviceStateStore";

export interface ResourceTileProps {
  readonly ref?: ResourceRef;
  readonly resource?: ResourceRef;
  readonly title: string;
  readonly subtitle?: string;
  readonly stored?: StoredResourceState;
  readonly favorite?: boolean;
  readonly missing?: boolean;
  readonly onPress?: () => void;
  readonly onEdit?: () => void;
  readonly onFavorite?: () => void;
  readonly onDelete?: () => void;
}

export function ResourceTile(props: ResourceTileProps): JSX.Element {
  const known = props.stored?.state.status === "known";
  const value = props.stored?.state.status === "known" ? props.stored.state.value as Record<string, any> : undefined;
  const on = value?.on ?? value?.state?.on ?? value?.config?.on ?? value?.relayState;
  const backgroundColor = !known || props.missing ? "#586e75" : on === true ? "#b58900" : on === false ? "#073642" : "#268bd2";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.title}
      disabled={!props.onPress || props.missing}
      onPress={props.onPress}
      style={[styles.tile, { backgroundColor }]}
    >
      <Text style={styles.title} numberOfLines={2}>{props.title}</Text>
      {props.subtitle && <Text style={styles.subtitle} numberOfLines={3}>{props.subtitle}</Text>}
      {props.stored?.pending && <Text style={styles.pending}>Pending…</Text>}
      {(!known || props.missing) && (
        <View pointerEvents="none" style={styles.unknownOverlay}>
          <Text style={styles.question}>?</Text>
          <Text style={styles.unknownText}>{props.missing ? "Missing" : "Unknown"}</Text>
        </View>
      )}
      <View style={styles.actions}>
        {props.onFavorite && <Pressable accessibilityRole="button" onPress={props.onFavorite} style={styles.action}><Text>{props.favorite ? "★" : "☆"}</Text></Pressable>}
        {props.onEdit && <Pressable accessibilityRole="button" onPress={props.onEdit} style={styles.action}><Text>✎</Text></Pressable>}
        {props.onDelete && <Pressable accessibilityRole="button" onPress={props.onDelete} style={styles.action}><Text>⌫</Text></Pressable>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    justifyContent: "space-between",
    margin: 6,
    minHeight: 124,
    overflow: "hidden",
    padding: 12,
    width: 160,
  },
  title: { color: "#fdf6e3", fontSize: 16, fontWeight: "700" },
  subtitle: { color: "#fdf6e3", fontSize: 11, marginTop: 5 },
  pending: { color: "#fdf6e3", fontSize: 12 },
  unknownOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
  },
  question: { color: "rgba(253, 246, 227, 0.82)", fontSize: 72, fontWeight: "200", lineHeight: 78 },
  unknownText: { color: "#fdf6e3", fontSize: 12, fontWeight: "700" },
  actions: { alignItems: "flex-end", flexDirection: "row", justifyContent: "flex-end" },
  action: { backgroundColor: "rgba(253,246,227,0.8)", borderRadius: 14, marginLeft: 6, padding: 6 },
});
