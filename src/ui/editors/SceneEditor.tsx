import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { EditorAction, EditorCatalogNumberField, EditorChoice, EditorHueField, EditorNumberField, EditorSection, EditorSummaryRow, EditorTextField, EditorToggle, EditorXyColorField, ReadOnlyField } from "./editorControls";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
import { HueSceneLightState } from "../../protocol/hue/resources/scenes";
import { definiteFailure } from "../../app/commandResults";
import { diagnostic } from "../../app/diagnostics";
import { ExpandableAdvancedSection } from "../components/ExpandableAdvancedSection";

interface SceneValue {
  readonly name?: string;
  readonly type?: string;
  readonly group?: string;
  readonly lights?: readonly string[];
  readonly recycle?: boolean;
  readonly locked?: boolean;
  readonly owner?: string;
  readonly version?: number;
  readonly lastupdated?: string;
  readonly appdata?: { readonly version?: number };
  readonly lightstates?: Record<string, HueSceneLightState>;
}

export function SceneEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const stored = id ? runtime.service.stateStore.get({ kind: "scene", id }) : undefined;
  const value = stored?.state.status === "known" ? stored.state.value as SceneValue : undefined;
  const [sceneType, setSceneType] = useState(value?.type === "LightScene" ? "LightScene" : "GroupScene");
  const [group, setGroup] = useState(value?.group || "");
  const [lights, setLights] = useState((value?.lights || Object.keys(value?.lightstates || {})).join(", "));
  const [recycle, setRecycle] = useState(value?.recycle !== false);
  const [appDataVersion, setAppDataVersion] = useState(typeof value?.appdata?.version === "number" ? value.appdata.version : undefined);
  const [lightStates, setLightStates] = useState<Record<string, HueSceneLightState>>(value?.lightstates || {});
  const [activeLightId, setActiveLightId] = useState<string>();
  const [stateMessage, setStateMessage] = useState<string>();
  const [activationMessage, setActivationMessage] = useState<string>();
  const save = async (name: string) => {
    const memberLights = lights.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
    if (sceneType === "GroupScene" && !group.trim()) return definiteFailure(diagnostic("ProtocolRejected", "A GroupScene requires a Group ID."));
    if (sceneType === "LightScene" && memberLights.length === 0) return definiteFailure(diagnostic("ProtocolRejected", "A LightScene requires at least one Light ID."));
    const payload: Record<string, unknown> = {
      name,
      ...(id ? {} : { type: sceneType }),
      ...(sceneType === "GroupScene" ? { group: group.trim() } : { lights: memberLights }),
      recycle,
      ...(appDataVersion === undefined ? {} : { appdata: { version: appDataVersion } }),
    };
    return id ? runtime.service.mutateHue("scene", id, "update", payload) : runtime.service.createHue("scene", payload);
  };
  const saveLightStates = async () => {
    if (!id) return;
    for (const [lightId, state] of Object.entries(lightStates)) {
      const result = await runtime.service.mutateSceneLightState(id, lightId, state as Record<string, unknown>);
      if (result.kind !== "success") {
        setStateMessage(result.diagnostic?.message || "Scene light state was not saved.");
        return;
      }
    }
    setStateMessage("Scene light states saved and refreshed.");
  };
  const selectedLights = lights.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
  return <EditorForm
    id={id}
    kind="scene"
    navigation={navigation}
    note="Scene name and membership save with the scene. Per-light states use the separate Hue lightstates action."
    onSave={save}
    title="Scene Editor"
  >
    <EditorSection title="Scene membership">
      {!id && <EditorChoice label="Scene type" onChange={setSceneType} options={["GroupScene", "LightScene"]} testID="scene-type" value={sceneType} />}
      {id && <ReadOnlyField label="Scene type" value={value?.type || sceneType} />}
      {sceneType === "GroupScene" && <EditorTextField keyboardType="numeric" label="Group ID" onChangeText={setGroup} placeholder="1" testID="scene-group" value={group} />}
      {sceneType === "LightScene" && <EditorTextField keyboardType="numeric" label="Light IDs (comma or space separated)" onChangeText={setLights} placeholder="1, 2" testID="scene-lights" value={lights} />}
      <EditorSummaryRow label="Members" value={sceneType === "GroupScene" ? (group.trim() ? `Group ${group.trim()}` : "No group selected") : `${selectedLights.length} light${selectedLights.length === 1 ? "" : "s"} selected`} />
    </EditorSection>
    {id && value && <EditorSection title="Live scene action">
      <EditorAction label="Activate scene now" onPress={() => void runtime.service.performPrimary({ kind: "scene", id }).then((result) => setActivationMessage(result.kind === "success" ? "Scene activation requested and refreshed." : result.diagnostic?.message || "Scene activation was not completed.")).catch((error) => setActivationMessage(error instanceof Error ? error.message : "Scene activation was not completed."))} testID="scene-activate" />
      {activationMessage && <Text style={styles.stateMessage}>{activationMessage}</Text>}
    </EditorSection>}
    <EditorSection title="Light-state summary">
      {selectedLights.length === 0 && <ReadOnlyField label="Light states" value="Select Light IDs for a LightScene or inspect returned state." />}
      {selectedLights.map((lightId) => {
        const state = lightStates[lightId] || {};
        const label = lightLabel(runtime.service.stateStore, lightId);
        return <React.Fragment key={lightId}>
          <EditorSummaryRow label={label} onPress={() => setActiveLightId((current) => current === lightId ? undefined : lightId)} testID={`scene-light-${lightId}-summary`} value={sceneLightSummary(state)} expanded={activeLightId === lightId} />
          {activeLightId === lightId && <View style={styles.lightEditor} testID={`scene-light-${lightId}-editor`}>
            <EditorToggle label={`${label} power`} onValueChange={(on) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], on } }))} testID={`scene-light-${lightId}-on`} value={state.on === true} />
            <EditorCatalogNumberField fieldKey="bri" label="Brightness" onChange={(bri) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(bri === undefined ? {} : { bri }) } }))} showExact={false} testID={`scene-light-${lightId}-bri`} value={state.bri} />
            <EditorHueField label="Hue color" onChange={(hue) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(hue === undefined ? {} : { hue }) } }))} showExact={false} testID={`scene-light-${lightId}-hue`} value={state.hue} />
            <EditorCatalogNumberField fieldKey="sat" label="Saturation" onChange={(sat) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(sat === undefined ? {} : { sat }) } }))} showExact={false} testID={`scene-light-${lightId}-sat`} value={state.sat} />
            <EditorXyColorField label="XY color" onChangeText={(xy) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(parsePair(xy) ? { xy: parsePair(xy) } : {}) } }))} showExact={false} testID={`scene-light-${lightId}-xy`} value={pairValue(state.xy)} />
            <EditorCatalogNumberField fieldKey="ct" label="Color temperature" onChange={(ct) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(ct === undefined ? {} : { ct }) } }))} showExact={false} testID={`scene-light-${lightId}-ct`} value={state.ct} />
            <EditorChoice label="Alert" onChange={(alert) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], alert } }))} options={["none", "select", "lselect"]} testID={`scene-light-${lightId}-alert`} value={state.alert || "none"} />
            <EditorChoice label="Effect" onChange={(effect) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], effect } }))} options={["none", "colorloop"]} testID={`scene-light-${lightId}-effect`} value={state.effect || "none"} />
            <EditorCatalogNumberField fieldKey="transitiontime" label="Transition duration" onChange={(transitiontime) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(transitiontime === undefined ? {} : { transitiontime }) } }))} showExact={false} testID={`scene-light-${lightId}-transitiontime`} value={state.transitiontime} />
            <ReadOnlyField label="Exact light ID" value={lightId} />
            <EditorAction label="Done" onPress={() => setActiveLightId(undefined)} testID={`scene-light-${lightId}-done`} />
          </View>}
        </React.Fragment>;
      })}
      {id && Object.keys(lightStates).length > 0 && <EditorAction label="Save per-light scene states" onPress={() => void saveLightStates()} testID="scene-save-lightstates" />}
      {stateMessage && <Text style={styles.stateMessage}>{stateMessage}</Text>}
    </EditorSection>
    <ExpandableAdvancedSection summary="Recycle, exact application data, and bridge scene metadata" testID="scene-advanced">
      <EditorToggle label="Recycle scene" onValueChange={setRecycle} testID="scene-recycle" value={recycle} />
      <EditorNumberField label="Application-data version" onChange={setAppDataVersion} testID="scene-appdata-version" value={appDataVersion} />
      <ReadOnlyField label="Owner" value={value?.owner} />
      <ReadOnlyField label="Locked" value={value?.locked} />
      <ReadOnlyField label="Version" value={value?.version} />
      <ReadOnlyField label="Last updated" value={value?.lastupdated} />
    </ExpandableAdvancedSection>
  </EditorForm>;
}

