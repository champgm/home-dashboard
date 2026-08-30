import React, { useState } from "react";
import { EditorCatalogNumberField, EditorChoice, EditorChoiceOption, EditorHueField, EditorMultiChoice, EditorSection, EditorToggle, EditorXyColorField, ReadOnlyField } from "./editorControls";
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
  const [lights, setLights] = useState<readonly string[]>(value?.lights || []);
  const [groupClass, setGroupClass] = useState(value?.class || "Other");
  const [on, setOn] = useState(booleanValue(initialAction.on, false));
  const [bri, setBri] = useState(numberValue(initialAction.bri));
  const [hue, setHue] = useState(numberValue(initialAction.hue));
  const [sat, setSat] = useState(numberValue(initialAction.sat));
  const [xy, setXy] = useState(pairValue(initialAction.xy));
  const [ct, setCt] = useState(numberValue(initialAction.ct));
  const [transitiontime, setTransitiontime] = useState(numberValue(initialAction.transitiontime));
  const [alert, setAlert] = useState(stringValue(initialAction.alert, "none"));
  const [effect, setEffect] = useState(stringValue(initialAction.effect, "none"));
  const actionHas = (key: string): boolean => {
    const descriptor = catalogField("group", `action.${key}`);
    return Object.prototype.hasOwnProperty.call(initialAction, key) && (!descriptor?.capability || descriptor.capability(value as unknown as Record<string, unknown>));
  };
  const save = async (name: string) => {
    const membership = [...lights];
    if (!id) return runtime.service.createHue("group", { name, lights: membership, type: "Room", class: groupClass });
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
        ...(actionHas("transitiontime") && transitiontime !== undefined ? { transitiontime } : {}),
        ...(actionHas("alert") ? { alert } : {}),
        ...(actionHas("effect") ? { effect } : {}),
      },
    });
  };
  const classOptions = GROUP_CLASSES.includes(groupClass as typeof GROUP_CLASSES[number]) ? GROUP_CLASSES : [groupClass, ...GROUP_CLASSES];
  const lightOptions = availableLightOptions(runtime.service.stateStore.getAll(), lights);
  return <EditorForm
    id={id}
    kind="group"
    navigation={navigation}
    note="Membership, class, aggregate state, and supported group actions are catalog-backed. Mixed aggregate state is never treated as Off."
    onSave={save}
    title="Group Editor"
  >
    <EditorSection title="Editable group membership">
      <EditorMultiChoice label="Lights" onChange={setLights} options={lightOptions} testID="group-lights" values={lights} />
      <EditorChoice label="Group class" onChange={setGroupClass} options={classOptions} testID="group-class" value={groupClass} />
    </EditorSection>
    {id && <EditorSection title="Supported group action">
      {actionHas("on") && <EditorToggle label="Action power" onValueChange={setOn} testID="group-action-on" value={on} />}
      {actionHas("bri") && <EditorCatalogNumberField fieldKey="bri" label="Action brightness" onChange={setBri} testID="group-action-bri" value={bri} />}
      {actionHas("hue") && <EditorHueField label="Action hue color" onChange={setHue} testID="group-action-hue" value={hue} />}
      {actionHas("sat") && <EditorCatalogNumberField fieldKey="sat" label="Action saturation" onChange={setSat} testID="group-action-sat" value={sat} />}
      {actionHas("xy") && <EditorXyColorField label="Action XY color" onChangeText={setXy} testID="group-action-xy" value={xy} />}
      {actionHas("ct") && <EditorCatalogNumberField fieldKey="ct" label="Action color temperature" onChange={setCt} testID="group-action-ct" value={ct} />}
      {actionHas("alert") && <EditorChoice label="Action alert" onChange={setAlert} options={["none", "select", "lselect"]} testID="group-action-alert" value={alert} />}
      {actionHas("effect") && <EditorChoice label="Action effect" onChange={setEffect} options={["none", "colorloop"]} testID="group-action-effect" value={effect} />}
      {actionHas("transitiontime") && <EditorCatalogNumberField fieldKey="transitiontime" label="Action transition duration" onChange={setTransitiontime} testID="group-action-transitiontime" value={transitiontime} />}
    </EditorSection>}
    <EditorSection title="Group details">
      <ReadOnlyField label="Group type" value={value?.type} />
      <ReadOnlyField label="Recycle" value={value?.recycle} />
      <ReadOnlyField label="Associated sensors" value={value?.sensors} />
      <ReadOnlyField label="Aggregate state" value={aggregateLabel(value?.state)} />
    </EditorSection>
  </EditorForm>;
}

function availableLightOptions(
  storedResources: ReadonlyMap<string, { readonly state: { readonly status: string; readonly value?: unknown } }>,
  selectedIds: readonly string[],
): readonly EditorChoiceOption[] {
  const lights: Array<{ id: string; name: string }> = [];
  storedResources.forEach((stored, key) => {
    if (!key.startsWith("light:") || stored.state.status !== "known") return;
    const id = key.slice("light:".length);
    const rawName = (stored.state.value as { readonly name?: unknown } | undefined)?.name;
    lights.push({ id, name: typeof rawName === "string" && rawName.trim() ? rawName.trim() : `Light ${id}` });
  });
  const duplicateNames = new Set(lights.filter((light, index) => lights.some((other, otherIndex) => otherIndex !== index && other.name === light.name)).map((light) => light.name));
  const options: EditorChoiceOption[] = lights.map((light) => ({
    value: light.id,
    label: duplicateNames.has(light.name) ? `${light.name} (Light ${light.id})` : light.name,
  }));
  const knownIds = new Set(lights.map((light) => light.id));
  selectedIds.forEach((id) => {
    if (!knownIds.has(id)) options.push({ value: id, label: `Unavailable light (ID ${id})` });
  });
  return options.sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true }));
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
