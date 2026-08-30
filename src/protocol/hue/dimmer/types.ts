import { Diagnostic, ResourceRef } from "../../../app/types";
import { HueRuleAction, HueRuleCondition } from "../catalog/rules";
import { StructuredScheduleCommand } from "../catalog/schedules";

/** The Hue resource kinds which can be referenced by a dimmer workflow. */
export type DimmerHueResourceKind = Exclude<ResourceRef["kind"], "plug">;

export type DimmerBindingClassification =
  | "editable_simple"
  | "recognized_structural"
  | "custom"
  | "malformed"
  | "missing_target"
  | "ambiguous"
  | "unsupported";

export type DimmerActionKind = "on" | "off" | "set" | "brighten" | "dim" | "stop" | "activate" | "cycle";

export type DimmerSimpleActionKind = Exclude<DimmerActionKind, "cycle">;
export type DimmerActionTargetKind = "light" | "group" | "scene";
export type DimmerActionField = "on" | "bri" | "hue" | "sat" | "xy" | "ct" | "alert" | "effect" | "transitiontime" | "bri_inc" | "scene";

export interface DimmerSimpleActionForm {
  /** Action kind characterized for this exact physical gesture. */
  readonly kind: DimmerSimpleActionKind;
  /** Hue target kinds that this action form is allowed to address. */
  readonly targetKinds: readonly DimmerActionTargetKind[];
  /** Complete set of body fields that may be round-tripped for this form. */
  readonly fields: readonly DimmerActionField[];
}

export interface DimmerRuleShape {
  /** Existing Rule name, preserved by replacement-capable structural forms. */
  readonly name?: string;
  /** Existing Rule status, preserved so a replacement cannot enable/disable it accidentally. */
  readonly status?: "enabled" | "disabled";
  /** Existing recycle behavior, when supplied by the bridge. */
  readonly recycle?: boolean;
  /** Credential-safe copy of the existing Rule conditions. */
  readonly conditions: readonly HueRuleCondition[];
  /** Credential-safe copy of the existing Rule actions. */
  readonly actions: readonly HueRuleAction[];
}

export interface DimmerBindingRecognitionInput {
  readonly event: number;
  readonly conditionIndex: number;
  readonly rule: DimmerRuleShape;
  readonly conditionReferences: readonly DimmerReference[];
  readonly actionReferences: readonly DimmerReference[];
}

export interface DimmerSimpleBindingForm {
  /** The one existing Rule action changed by the simple edit. */
  readonly actionIndex: number;
  /** All action/target/field combinations characterized for this gesture. */
  readonly actions: readonly DimmerSimpleActionForm[];
  /** Must accept only Rule shapes that this form can preserve and round-trip. */
  readonly matchesRule: (input: DimmerBindingRecognitionInput) => boolean;
}

export interface DimmerStructuralEditor {
  /** The generic structural input currently supported by Configure Dimmer. */
  readonly kind: "scene_cycle";
  /** Number of scene slots presented by the characterized form. */
  readonly sceneCount?: number;
}

