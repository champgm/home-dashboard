import React from "react";
import {
  GestureResponderEvent,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ResourceRef } from "../../app/types";
import { StoredResourceState } from "../../app/DeviceStateStore";
import {
  getLegacyTileColor,
  getLegacyTileMetrics,
  LegacyTileVisualState,
  legacyDashboardPalette,
} from "../theme/legacyDashboard";

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
}

export function ResourceTile(props: ResourceTileProps): JSX.Element {
  const { width } = useWindowDimensions();
  const metrics = getLegacyTileMetrics(width);
  const resource = props.resource || props.ref;
  const visualState = getVisualState(resource, props.stored, props.missing);
  const unknown = visualState === "unknown";
  const tileColor = getLegacyTileColor(visualState);

  const invoke = (event: GestureResponderEvent | undefined, action?: () => void): void => {
    event?.stopPropagation();
    action?.();
  };

  return (
    <View style={[styles.tile, { height: metrics.tile, margin: metrics.margin, width: metrics.tile }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.title}
        disabled={!props.onPress || props.missing}
        onPress={props.onPress}
        style={({ pressed }) => [
          styles.main,
          { backgroundColor: tileColor, borderBottomColor: pressed ? legacyDashboardPalette.base02 : legacyDashboardPalette.base3 },
        ]}
      >
        <Text style={styles.title} numberOfLines={2}>{props.title}</Text>
        {props.subtitle && <Text style={styles.subtitle} numberOfLines={2}>{props.subtitle}</Text>}
        {props.stored?.pending && <Text style={styles.pending}>Pending…</Text>}
        {unknown && <View pointerEvents="none" style={styles.unknownOverlay}>
          <Image
            accessible
            accessibilityLabel={props.missing ? "Missing resource" : "Unknown resource state"}
            resizeMode="contain"
            source={require("../../../assets/questionMark.png")}
            style={styles.questionMark}
            testID="resource-unknown-icon"
          />
        </View>}
      </Pressable>
      {props.onFavorite && <Pressable
        accessibilityLabel={props.favorite ? "Remove Favorite" : "Add Favorite"}
        accessibilityRole="button"
        hitSlop={4}
        onPress={(event) => invoke(event, props.onFavorite)}
        style={[styles.cornerAction, styles.favoriteAction, { height: metrics.action, width: metrics.action }]}
      >
        <Image accessibilityLabel="Favorite icon" resizeMode="contain" source={require("../../../assets/favorite.png")} style={styles.actionImage} testID="resource-favorite-icon" />
      </Pressable>}
      {props.onEdit && <Pressable
        accessibilityLabel="Edit"
        accessibilityRole="button"
        hitSlop={4}
        onPress={(event) => invoke(event, props.onEdit)}
        style={[styles.cornerAction, styles.editAction, { height: metrics.action, width: metrics.action }]}
      >
        <Image accessibilityLabel="Edit icon" resizeMode="contain" source={require("../../../assets/edit.png")} style={styles.actionImage} testID="resource-edit-icon" />
      </Pressable>}
    </View>
  );
}

function getVisualState(ref: ResourceRef | undefined, stored: StoredResourceState | undefined, missing?: boolean): LegacyTileVisualState {
  if (missing || stored?.state.status !== "known") return "unknown";
  const value = stored.state.value as Record<string, any>;
  const state = value.state && typeof value.state === "object" ? value.state : undefined;
  if (ref?.kind === "group" && typeof state?.any_on === "boolean" && typeof state?.all_on === "boolean" && state.any_on !== state.all_on) {
    return "indeterminate";
  }
  const on = value.on ?? state?.on ?? value.config?.on ?? value.relayState;
  if (on === true) return "on";
  if (on === false) return "off";
  return "known";
}

const styles = StyleSheet.create({
  tile: { overflow: "visible" },
  main: {
    alignItems: "center",
    borderBottomWidth: 4,
    borderRadius: 3,
    elevation: 3,
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 1,
  },
  title: { color: legacyDashboardPalette.base3, fontSize: 12, fontWeight: "700", textAlign: "center" },
  subtitle: { color: legacyDashboardPalette.base3, fontSize: 9, marginTop: 3, textAlign: "center" },
  pending: { color: legacyDashboardPalette.base3, fontSize: 9, marginTop: 3 },
  unknownOverlay: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)", bottom: 0, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 },
  questionMark: { height: "90%", opacity: 0.42, width: "90%" },
  cornerAction: { alignItems: "center", borderRadius: 2, bottom: -4, elevation: 4, justifyContent: "center", position: "absolute", shadowColor: "#000", shadowOffset: { height: 1, width: 0 }, shadowOpacity: 0.35, shadowRadius: 1 },
  favoriteAction: { backgroundColor: legacyDashboardPalette.yellow, left: -2 },
  editAction: { backgroundColor: legacyDashboardPalette.blue, right: -2 },
  actionImage: { height: "82%", width: "82%" },
});
