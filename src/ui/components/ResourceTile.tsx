import React from "react";
import { ResourceRef } from "../../app/types";
import { StoredResourceState } from "../../app/DeviceStateStore";
import { LegacyResourceButton, LegacyResourceButtonState } from "./LegacyResourceButton";

export interface ResourceTileProps {
  readonly ref?: ResourceRef;
  readonly resource?: ResourceRef;
  readonly title: string;
  /** Retained for callers that still compute diagnostic text; compact tiles intentionally omit it. */
  readonly subtitle?: string;
  readonly stored?: StoredResourceState;
  readonly favorite?: boolean;
  readonly missing?: boolean;
  readonly onPress?: () => void;
  readonly onEdit?: () => void;
  readonly onFavorite?: () => void;
}

export function ResourceTile(props: ResourceTileProps): JSX.Element {
  const resource = props.resource || props.ref;
  const visualState = getVisualState(resource, props.stored, props.missing);

  return (
    <LegacyResourceButton
      favorite={props.favorite}
      onEdit={props.onEdit}
      onFavorite={props.onFavorite}
      onPress={props.onPress}
      showLightBulb={resource?.kind === "light" && visualState === "on"}
      state={visualState}
      title={props.title}
      unknownAccessibilityLabel={props.missing ? "Missing resource" : "Unknown resource state"}
    />
  );
}

export function getVisualState(ref: ResourceRef | undefined, stored: StoredResourceState | undefined, missing?: boolean): LegacyResourceButtonState {
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