export interface DimmerSensorRecord {
  readonly id: string;
  readonly name?: string;
  readonly type?: string;
  readonly manufacturername?: string;
  readonly modelid?: string;
  readonly uniqueid?: string;
  readonly productname?: string;
  readonly config?: Record<string, unknown>;
  readonly state?: Record<string, unknown>;
  readonly capabilities?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

export interface DimmerGestureDescriptor {
  /** Numeric value reported by the Hue Sensor state. */
  readonly event: number;
  /** Human-readable gesture, for example “Pressed” or “Held”. */
  readonly label: string;
  /** Optional stable catalog identifier for the gesture. */
  readonly id?: string;
  /** Structural forms are opt-in and must be characterized for the model. */
  readonly bindingKind?: "simple" | "structural";
  readonly structuralFormId?: string;
  /** Simple edits are opt-in and constrained by this characterized form. */
  readonly simpleForm?: DimmerSimpleBindingForm;
}

export interface DimmerControlDescriptor {
  /** Stable catalog identifier; it is never derived from the display name. */
  readonly id: string;
  readonly label: string;
  readonly gestures: readonly DimmerGestureDescriptor[];
}

/**
 * An exact parsed reference. `path` is always credential-redacted. The raw
 * bridge path is deliberately not part of this type so it cannot leak into a
 * view model or diagnostic by accident.
 */
export interface RecognizedDimmerReference {
  readonly status: "recognized";
  readonly ref: ResourceRef;
  readonly kind: DimmerHueResourceKind;
  readonly id: string;
  readonly path: string;
  readonly endpoint?: string;
  readonly field?: string;
}

export interface UnrecognizedDimmerReference {
  readonly status: "malformed" | "unsupported";
  /** Credential-redacted input retained only for inspection. */
  readonly path: string;
  readonly reason: string;
  /** Best-effort exact resource identity when the suffix itself is malformed. */
  readonly ref?: ResourceRef;
}

export type DimmerReference = RecognizedDimmerReference | UnrecognizedDimmerReference;

export interface DimmerCreatorProvenance {
  /** True when the bridge supplied an owner/creator marker. */
  readonly present: boolean;
  /** A safe description; the Hue API username is never retained. */
  readonly label: string;
}

export interface DimmerAdvancedBindingDetails {
  readonly sensorIds: readonly string[];
  readonly helperSensorIds: readonly string[];
  readonly rawEvents: readonly number[];
  readonly references: readonly DimmerReference[];
  readonly resourceRefs: readonly ResourceRef[];
  readonly ruleId?: string;
  /** Safe existing Rule shape supplied to a characterized structural builder. */
  readonly ruleShape?: DimmerRuleShape;
  readonly conditionIndex?: number;
  readonly actionIndex?: number;
  readonly actionTarget?: ResourceRef;
  readonly scheduleId?: string;
  readonly resourceLinkIds: readonly string[];
  readonly creator?: DimmerCreatorProvenance;
  readonly sourceKind: "rule" | "schedule" | "resourcelink" | "sensor";
  readonly reason?: string;
}

export interface DimmerActionMapping {
  readonly kind: DimmerActionKind;
  readonly label: string;
  /** Internal-only target reference; normal projections omit it in favor of Advanced. */
  readonly target?: ResourceRef;
  readonly targetLabel?: string;
  readonly fields: Readonly<Record<string, unknown>>;
}

export interface DimmerBindingView {
  readonly id: string;
  readonly controlId: string;
  readonly controlLabel: string;
  readonly gestureId?: string;
  readonly gestureLabel: string;
  readonly classification: DimmerBindingClassification;
  readonly editable: boolean;
  readonly action?: DimmerActionMapping;
  readonly reason?: string;
  readonly structuralFormId?: string;
}

export interface DimmerBindingModel extends DimmerBindingView {
  /** Internal numeric event retained for mutation-boundary revalidation. */
  readonly event?: number;
  readonly advanced: DimmerAdvancedBindingDetails;
  /** Internal catalog contract used when constructing a simple edit. */
  readonly simpleForm?: DimmerSimpleBindingForm;
}

export interface DimmerControlModel {
  readonly id: string;
  readonly label: string;
  readonly gestures: readonly DimmerBindingView[];
}

export interface DimmerAdvancedModel {
  readonly sensorIds: readonly string[];
  readonly helperSensorIds: readonly string[];
  readonly rawEvents: readonly number[];
  readonly references: readonly DimmerReference[];
  readonly resourceRefs: readonly ResourceRef[];
  readonly ruleIds: readonly string[];
  readonly scheduleIds: readonly string[];
  readonly resourceLinkIds: readonly string[];
  readonly creatorProvenance: readonly DimmerCreatorProvenance[];
  readonly bindings: readonly DimmerBindingModel[];
  readonly customBindings: readonly DimmerBindingModel[];
  readonly unsupportedBindings: readonly DimmerBindingModel[];
}

export interface DimmerEditorModel {
  readonly deviceKey: string;
  readonly displayName: string;
  readonly catalogId?: string;
  readonly modelLabel?: string;
  readonly recognized: boolean;
  readonly identityStatus: "recognized" | "unsupported" | "ambiguous" | "missing";
  readonly controls: readonly DimmerControlModel[];
  /** Flat row list for consumers that do not need the control hierarchy. */
  readonly rows: readonly DimmerBindingView[];
  readonly advanced: DimmerAdvancedModel;
  readonly reason?: string;
  /** Snapshot is carried only for an in-memory UI projection and is never persisted. */
}

export type DimmerMutationOperation = "create" | "update" | "enable" | "disable" | "delete";

export interface DimmerChangeOperation {
  readonly kind: DimmerHueResourceKind;
  readonly id?: string;
  readonly operation: DimmerMutationOperation;
  readonly payload?: Record<string, unknown>;
  readonly label: string;
  readonly destructive?: boolean;
}

/**
 * Deliberately ephemeral. This is a concrete list for one structural edit,
 * not a graph fingerprint, journal, dependency database, or rollback plan.
 */
export interface DimmerChangeSet {
  readonly deviceKey?: string;
  readonly summary: string;
  readonly operations: readonly DimmerChangeOperation[];
}

export interface SimpleDimmerBindingEdit {
  /** Primary Sensor used to re-project the binding at the mutation boundary. */
  readonly sensorId: string;
  /** Stable catalog identity independently checked by ApplicationService. */
  readonly catalogId: string;
  readonly controlId: string;
  readonly gestureId?: string;
  readonly event: number;
  readonly ruleId: string;
  readonly conditionIndex: number;
  readonly actionIndex: number;
  readonly action: HueRuleAction;
  readonly characterization: DimmerSimpleBindingForm;
  readonly deviceKey: string;
}

export interface StructuralDimmerEdit {
  /** Primary Sensor used to re-project this structural binding at save time. */
  readonly sensorId?: string;
  /** Stable catalog model identity independently checked by ApplicationService. */
  readonly catalogId?: string;
  readonly deviceKey?: string;
  readonly formId?: string;
  /** Stable catalog control identity, not the presentation row sequence. */
  readonly controlId?: string;
  readonly gestureId?: string;
  readonly event?: number;
  /** Existing Rule identity used to bind the form to the current snapshot. */
  readonly ruleId?: string;
  readonly conditionIndex?: number;
  readonly actionIndex?: number;
  readonly bindingId?: string;
  /** A preview copy may carry the generated set for display; commit re-derives it. */
  readonly changeSet?: DimmerChangeSet;
  readonly operations?: readonly DimmerChangeOperation[];
  /** For a scene-cycle editor, contains `sceneIds` with exact Hue Scene IDs. */
  readonly values?: Readonly<Record<string, unknown>>;
}

export interface StructuralOperationResult {
  readonly operation: DimmerChangeOperation;
  readonly status: "succeeded" | "failed_or_ambiguous" | "unattempted";
  readonly kind?: string;
  readonly reason?: string;
  readonly diagnostic?: Diagnostic;
}

export interface StructuralCommitReport {
  readonly status: "completed" | "stopped";
  readonly kind: "success" | "definite_failure" | "ambiguous" | "partial_failure" | "abandoned";
  readonly operations: readonly StructuralOperationResult[];
  readonly succeeded: readonly StructuralOperationResult[];
  readonly failedOrAmbiguous: readonly StructuralOperationResult[];
  readonly unattempted: readonly StructuralOperationResult[];
  readonly diagnostic?: { readonly category: string; readonly message: string; readonly detail?: string };
}

export function resourceRefKey(ref: ResourceRef): string {
  return `${ref.kind}:${ref.kind === "plug" ? ref.plugEndpointId || ref.id || "" : ref.id || ""}`;
}
