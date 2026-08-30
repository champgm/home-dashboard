import React, { useState } from "react";
import { EditorCatalogNumberField, EditorChoice, EditorChoiceOption, EditorHueField, EditorMultiChoice, EditorSection, EditorSummaryRow, EditorToggle, EditorXyColorField, ReadOnlyField } from "./editorControls";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
import { definiteFailure } from "../../app/commandResults";
import { diagnostic } from "../../app/diagnostics";
import { catalogField } from "../../protocol/hue/catalog/resourceCatalog";
import { ExpandableAdvancedSection } from "../components/ExpandableAdvancedSection";

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
    note="Membership and class changes are staged until Save. Mixed aggregate state is shown as indeterminate."
    onSave={save}
    title="Group Editor"
  >
    <EditorSection title="Group membership">
      <EditorMultiChoice label="Lights" onChange={setLights} options={lightOptions} testID="group-lights" values={lights} />
      <EditorChoice
        defaultExpanded={false}
        label="Room class"
        onChange={setGroupClass}
        options={classOptions}
        presentation="list"
        quickOptions={[groupClass, "Living room", "Bedroom", "Guest room", "Other"]}
        testID="group-class"
        value={groupClass}
      />
    </EditorSection>
    {id && <>
      <EditorSection title="Group state">
        <ReadOnlyField label="Aggregate state" value={aggregateLabel(value?.state)} />
      </EditorSection>
      <EditorSection title="Group action summary">
        {actionHas("on") && <EditorSummaryRow label="Action power" value={on ? "On" : "Off"} testID="group-action-on" />}
        {actionHas("bri") && <EditorSummaryRow label="Action brightness" value={rangeLabel(bri)} testID="group-action-bri" />}
        {actionHas("hue") && <EditorSummaryRow label="Action hue" value={numberLabel(hue)} testID="group-action-hue" />}
        {actionHas("sat") && <EditorSummaryRow label="Action saturation" value={rangeLabel(sat)} testID="group-action-sat" />}
        {actionHas("xy") && <EditorSummaryRow label="Action XY" value={xy || "Not set"} testID="group-action-xy" />}
        {actionHas("ct") && <EditorSummaryRow label="Action color temperature" value={rangeLabel(ct)} testID="group-action-ct" />}
        {actionHas("alert") && <EditorSummaryRow label="Action alert" value={alert} testID="group-action-alert" />}
        {actionHas("effect") && <EditorSummaryRow label="Action effect" value={effect} testID="group-action-effect" />}
        {actionHas("transitiontime") && <EditorSummaryRow label="Action transition" value={rangeLabel(transitiontime)} testID="group-action-transitiontime" />}
      </EditorSection>
      <ExpandableAdvancedSection summary="Supported group action values and technical group metadata" testID="group-advanced">
        <EditorSection title="Supported group action">
          {actionHas("on") && <EditorToggle label="Action power" onValueChange={setOn} testID="group-action-on-editor" value={on} />}
          {actionHas("bri") && <EditorCatalogNumberField fieldKey="bri" label="Action brightness" onChange={setBri} showExact={false} testID="group-action-bri-editor" value={bri} />}
          {actionHas("hue") && <EditorHueField label="Action hue color" onChange={setHue} showExact={false} testID="group-action-hue-editor" value={hue} />}
          {actionHas("sat") && <EditorCatalogNumberField fieldKey="sat" label="Action saturation" onChange={setSat} showExact={false} testID="group-action-sat-editor" value={sat} />}
          {actionHas("xy") && <EditorXyColorField label="Action XY color" onChangeText={setXy} showExact={false} testID="group-action-xy-editor" value={xy} />}
          {actionHas("ct") && <EditorCatalogNumberField fieldKey="ct" label="Action color temperature" onChange={setCt} showExact={false} testID="group-action-ct-editor" value={ct} />}
          {actionHas("alert") && <EditorChoice label="Action alert" onChange={setAlert} options={["none", "select", "lselect"]} testID="group-action-alert-editor" value={alert} />}
          {actionHas("effect") && <EditorChoice label="Action effect" onChange={setEffect} options={["none", "colorloop"]} testID="group-action-effect-editor" value={effect} />}
          {actionHas("transitiontime") && <EditorCatalogNumberField fieldKey="transitiontime" label="Action transition duration" onChange={setTransitiontime} showExact={false} testID="group-action-transitiontime-editor" value={transitiontime} />}
        </EditorSection>
        <ReadOnlyField label="Group type" value={value?.type} />
        <ReadOnlyField label="Recycle" value={value?.recycle} />
        <ReadOnlyField label="Associated sensors" value={value?.sensors} />
      </ExpandableAdvancedSection>
    </>}
    {!id && <EditorSection title="Group state"><ReadOnlyField label="Aggregate state" value="Available after the group is created." /></EditorSection>}
    {!id && <ExpandableAdvancedSection summary="The Hue group type is fixed to Room for new groups" testID="group-advanced"><ReadOnlyField label="Group type" value="Room" /></ExpandableAdvancedSection>}
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
function rangeLabel(value: number | undefined): string { return value === undefined ? "Not set" : String(value); }
function numberLabel(value: number | undefined): string { return value === undefined ? "Not set" : String(value); }
function parsePair(value: string): [number, number] | undefined {
  const values = value.split(",").map((part) => Number(part.trim()));
  return values.length === 2 && values.every((part) => Number.isFinite(part) && part >= 0 && part <= 1) ? [values[0], values[1]] : undefined;
}
