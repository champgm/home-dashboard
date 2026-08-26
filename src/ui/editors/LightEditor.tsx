import React, { useMemo, useState } from "react";
import { ReadOnlyField, EditorChoice, EditorHueField, EditorRangeField, EditorSection, EditorXyColorField } from "./editorControls";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
import { definiteFailure } from "../../app/commandResults";
import { diagnostic } from "../../app/diagnostics";
import { catalogField } from "../../protocol/hue/catalog/resourceCatalog";

interface LightValue {
  readonly id?: string;
  readonly name?: string;
  readonly type?: string;
  readonly manufacturername?: string;
  readonly modelid?: string;
  readonly productname?: string;
  readonly uniqueid?: string;
  readonly swversion?: string;
  readonly state?: Record<string, unknown>;
  readonly capabilities?: Record<string, any>;
  readonly config?: Record<string, unknown>;
}

export function LightEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const stored = id ? runtime.service.stateStore.get({ kind: "light", id }) : undefined;
  const value = stored?.state.status === "known" ? stored.state.value as LightValue : undefined;
  const initialState = value?.state || {};
  const [bri, setBri] = useState(numberValue(initialState.bri));
  const [hue, setHue] = useState(numberValue(initialState.hue));
  const [sat, setSat] = useState(numberValue(initialState.sat));
  const [xy, setXy] = useState(pairValue(initialState.xy));
  const [ct, setCt] = useState(numberValue(initialState.ct));
  const [transitiontime, setTransitiontime] = useState(numberValue(initialState.transitiontime));
  const [alert, setAlert] = useState(stringValue(initialState.alert, "none"));
  const [effect, setEffect] = useState(stringValue(initialState.effect, "none"));
  const capabilities = value?.capabilities?.control || {};
  const ctMinimum = numberValue(capabilities.ct?.min) ?? 153;
  const ctMaximum = numberValue(capabilities.ct?.max) ?? 500;
  const stateHas = (key: string): boolean => {
    const descriptor = catalogField("light", `state.${key}`);
    const advertised = Object.prototype.hasOwnProperty.call(initialState, key) || Object.prototype.hasOwnProperty.call(capabilities, key) || (key === "ct" && Boolean(capabilities.ct));
    return advertised && (!descriptor?.capability || descriptor.capability(value as unknown as Record<string, unknown>));
  };
  const visibleFields = useMemo(() => ({ bri: stateHas("bri"), hue: stateHas("hue"), sat: stateHas("sat"), xy: stateHas("xy"), ct: stateHas("ct"), alert: stateHas("alert"), effect: stateHas("effect"), transitiontime: id !== undefined }), [id, value]);
  const save = async (name: string) => {
    if (!id) return runtime.service.createHue("light", { name });
    const xyValue = parsePair(xy);
    if (visibleFields.xy && xy.trim() && !xyValue) return definiteFailure(diagnostic("ProtocolRejected", "XY color must contain two numbers between 0 and 1."));
    return runtime.service.mutateHue("light", id, "update", {
      name,
      state: {
        ...(visibleFields.bri && bri !== undefined ? { bri } : {}),
        ...(visibleFields.hue && hue !== undefined ? { hue } : {}),
        ...(visibleFields.sat && sat !== undefined ? { sat } : {}),
        ...(visibleFields.xy && xyValue ? { xy: xyValue } : {}),
        ...(visibleFields.ct && ct !== undefined ? { ct } : {}),
        ...(visibleFields.alert && alert !== undefined ? { alert } : {}),
        ...(visibleFields.effect && effect !== undefined ? { effect } : {}),
        ...(visibleFields.transitiontime && transitiontime !== undefined ? { transitiontime } : {}),
      },
    });
  };
  return <EditorForm
    id={id}
    kind="light"
    navigation={navigation}
    note="Only fields advertised by the Light state/capability data are writable. Identity, reachability, and configuration data are inspection-only."
    onSave={save}
    title="Light Editor"
  >
    <EditorSection title="Editable light state">
      {visibleFields.bri && <EditorRangeField label="Brightness" maximumValue={254} minimumValue={1} onChange={setBri} testID="light-bri" value={bri} />}
      {visibleFields.hue && <EditorHueField label="Hue color" onChange={setHue} testID="light-hue" value={hue} />}
      {visibleFields.sat && <EditorRangeField label="Saturation" maximumValue={254} minimumValue={0} onChange={setSat} testID="light-sat" value={sat} />}
      {visibleFields.xy && <EditorXyColorField label="XY color" onChangeText={setXy} testID="light-xy" value={xy} />}
      {visibleFields.ct && <EditorRangeField label="Color temperature (warm–cool)" maximumValue={ctMaximum} minimumValue={ctMinimum} onChange={setCt} testID="light-ct" value={ct} />}
      {visibleFields.alert && <EditorChoice label="Alert" onChange={setAlert} options={["none", "select", "lselect"]} testID="light-alert" value={alert} />}
      {visibleFields.effect && <EditorChoice label="Effect" onChange={setEffect} options={["none", "colorloop"]} testID="light-effect" value={effect} />}
      {visibleFields.transitiontime && <EditorRangeField displayScale={0.1} label="Transition duration" maximumValue={600} minimumValue={0} onChange={setTransitiontime} testID="light-transitiontime" unit="seconds" value={transitiontime} />}
    </EditorSection>
    <EditorSection title="Light details">
      <ReadOnlyField label="Light ID" value={id} />
      <ReadOnlyField label="Type" value={value?.type} />
      <ReadOnlyField label="Manufacturer" value={value?.manufacturername} />
      <ReadOnlyField label="Model" value={value?.modelid} />
      <ReadOnlyField label="Product" value={value?.productname} />
      <ReadOnlyField label="Unique ID" value={value?.uniqueid} />
      <ReadOnlyField label="Software version" value={value?.swversion} />
      <ReadOnlyField label="Reachable" value={value?.state?.reachable} />
      <ReadOnlyField label="Color mode" value={value?.state?.colormode} />
    </EditorSection>
  </EditorForm>;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function pairValue(value: unknown): string {
  return Array.isArray(value) && value.length === 2 ? value.join(",") : "";
}

function parsePair(value: string): [number, number] | undefined {
  const values = value.split(",").map((part) => Number(part.trim()));
  return values.length === 2 && values.every((part) => Number.isFinite(part) && part >= 0 && part <= 1)
    ? [values[0], values[1]]
    : undefined;
}
