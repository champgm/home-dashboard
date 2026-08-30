import { HueSnapshot, ResourceRef } from "../../../app/types";
import {
  DimmerControlDescriptor,
  DimmerBindingRecognitionInput,
  DimmerBindingModel,
  DimmerEditorModel,
  DimmerRuleShape,
  DimmerSensorRecord,
  DimmerStructuralEditor,
  StructuralDimmerEdit,
} from "./types";

export interface DimmerStructuralForm {
  readonly id: string;
  readonly label: string;
  /** Normal-row action represented by this characterized structural form. */
  readonly actionKind?: "cycle";
  /** Concrete reason this form is structural; it is part of characterization. */
  readonly operationShape: "multiple_resources" | "replace_rule";
  /** Optional structured input renderer used by Configure Dimmer. */
  readonly editor?: DimmerStructuralEditor;
  /** Must accept only an existing Rule shape characterized for this form. */
  readonly matchesRule: (input: DimmerBindingRecognitionInput) => boolean;
  /** Optional characterized defaults for the editor's structured values. */
  readonly initialValues?: (input: {
    readonly model: DimmerEditorModel;
    readonly binding: DimmerBindingModel;
  }) => Readonly<Record<string, unknown>>;
  /**
   * A catalog entry may expose a structural form only when it is backed by
   * characterization. The callback returns the concrete operations for this
   * one user action; it is not a general dependency planner.
   */
  readonly buildChangeSet?: (input: {
    readonly edit: StructuralDimmerEdit;
    readonly model: DimmerEditorModel;
    readonly binding: DimmerBindingModel;
    readonly rule: DimmerRuleShape;
    /** Current authoritative snapshot used to resolve exact target metadata. */
    readonly snapshot: HueSnapshot;
  }) => import("./types").DimmerChangeSet | undefined;
}

export interface DimmerModelCatalogEntry {
  /** Stable model key, independent of a Hue display name. */
  readonly id: string;
  readonly label: string;
  readonly manufacturerNames?: readonly string[];
  readonly modelIds?: readonly string[];
  readonly sensorTypes?: readonly string[];
  readonly uniqueIdPrefixes?: readonly string[];
  readonly requiredCapabilities?: readonly string[];
  readonly matches?: (sensor: DimmerSensorRecord) => boolean;
  /**
   * Return the stable physical-device key for a member Sensor. Returning
   * undefined means the catalog cannot establish a shared physical identity.
   */
  readonly identityKey?: (sensor: DimmerSensorRecord) => string | undefined;
  readonly controls: readonly DimmerControlDescriptor[];
  readonly structuralForms?: readonly DimmerStructuralForm[];
}

export interface DimmerModelCatalog {
  readonly models: readonly DimmerModelCatalogEntry[];
}

export const EMPTY_DIMMER_CATALOG: DimmerModelCatalog = Object.freeze({ models: [] });

const ABSOLUTE_STATE_FIELDS = ["on", "bri", "hue", "sat", "xy", "ct", "alert", "effect", "transitiontime"] as const;
const COMMON_SIMPLE_ACTIONS = [
  { kind: "on" as const, targetKinds: ["light", "group"] as const, fields: ["on"] as const },
  { kind: "off" as const, targetKinds: ["light", "group"] as const, fields: ["on"] as const },
  { kind: "set" as const, targetKinds: ["light", "group"] as const, fields: ABSOLUTE_STATE_FIELDS },
  { kind: "activate" as const, targetKinds: ["scene"] as const, fields: ["scene"] as const },
];
const RWL020_ABSOLUTE_FORM = {
  actionIndex: 0,
  actions: COMMON_SIMPLE_ACTIONS,
  matchesRule: matchesRwl020AbsoluteRule,
};
const RWL020_BRIGHTEN_FORM = {
  actionIndex: 0,
  actions: [{ kind: "brighten" as const, targetKinds: ["light", "group"] as const, fields: ["bri_inc", "transitiontime"] as const }],
  matchesRule: matchesOneActionButtonRule,
};
const RWL020_DIM_FORM = {
  actionIndex: 0,
  actions: [{ kind: "dim" as const, targetKinds: ["light", "group"] as const, fields: ["bri_inc", "transitiontime"] as const }],
  matchesRule: matchesOneActionButtonRule,
};
const RWL020_STOP_FORM = {
  actionIndex: 0,
  actions: [{ kind: "stop" as const, targetKinds: ["light", "group"] as const, fields: ["bri_inc"] as const }],
  matchesRule: matchesOneActionButtonRule,
};
const ZGP_SIMPLE_FORM = {
  actionIndex: 0,
  actions: COMMON_SIMPLE_ACTIONS,
  matchesRule: matchesOneActionButtonRule,
};