function lightLabel(stateStore: { get: (ref: { kind: "light"; id: string }) => { state: { status: string; value?: unknown } } | undefined }, id: string): string {
  const stored = stateStore.get({ kind: "light", id });
  if (stored?.state.status === "known" && stored.state.value && typeof stored.state.value === "object") {
    const name = (stored.state.value as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return `${name.trim()} (Light ${id})`;
  }
  return `Light ${id}`;
}

function sceneLightSummary(state: HueSceneLightState): string {
  const values: string[] = [];
  if (typeof state.on === "boolean") values.push(state.on ? "On" : "Off");
  if (typeof state.bri === "number") values.push(`Brightness ${state.bri}/254`);
  if (typeof state.hue === "number") values.push(`Hue ${state.hue}/65535`);
  if (typeof state.sat === "number") values.push(`Saturation ${state.sat}/254`);
  if (Array.isArray(state.xy)) values.push(`XY ${state.xy.join(",")}`);
  if (typeof state.ct === "number") values.push(`Color temperature ${state.ct}`);
  if (typeof state.alert === "string" && state.alert !== "none") values.push(state.alert);
  if (typeof state.effect === "string" && state.effect !== "none") values.push(state.effect);
  if (typeof state.transitiontime === "number") values.push(`Transition ${state.transitiontime}`);
  return values.length > 0 ? values.join(" · ") : "No state values set";
}

function pairValue(value: unknown): string { return Array.isArray(value) && value.length === 2 ? value.join(",") : ""; }
function parsePair(value: string): [number, number] | undefined {
  const values = value.split(",").map((part) => Number(part.trim()));
  return values.length === 2 && values.every((part) => Number.isFinite(part) && part >= 0 && part <= 1) ? [values[0], values[1]] : undefined;
}

const styles = StyleSheet.create({
  lightEditor: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, marginBottom: 8, marginTop: 4, padding: 10 },
  stateMessage: { color: "#b58900", marginTop: 8 },
});
