import { HueSnapshot, ResourceRef } from "../../../app/types";
import { buildRuleActionFromTarget } from "../catalog/resourceCatalog";
import { HueRuleAction } from "../catalog/rules";
import { parseRuleActionReference } from "./references";
import {
  DimmerActionKind,
  DimmerActionMapping,
  DimmerSimpleBindingForm,
} from "./types";

export interface DimmerActionSelection {
  readonly kind: DimmerActionKind;
  readonly target: ResourceRef;
  /** Snapshot metadata needed to route GroupScene activation correctly. */
  readonly targetDetails?: DimmerSceneTargetDetails;
  readonly fields?: Record<string, unknown>;
  readonly form?: DimmerSimpleBindingForm;
}

export interface DimmerSceneTargetDetails {
  readonly type?: string;
  readonly group?: string;
}

export interface DimmerTargetOption {
  readonly ref: ResourceRef;
  readonly label: string;
  readonly scene?: DimmerSceneTargetDetails;
}

/** Build the only Rule action shapes exposed by Configure Dimmer controls. */
export function buildDimmerRuleAction(selection: DimmerActionSelection): HueRuleAction {
  if (selection.kind === "cycle") throw new Error("Scene cycling is a characterized structural edit, not a single Rule action.");
  if (selection.target.kind === "scene") {
    if (selection.kind !== "activate") throw new Error("Scenes support activation only.");
    const action = buildRuleActionFromTarget("scene", requireId(selection.target), "activate", undefined, selection.targetDetails);
    if (selection.form && !isDimmerActionPermittedByForm(action, selection.form)) throw new Error("The selected Scene activation is not characterized for this gesture.");
    return action;
  }
  if (selection.target.kind !== "light" && selection.target.kind !== "group") {
    throw new Error("A dimmer action target must be a Light, Group, or Scene.");
  }
  if (selection.kind === "activate") throw new Error("Only Scenes support activation.");
  const action = buildRuleActionFromTarget(
    selection.target.kind,
    requireId(selection.target),
    selection.kind,
    selection.fields,
  );
  if (selection.form && !isDimmerActionPermittedByForm(action, selection.form)) throw new Error("The selected action is not characterized for this gesture.");
  return action;
}

/** Infer the structured action form from a validated existing Hue Rule action. */
export function dimmerActionKindFromRuleAction(action: HueRuleAction): DimmerActionKind | undefined {
  const body = action.body && typeof action.body === "object" && !Array.isArray(action.body) ? action.body : {};
  const reference = parseRuleActionReference(action);
  if (reference.status !== "recognized" || action.method.toUpperCase() !== "PUT") return undefined;
  if (reference.kind === "scene") {
    return typeof body.scene === "string" && body.scene === reference.id ? "activate" : undefined;
  }
  if (reference.kind !== "light" && reference.kind !== "group") return undefined;
  if (typeof body.on === "boolean" && Object.keys(body).filter((key) => key !== "transitiontime").length === 1) return body.on ? "on" : "off";
  const relativeKeys = Object.keys(body).filter((key) => key !== "transitiontime");
  if (typeof body.bri_inc === "number" && Number.isFinite(body.bri_inc) && body.bri_inc !== 0 && relativeKeys.length === 1) {
    return body.bri_inc > 0 ? "brighten" : "dim";
  }
  const supportedFields = new Set(["on", "bri", "hue", "sat", "xy", "ct", "alert", "effect", "transitiontime"]);
  if (Object.keys(body).length > 0 && Object.keys(body).every((key) => supportedFields.has(key))) return "set";
  return undefined;
}

/**
 * Check a Rule action against the exact action/target/field contract supplied
 * by the selected model gesture. This is used both during projection and at
 * the mutation boundary so a stale or hand-authored edit cannot escape the
 * characterization contract.
 */
export function isDimmerActionPermittedByForm(action: HueRuleAction, form: DimmerSimpleBindingForm): boolean {
  const reference = parseRuleActionReference(action);
  const kind = dimmerActionKindFromRuleAction(action);
  if (reference.status !== "recognized" || !kind) return false;
  const candidate = form.actions.find((entry) => entry.kind === kind && entry.targetKinds.includes(reference.kind as "light" | "group" | "scene"));
  if (!candidate) return false;
  const body = action.body && typeof action.body === "object" && !Array.isArray(action.body) ? action.body : {};
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some((key) => !candidate.fields.includes(key as never))) return false;
  if (kind === "activate") return reference.kind === "scene" && body.scene === reference.id;
  if (kind === "on" || kind === "off") return body.on === (kind === "on");
  if (kind === "brighten" || kind === "dim") return typeof body.bri_inc === "number"
    && Number.isFinite(body.bri_inc)
    && body.bri_inc !== 0
    && (kind === "brighten" ? body.bri_inc > 0 : body.bri_inc < 0);
  return keys.some((key) => key !== "transitiontime");
}

export function actionSelectionFromMapping(mapping: DimmerActionMapping): DimmerActionSelection | undefined {
  if (!mapping.target) return undefined;
  return { kind: mapping.kind, target: mapping.target, fields: { ...mapping.fields } };
}

/** Check a newly selected action target against the same authoritative snapshot used for projection. */
export function dimmerActionTargetExists(snapshot: HueSnapshot, action: HueRuleAction): boolean {
  const reference = parseRuleActionReference(action);
  if (reference.status !== "recognized" || !reference.id) return false;
  if (reference.kind !== "light" && reference.kind !== "group" && reference.kind !== "scene") return false;
  const collection = reference.kind === "scene" ? snapshot.scenes : reference.kind === "light" ? snapshot.lights : snapshot.groups;
  if (!Object.prototype.hasOwnProperty.call(collection, reference.id)) return false;
  if (reference.kind !== "scene") return true;
  const scene = snapshot.scenes[reference.id];
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) return false;
  const value = scene as Record<string, unknown>;
  const expectedGroup = value.type === "LightScene"
    ? "0"
    : value.type === "GroupScene" && typeof value.group === "string"
      ? value.group
      : undefined;
  return expectedGroup !== undefined
    && /^\d+$/.test(expectedGroup)
    && normalizeHuePath(action.address) === `/groups/${expectedGroup}/action`;
}

export function dimmerTargetOptions(snapshot: HueSnapshot): readonly DimmerTargetOption[] {
  const result: DimmerTargetOption[] = [];
  appendOptions(result, "light", snapshot.lights, "Light");
  appendOptions(result, "group", snapshot.groups, "Group");
  appendOptions(result, "scene", snapshot.scenes, "Scene");
  return result;
}

function appendOptions(
  result: DimmerTargetOption[],
  kind: "light" | "group" | "scene",
  collection: Record<string, unknown>,
  label: string,
): void {
  Object.entries(collection || {}).forEach(([id, raw]) => {
    const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    result.push({
      ref: { kind, id },
      label: typeof value.name === "string" ? value.name : `${label} target`,
      ...(kind === "scene" ? { scene: {
        ...(typeof value.type === "string" ? { type: value.type } : {}),
        ...(typeof value.group === "string" ? { group: value.group } : {}),
      } } : {}),
    });
  });
}

function requireId(ref: ResourceRef): string {
  if (!ref.id) throw new Error("A Hue target ID is required.");
  return ref.id;
}

function normalizeHuePath(value: string): string {
  return value.replace(/^\/api\/[^/]+/i, "");
}