/** Production support derived from the sanitized 2026-08-29 household captures and live gesture observations. */
export const PRODUCTION_DIMMER_CATALOG: DimmerModelCatalog = Object.freeze({
  models: Object.freeze([
    {
      id: "signify-rwl020",
      label: "Hue dimmer switch",
      manufacturerNames: ["Signify Netherlands B.V."],
      modelIds: ["RWL020"],
      sensorTypes: ["ZLLSwitch"],
      matches: (sensor: DimmerSensorRecord) => hasExactAdvertisedEvents(sensor, rwl020Events()),
      identityKey: (sensor: DimmerSensorRecord) => sensor.uniqueid,
      controls: [
        {
          id: "on",
          label: "On button",
          gestures: [
            { id: "initial-press", event: 1000, label: "Initial press", simpleForm: RWL020_ABSOLUTE_FORM },
            { id: "hold-repeat", event: 1001, label: "Held" },
            { id: "short-release", event: 1002, label: "Short release" },
            { id: "long-release", event: 1003, label: "Released after hold" },
          ],
        },
        {
          id: "brighter",
          label: "Brighter button",
          gestures: [
            { id: "initial-press", event: 2000, label: "Initial press", simpleForm: RWL020_BRIGHTEN_FORM },
            { id: "hold-repeat", event: 2001, label: "Held", simpleForm: RWL020_BRIGHTEN_FORM },
            { id: "short-release", event: 2002, label: "Short release" },
            { id: "long-release", event: 2003, label: "Released after hold", simpleForm: RWL020_STOP_FORM },
          ],
        },
        {
          id: "dimmer",
          label: "Dimmer button",
          gestures: [
            { id: "initial-press", event: 3000, label: "Initial press", simpleForm: RWL020_DIM_FORM },
            { id: "hold-repeat", event: 3001, label: "Held", simpleForm: RWL020_DIM_FORM },
            { id: "short-release", event: 3002, label: "Short release" },
            { id: "long-release", event: 3003, label: "Released after hold", simpleForm: RWL020_STOP_FORM },
          ],
        },
        {
          id: "off",
          label: "Off button",
          gestures: [
            { id: "initial-press", event: 4000, label: "Initial press", simpleForm: RWL020_ABSOLUTE_FORM },
            { id: "hold-repeat", event: 4001, label: "Held" },
            { id: "short-release", event: 4002, label: "Short release" },
            { id: "long-release", event: 4003, label: "Released after hold" },
          ],
        },
      ],
    },
    {
      id: "signify-zgpswitch",
      label: "Hue tap switch",
      manufacturerNames: ["Signify Netherlands B.V."],
      modelIds: ["ZGPSWITCH"],
      sensorTypes: ["ZGPSwitch"],
      matches: (sensor: DimmerSensorRecord) => hasExactAdvertisedEvents(sensor, [34, 16, 17, 18]),
      identityKey: (sensor: DimmerSensorRecord) => sensor.uniqueid,
      controls: [
        { id: "main", label: "Large main button", gestures: [{ id: "press", event: 34, label: "Pressed", simpleForm: ZGP_SIMPLE_FORM }] },
        { id: "button-2", label: "Button 2", gestures: [{ id: "press", event: 16, label: "Pressed", simpleForm: ZGP_SIMPLE_FORM }] },
        { id: "button-3", label: "Button 3", gestures: [{ id: "press", event: 17, label: "Pressed", simpleForm: ZGP_SIMPLE_FORM }] },
        { id: "button-4", label: "Button 4", gestures: [{ id: "press", event: 18, label: "Pressed", simpleForm: ZGP_SIMPLE_FORM }] },
      ],
    },
  ]),
});

/** Alias used by callers that prefer “catalog” over “model catalog”. */
export type DimmerCatalog = DimmerModelCatalog;

export interface DimmerIdentityResolution {
  readonly status: "recognized" | "unsupported" | "ambiguous" | "missing";
  readonly sensor?: DimmerSensorRecord;
  readonly entry?: DimmerModelCatalogEntry;
  readonly deviceKey: string;
  readonly reason?: string;
}

export function getDimmerModelCatalog(): DimmerModelCatalog {
  return PRODUCTION_DIMMER_CATALOG;
}

function matchesOneActionButtonRule(input: DimmerBindingRecognitionInput): boolean {
  return input.conditionIndex === 0
    && input.rule.conditions.length === 2
    && input.rule.actions.length === 1
    && matchesButtonEventAndLastUpdated(input);
}

