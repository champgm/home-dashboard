import React, { useState } from "react";
import { EditorChoice, EditorNumberField, EditorSection, EditorTextField, EditorToggle, ReadOnlyField, EditorAction } from "./editorControls";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
import { HueSceneLightState } from "../../protocol/hue/resources/scenes";
import { definiteFailure } from "../../app/commandResults";
import { diagnostic } from "../../app/diagnostics";

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
      if (result.kind !== "success") return;
    }
  };
  const selectedLights = lights.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
  return <EditorForm
    id={id}
    kind="scene"
    navigation={navigation}
    note="GroupScene and LightScene use distinct membership forms. Per-light state is written through the Hue lightstates subresource."
    onSave={save}
    title="Scene Editor"
  >
    <EditorSection title="Scene form and membership">
      {id ? <ReadOnlyField label="Scene type" value={value?.type || sceneType} /> : <EditorChoice label="Scene type" onChange={setSceneType} options={["GroupScene", "LightScene"]} testID="scene-type" value={sceneType} />}
      {sceneType === "GroupScene" && <EditorTextField label="Group ID" onChangeText={setGroup} placeholder="1" testID="scene-group" value={group} />}
      {sceneType === "LightScene" && <EditorTextField label="Light IDs (comma or space separated)" onChangeText={setLights} placeholder="1, 2" testID="scene-lights" value={lights} />}
      <EditorToggle label="Recycle scene" onValueChange={setRecycle} testID="scene-recycle" value={recycle} />
      <EditorNumberField label="Application-data version" onChange={setAppDataVersion} testID="scene-appdata-version" value={appDataVersion} />
      <ReadOnlyField label="Owner" value={value?.owner} />
      <ReadOnlyField label="Locked" value={value?.locked} />
      <ReadOnlyField label="Version" value={value?.version} />
      <ReadOnlyField label="Last updated" value={value?.lastupdated} />
    </EditorSection>
    <EditorSection title="Per-light scene state">
      {selectedLights.length === 0 && <ReadOnlyField label="Light states" value="Select Light IDs for a LightScene or inspect returned state." />}
      {selectedLights.map((lightId) => {
        const state = lightStates[lightId] || {};
        return <React.Fragment key={lightId}>
          <ReadOnlyField label={`Light ${lightId}`} value={lightId} />
          <EditorToggle label={`Light ${lightId} on`} onValueChange={(on) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], on } }))} testID={`scene-light-${lightId}-on`} value={state.on === true} />
          <EditorNumberField label={`Light ${lightId} brightness`} onChange={(bri) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(bri === undefined ? {} : { bri }) } }))} testID={`scene-light-${lightId}-bri`} value={state.bri} />
          <EditorNumberField label={`Light ${lightId} hue`} onChange={(hue) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(hue === undefined ? {} : { hue }) } }))} testID={`scene-light-${lightId}-hue`} value={state.hue} />
          <EditorNumberField label={`Light ${lightId} saturation`} onChange={(sat) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(sat === undefined ? {} : { sat }) } }))} testID={`scene-light-${lightId}-sat`} value={state.sat} />
          <EditorTextField label={`Light ${lightId} XY color (x,y)`} onChangeText={(xy) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(parsePair(xy) ? { xy: parsePair(xy) } : {}) } }))} placeholder="0.5,0.5" testID={`scene-light-${lightId}-xy`} value={pairValue(state.xy)} />
          <EditorNumberField label={`Light ${lightId} color temperature`} onChange={(ct) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(ct === undefined ? {} : { ct }) } }))} testID={`scene-light-${lightId}-ct`} value={state.ct} />
          <EditorChoice label={`Light ${lightId} alert`} onChange={(alert) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], alert } }))} options={["none", "select", "lselect"]} testID={`scene-light-${lightId}-alert`} value={state.alert || "none"} />
          <EditorChoice label={`Light ${lightId} effect`} onChange={(effect) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], effect } }))} options={["none", "colorloop"]} testID={`scene-light-${lightId}-effect`} value={state.effect || "none"} />
          <EditorNumberField label={`Light ${lightId} transition time`} onChange={(transitiontime) => setLightStates((current) => ({ ...current, [lightId]: { ...current[lightId], ...(transitiontime === undefined ? {} : { transitiontime }) } }))} testID={`scene-light-${lightId}-transitiontime`} value={state.transitiontime} />
        </React.Fragment>;
      })}
      {id && Object.keys(lightStates).length > 0 && <EditorAction label="Save per-light scene states" onPress={() => void saveLightStates()} testID="scene-save-lightstates" />}
    </EditorSection>
    {id && value && <EditorAction label="Activate scene" onPress={() => void runtime.service.performPrimary({ kind: "scene", id })} testID="scene-activate" />}
  </EditorForm>;
}

function pairValue(value: unknown): string { return Array.isArray(value) && value.length === 2 ? value.join(",") : ""; }
function parsePair(value: string): [number, number] | undefined {
  const values = value.split(",").map((part) => Number(part.trim()));
  return values.length === 2 && values.every((part) => Number.isFinite(part) && part >= 0 && part <= 1) ? [values[0], values[1]] : undefined;
}
