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
  // The production catalog remains empty until a real household capture is
  // available. Synthetic tests and target-specific builds inject an entry.
  return EMPTY_DIMMER_CATALOG;
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