function matchesRwl020AbsoluteRule(input: DimmerBindingRecognitionInput): boolean {
  if (input.conditionIndex !== 0 || !matchesButtonEventAndLastUpdated(input)) return false;
  // A deployed household RWL020 also uses the older exact two-condition,
  // one-action form for On/Off. It is still a simple target-preserving Rule.
  if (input.rule.actions.length === 1) {
    return input.rule.conditions.length === 2 && (input.event === 1000 || input.event === 4000);
  }
  if (input.rule.actions.length !== 2) return false;
  const helperAction = input.rule.actions[1];
  if (!isHelperStatusAction(helperAction)) return false;
  const helperId = sensorStateRootId(helperAction.address);
  if (!helperId) return false;
  if (input.event === 4000) {
    return input.rule.conditions.length === 2 && helperAction.body?.status === 0;
  }
  if (input.event !== 1000 || input.rule.conditions.length !== 3) return false;
  const helperCondition = input.rule.conditions[2];
  if (sensorStateField(helperCondition.address, "status") !== helperId) return false;
  const transition = `${helperCondition.operator}:${helperCondition.value ?? ""}->${String(helperAction.body?.status)}`;
  return ["lt:1->1", "eq:1->2", "eq:2->3", "eq:3->4", "gt:3->0"].includes(transition);
}

function matchesButtonEventAndLastUpdated(input: DimmerBindingRecognitionInput): boolean {
  if (input.rule.conditions.length < 2 || input.conditionReferences.length < 2) return false;
  const eventReference = input.conditionReferences[0];
  const updatedReference = input.conditionReferences[1];
  return input.rule.conditions[0].operator === "eq"
    && input.rule.conditions[0].value === String(input.event)
    && input.rule.conditions[1].operator === "dx"
    && eventReference.status === "recognized"
    && eventReference.kind === "sensor"
    && eventReference.field === "buttonevent"
    && updatedReference.status === "recognized"
    && updatedReference.kind === "sensor"
    && updatedReference.field === "lastupdated"
    && eventReference.id === updatedReference.id;
}

function isHelperStatusAction(action: import("../catalog/rules").HueRuleAction): boolean {
  const body = action.body && typeof action.body === "object" && !Array.isArray(action.body) ? action.body : {};
  return action.method === "PUT"
    && Boolean(sensorStateRootId(action.address))
    && Object.keys(body).length === 1
    && Number.isInteger(body.status);
}

function sensorStateRootId(address: string): string | undefined {
  const match = address.replace(/^\/api\/[^/]+/i, "").match(/^\/sensors\/([^/]+)\/state$/i);
  return match?.[1];
}

function sensorStateField(address: string, field: string): string | undefined {
  const match = address.replace(/^\/api\/[^/]+/i, "").match(new RegExp(`^/sensors/([^/]+)/state/${field}$`, "i"));
  return match?.[1];
}

function rwl020Events(): readonly number[] {
  return [1000, 1001, 1002, 1003, 2000, 2001, 2002, 2003, 3000, 3001, 3002, 3003, 4000, 4001, 4002, 4003];
}

function hasExactAdvertisedEvents(sensor: DimmerSensorRecord, expected: readonly number[]): boolean {
  const inputs = sensor.capabilities?.inputs;
  if (!Array.isArray(inputs)) return false;
  const actual = inputs.flatMap((input) => {
    const value = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
    return Array.isArray(value.events) ? value.events.map((event) => {
      const row = event && typeof event === "object" && !Array.isArray(event) ? event as Record<string, unknown> : {};
      return Number.isInteger(row.buttonevent) ? row.buttonevent as number : Number.NaN;
    }) : [];
  });
  return actual.length === expected.length && actual.every((event, index) => event === expected[index]);
}

export function sensorFromSnapshot(snapshot: HueSnapshot, id: string): DimmerSensorRecord | undefined {
  const raw = snapshot.sensors[id];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return { ...(raw as DimmerSensorRecord), id };
}

export function catalogEntryMatchesSensor(entry: DimmerModelCatalogEntry, sensor: DimmerSensorRecord): boolean {
  if (entry.matches && !entry.matches(sensor)) return false;
  if (entry.manufacturerNames && entry.manufacturerNames.length > 0
    && !entry.manufacturerNames.some((value) => equalMetadata(value, sensor.manufacturername))) return false;
  if (entry.modelIds && entry.modelIds.length > 0
    && !entry.modelIds.some((value) => equalMetadata(value, sensor.modelid))) return false;
  if (entry.sensorTypes && entry.sensorTypes.length > 0
    && !entry.sensorTypes.some((value) => equalMetadata(value, sensor.type))) return false;
  if (entry.uniqueIdPrefixes && entry.uniqueIdPrefixes.length > 0) {
    const uniqueid = sensor.uniqueid || "";
    if (!entry.uniqueIdPrefixes.some((prefix) => uniqueid.startsWith(prefix))) return false;
  }
  if (entry.requiredCapabilities && entry.requiredCapabilities.length > 0) {
    if (entry.requiredCapabilities.some((capability) => !hasCapability(sensor.capabilities, capability))) return false;
  }
  return true;
}

