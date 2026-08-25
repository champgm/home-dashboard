import React from "react";
import { Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import AwesomeButton from "@rcaferati/react-native-awesome-button";
import { getLegacyButtonGeometry } from "../legacy/legacyButtonGeometry";
import { legacyButtonAssets } from "../legacy/legacyButtonAssets";
import { getLegacyButtonColors, LegacyButtonVisualState, legacyButtonPalette } from "../legacy/legacyButtonPalette";

export type LegacyResourceButtonState = LegacyButtonVisualState | "unknown";

export interface LegacyResourceButtonProps {
  readonly title: string;
  readonly visualState?: LegacyResourceButtonState;
  readonly state?: LegacyResourceButtonState;
  readonly favorite?: boolean;
  readonly isFavorite?: boolean;
  readonly onPress?: () => void;
  readonly onFavorite?: () => void;
  readonly onEdit?: () => void;
  readonly hideFavorite?: boolean;
  readonly hideEdit?: boolean;
  readonly hideFavoriteButton?: boolean;
  readonly hideEditButton?: boolean;
  readonly showLightBulb?: boolean;
  readonly unknownAccessibilityLabel?: string;
  readonly testID?: string;
}

export function LegacyResourceButton(props: LegacyResourceButtonProps): JSX.Element {
  const { width } = useWindowDimensions();
  const geometry = getLegacyButtonGeometry(width);
  const visualState = props.visualState || props.state || "known";
  const unknown = visualState === "unknown";
  const mainColors = getLegacyButtonColors(unknown ? "off" : visualState);
  const favorite = props.favorite ?? props.isFavorite ?? false;
  const primaryDisabled = unknown || !props.onPress;
  const favoriteHidden = props.hideFavorite || props.hideFavoriteButton || !props.onFavorite;
  const editHidden = props.hideEdit || props.hideEditButton || !props.onEdit;
  // Legacy ItemButton used the resource face for an inactive Favorite and the
  // dedicated yellow role once the Favorite was active.
  const favoriteColors = favorite ? legacyButtonPalette.favoriteActive : mainColors;

  const mainAccessibilityLabel = props.title;

  return (
    <View style={[styles.container, { height: geometry.tile, marginBottom: geometry.margin * 4, marginLeft: geometry.margin, marginRight: geometry.margin, marginTop: geometry.margin * 4, width: geometry.tile }]}>
      <AwesomeButton
        backgroundActive={mainColors.activeFace}
        backgroundColor={mainColors.face}
        backgroundDarker={mainColors.darkerFace}
        backgroundShadow={mainColors.darkerFace}
        borderRadius={3}
        disabled={primaryDisabled}
        height={geometry.mainDimension}
        paddingHorizontal={5}
        raiseLevel={4}
        springRelease
        textColor={mainColors.text}
        width={geometry.mainDimension}
        dangerouslySetPressableProps={{
          accessibilityLabel: mainAccessibilityLabel,
          accessibilityState: { disabled: primaryDisabled },
          style: [{ backgroundColor: mainColors.face }],
          testID: props.testID ? `${props.testID}-primary` : "legacy-resource-primary",
        }}
        onPress={() => props.onPress?.()}
      >
        <View style={styles.mainContent}>
          <Text numberOfLines={2} style={[styles.title, { color: mainColors.text }]}>{props.title}</Text>
          {props.showLightBulb && !unknown && <Image accessibilityLabel="Light bulb" source={legacyButtonAssets.lightBulb} style={styles.lightBulb} />}
          {unknown && <View pointerEvents="none" style={styles.unknownOverlay}>
            <Image
              accessibilityLabel={props.unknownAccessibilityLabel || "Unknown resource state"}
              accessible
              resizeMode="contain"
              source={legacyButtonAssets.questionMark}
              style={styles.questionMark}
              testID="resource-unknown-icon"
            />
          </View>}
        </View>
      </AwesomeButton>

      {!favoriteHidden && <AwesomeButton
        backgroundActive={favoriteColors.activeFace}
        backgroundColor={favoriteColors.face}
        backgroundDarker={favoriteColors.darkerFace}
        backgroundShadow={favoriteColors.darkerFace}
        borderRadius={2}
        height={geometry.miniDimension}
        hitSlop={4}
        paddingHorizontal={0}
        raiseLevel={3}
        springRelease
        width={geometry.miniDimension}
        style={[styles.miniButton, { height: geometry.miniDimension, left: geometry.favoritePosition.left, top: geometry.favoritePosition.top, width: geometry.miniDimension }]}
        dangerouslySetPressableProps={{
          accessibilityLabel: favorite ? "Remove Favorite" : "Add Favorite",
          style: [{ backgroundColor: favoriteColors.face, height: geometry.miniDimension, left: geometry.favoritePosition.left, position: "absolute", top: geometry.favoritePosition.top, width: geometry.miniDimension, zIndex: 20 }],
          testID: props.testID ? `${props.testID}-favorite` : "legacy-resource-favorite",
        }}
        onPress={() => props.onFavorite?.()}
      >
        <Image
          accessibilityLabel="Favorite icon"
          resizeMode="contain"
          source={legacyButtonAssets.favorite}
          style={styles.actionImage}
          testID="resource-favorite-icon"
        />
      </AwesomeButton>}

      {!editHidden && <AwesomeButton
        backgroundActive={legacyButtonPalette.edit.activeFace}
        backgroundColor={legacyButtonPalette.edit.face}
        backgroundDarker={legacyButtonPalette.edit.darkerFace}
        backgroundShadow={legacyButtonPalette.edit.darkerFace}
        borderRadius={2}
        height={geometry.miniDimension}
        hitSlop={4}
        paddingHorizontal={0}
        raiseLevel={3}
        springRelease
        width={geometry.miniDimension}
        style={[styles.miniButton, { height: geometry.miniDimension, left: geometry.editPosition.left, top: geometry.editPosition.top, width: geometry.miniDimension }]}
        dangerouslySetPressableProps={{
          accessibilityLabel: "Edit",
          style: [{ backgroundColor: legacyButtonPalette.edit.face, height: geometry.miniDimension, left: geometry.editPosition.left, position: "absolute", top: geometry.editPosition.top, width: geometry.miniDimension, zIndex: 20 }],
          testID: props.testID ? `${props.testID}-edit` : "legacy-resource-edit",
        }}
        onPress={() => props.onEdit?.()}
      >
        <Image
          accessibilityLabel="Edit icon"
          resizeMode="contain"
          source={legacyButtonAssets.edit}
          style={styles.actionImage}
          testID="resource-edit-icon"
        />
      </AwesomeButton>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "visible", position: "relative" },
  mainContent: { alignItems: "center", flex: 1, justifyContent: "center", overflow: "hidden", position: "relative", width: "100%" },
  title: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  lightBulb: { height: "72%", opacity: 0.2, position: "absolute", width: "72%" },
  unknownOverlay: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.16)", bottom: 0, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 },
  questionMark: { height: "90%", opacity: 0.42, width: "90%" },
  miniButton: { position: "absolute", zIndex: 20 },
  actionImage: { height: "80%", width: "80%" },
});
