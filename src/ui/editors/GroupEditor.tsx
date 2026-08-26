import React, { useState } from "react";
import { EditorChoice, EditorNumberField, EditorSection, EditorTextField, EditorToggle, ReadOnlyField } from "./editorControls";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
import { definiteFailure } from "../../app/commandResults";
import { diagnostic } from "../../app/diagnostics";
import { catalogField } from "../../protocol/hue/catalog/resourceCatalog";

interface GroupValue {
  readonly name?: string;
  readonly lights?: readonly string[];
  readonly class?: string;
  readonly type?: string;
  readonly recycle?: boolean;
  readonly sensors?: readonly string[];
  readonly state?: { readonly all_on?: boolean; readonly any_on?: boolean };
  readonly action?: Record<string, unknown>;
}

const GROUP_CLASSES = ["Living room", "Kitchen", "Dining", "Bedroom", "Kids bedroom", "Bathroom", "Nursery", "Recreation", "Office", "Gym", "Hallway", "Garage", "Terrace", "Garden", "Driveway", "Carport", "Other", "Downstairs", "Upstairs", "Front door", "Top floor", "Attic", "Guest room", "Staircase", "Lounge", "Man cave", "Computer", "Studio", "Music", "TV", "Reading", "Closet", "Storage", "Laundry room", "Balcony", "Porch", "Barbecue", "Pool"] as const;

export function GroupEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const stored = id ? runtime.service.stateStore.get({ kind: "group", id }) : undefined;
  const value = stored?.state.status === "known" ? stored.state.value as GroupValue : undefined;
  const initialAction = value?.action || {};
  const [lights, setLights] = useState((value?.lights || []).join(", "));
  const [groupClass, setGroupClass] = useState(value?.class || "Other");
  const [on, setOn] = useState(booleanValue(initialAction.on, false));
  const [bri, setBri] = useState(numberValue(initialAction.bri));
  const [hue, setHue] = useState(numberValue(initialAction.hue));
  const [sat, setSat] = useState(numberValue(initialAction.sat));
  const [xy, setXy] = useState(pairValue(initialAction.xy));
  const [ct, setCt] = useState(numberValue(initialAction.ct));
  const [alert, setAlert] = useState(stringValue(initialAction.alert, "none"));
  const [effect, setEffect] = useState(stringValue(initialAction.effect, "none"));
  const actionHas = (key: string): boolean => {
    const descriptor = catalogField("group", `action.${key}`);
    return Object.prototype.hasOwnProperty.call(initialAction, key) && (!descriptor?.capability || descriptor.capability(value as unknown as Record<string, unknown>));
  };
  const save = async (name: string) => {
    const membership = lights.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
    if (!id) return runtime.service.createHue("group", { name, lights: membership, class: groupClass });
    const xyValue = parsePair(xy);
    if (actionHas("xy") && xy.trim() && !xyValue) return definiteFailure(diagnostic("ProtocolRejected", "Group XY color must contain two numbers between 0 and 1."));
    return runtime.service.mutateHue("group", id, "update", {
      name,
      lights: membership,
      class: groupClass,
      action: {
        ...(actionHas("on") ? { on } : {}),
        ...(actionHas("bri") && bri !== undefined ? { bri } : {}),
        ...(actionHas("hue") && hue !== undefined ? { hue } : {}),
        ...(actionHas("sat") && sat !== undefined ? { sat } : {}),
        ...(actionHas("xy") && xyValue ? { xy: xyValue } : {}),
        ...(actionHas("ct") && ct !== undefined ? { ct } : {}),
        ...(actionHas("alert") ? { alert } : {}),
        ...(actionHas("effect") ? { effect } : {}),
      },
    });
  };
  const classOptions = GROUP_CLASSES.includes(groupClass as typeof GROUP_CLASSES[number]) ? GROUP_CLASSES : [groupClass, ...GROUP_CLASSES];
  return <EditorForm
    id={id}
    kind="group"
    navigation={navigation}
    note="Membership, class, aggregate state, and supported group actions are catalog-backed. Mixed aggregate state is never treated as Off."
    onSave={save}
    title="Group Editor"
  >
    <EditorSection title="Group membership and metadata">
      <EditorTextField label="Light IDs (comma or space separated)" onChangeText={setLights} placeholder="1, 2, 3" testID="group-lights" value={lights} />
      <EditorChoice label="Group class" onChange={setGroupClass} options={classOptions} testID="group-class" value={groupClass} />
      <ReadOnlyField label="Group type" value={value?.type} />
      <ReadOnlyField label="Recycle" value={value?.recycle} />
      <ReadOnlyField label="Associated sensors" value={value?.sensors} />
      <ReadOnlyField label="Aggregate state" value={aggregateLabel(value?.state)} />
    </EditorSection>
    {id && <EditorSection title="Supported group action">
      {actionHas("on") && <EditorToggle label="Action power" onValueChange={setOn} testID="group-action-on" value={on} />}
      {actionHas("bri") && <EditorNumberField label="Action brightness (1–254)" onChange={setBri} testID="group-action-bri" value={bri} />}
      {actionHas("hue") && <EditorNumberField label="Action hue (0–65535)" onChange={setHue} testID="group-action-hue" value={hue} />}
      {actionHas("sat") && <EditorNumberField label="Action saturation (0–254)" onChange={setSat} testID="group-action-sat" value={sat} />}
      {actionHas("xy") && <EditorTextField label="Action XY color (x,y)" onChangeText={setXy} placeholder="0.5,0.5" testID="group-action-xy" value={xy} />}
      {actionHas("ct") && <EditorNumberField label="Action color temperature" onChange={setCt} testID="group-action-ct" value={ct} />}
      {actionHas("alert") && <EditorChoice label="Action alert" onChange={setAlert} options={["none", "select", "lselect"]} testID="group-action-alert" value={alert} />}
      {actionHas("effect") && <EditorChoice label="Action effect" onChange={setEffect} options={["none", "colorloop"]} testID="group-action-effect" value={effect} />}
    </EditorSection>}
  </EditorForm>;
}

function aggregateLabel(state: GroupValue["state"]): string {
  if (state?.all_on === true) return "All on";
  if (state?.any_on === false) return "All off";
  if (state?.any_on === true && state.all_on === false) return "Mixed / indeterminate";
  return "Unknown";
}

function booleanValue(value: unknown, fallback: boolean): boolean { return typeof value === "boolean" ? value : fallback; }
function numberValue(value: unknown): number | undefined { return typeof value === "number" ? value : undefined; }
function stringValue(value: unknown, fallback: string): string { return typeof value === "string" ? value : fallback; }
function pairValue(value: unknown): string { return Array.isArray(value) && value.length === 2 ? value.join(",") : ""; }
function parsePair(value: string): [number, number] | undefined {
  const values = value.split(",").map((part) => Number(part.trim()));
  return values.length === 2 && values.every((part) => Number.isFinite(part) && part >= 0 && part <= 1) ? [values[0], values[1]] : undefined;
}