function hasCapability(value: unknown, path: string): boolean {
  const parts = path.split(".").filter(Boolean);
  let current: unknown = value;
  for (const part of parts) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return false;
    current = (current as Record<string, unknown>)[part];
  }
  return current !== undefined && current !== false && current !== null;
}

export function matchingCatalogEntries(sensor: DimmerSensorRecord, catalog: DimmerModelCatalog): readonly DimmerModelCatalogEntry[] {
  return catalog.models.filter((entry) => catalogEntryMatchesSensor(entry, sensor));
}

export function physicalDeviceKey(entry: DimmerModelCatalogEntry, sensor: DimmerSensorRecord): string | undefined {
  const supplied = entry.identityKey?.(sensor)?.trim();
  if (supplied) return `${entry.id}:${supplied}`;
  const uniqueid = sensor.uniqueid?.trim();
  if (uniqueid) return `${entry.id}:uniqueid:${uniqueid}`;
  // A model/type tuple is safe as a fallback for a single Sensor, but callers
  // must not use it to merge multiple Sensors without catalog evidence.
  if (sensor.id) return `${entry.id}:sensor:${sensor.id}`;
  return undefined;
}

export function resolveDimmerIdentity(
  sensorRef: ResourceRef,
  snapshot: HueSnapshot,
  catalog: DimmerModelCatalog,
): DimmerIdentityResolution {
  if (sensorRef.kind !== "sensor" || !sensorRef.id) {
    return { status: "missing", deviceKey: "missing", reason: "A Sensor reference is required." };
  }
  const sensor = sensorFromSnapshot(snapshot, sensorRef.id);
  if (!sensor) {
    return { status: "missing", deviceKey: `sensor:${sensorRef.id}`, reason: "The Sensor is not present in the current Hue snapshot." };
  }
  const entries = matchingCatalogEntries(sensor, catalog);
  if (entries.length === 0) {
    return {
      status: "unsupported",
      sensor,
      deviceKey: `unsupported:sensor:${sensor.id}`,
      reason: "This Sensor model is not in the characterized dimmer catalog.",
    };
  }
  if (entries.length > 1) {
    return {
      status: "ambiguous",
      sensor,
      deviceKey: `ambiguous:sensor:${sensor.id}`,
      reason: "More than one catalog model matches this Sensor.",
    };
  }
  const entry = entries[0];
  const deviceKey = physicalDeviceKey(entry, sensor);
  if (!deviceKey) {
    return { status: "ambiguous", sensor, entry, deviceKey: `ambiguous:sensor:${sensor.id}`, reason: "The catalog cannot establish a stable physical identity." };
  }
  return { status: "recognized", sensor, entry, deviceKey };
}

export function sensorsForPhysicalDevice(
  snapshot: HueSnapshot,
  entry: DimmerModelCatalogEntry,
  deviceKey: string,
): readonly DimmerSensorRecord[] {
  return Object.keys(snapshot.sensors)
    .map((id) => sensorFromSnapshot(snapshot, id))
    .filter((sensor): sensor is DimmerSensorRecord => Boolean(sensor && catalogEntryMatchesSensor(entry, sensor)))
    .filter((sensor) => physicalDeviceKey(entry, sensor) === deviceKey);
}

export interface DimmerEventMatch {
  readonly control: DimmerControlDescriptor;
  readonly gesture: DimmerControlDescriptor["gestures"][number];
}

/** Return every catalog row claiming an event; duplicate claims are ambiguous. */
export function findDimmerEvents(entry: DimmerModelCatalogEntry, event: number): readonly DimmerEventMatch[] {
  return entry.controls.flatMap((control) => control.gestures
    .filter((gesture) => gesture.event === event)
    .map((gesture) => ({ control, gesture })));
}

/** Resolve only an unambiguous event mapping. */
export function findDimmerEvent(entry: DimmerModelCatalogEntry, event: number): DimmerEventMatch | undefined {
  const matches = findDimmerEvents(entry, event);
  return matches.length === 1 ? matches[0] : undefined;
}

function equalMetadata(left: string, right: string | undefined): boolean {
  return Boolean(right && left.trim().toLowerCase() === right.trim().toLowerCase());
}
