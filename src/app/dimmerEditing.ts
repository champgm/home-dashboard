import { validateRulePayload, validateSchedulePayload } from "../protocol/hue/HueActionPolicy";
import { validateHueCatalogPayload } from "../protocol/hue/catalog/resourceCatalog";
import { parseRuleReferences, safeRuleShape } from "../protocol/hue/dimmer/references";
import { isDimmerActionPermittedByForm } from "../protocol/hue/dimmer/actions";
import {
  DimmerBindingRecognitionInput,
  DimmerChangeOperation,
  DimmerChangeSet,
  SimpleDimmerBindingEdit,
  StructuralDimmerEdit,
} from "../protocol/hue/dimmer/types";

export type DimmerEditValidation =
  | { readonly allowed: true; readonly payload: Record<string, unknown> }
  | { readonly allowed: false; readonly reason: string };

export type StructuralDimmerPreview =
  | { readonly allowed: true; readonly changeSet: DimmerChangeSet }
  | { readonly allowed: false; readonly reason: string };

/**
 * Build the one changed collection field for a recognized simple Rule row.
 * Conditions, status, name, and every unrelated action are preserved by
 * copying the current action list and replacing exactly one index.
 */
export function buildSimpleDimmerBindingPayload(
  original: Record<string, unknown>,
  edit: SimpleDimmerBindingEdit,
): DimmerEditValidation {
  if (!edit || typeof edit.ruleId !== "string" || !edit.ruleId.trim()) return { allowed: false, reason: "A Rule ID is required." };
  if (!edit.characterization || !Number.isInteger(edit.characterization.actionIndex)
    || edit.characterization.actionIndex !== edit.actionIndex
    || edit.characterization.actions.length === 0
    || typeof edit.characterization.matchesRule !== "function") {
    return { allowed: false, reason: "This binding has no complete catalog characterization for simple editing." };
  }
  if (!Number.isInteger(edit.event)) return { allowed: false, reason: "The dimmer button event is invalid." };
  if (!Number.isInteger(edit.conditionIndex) || edit.conditionIndex < 0) return { allowed: false, reason: "The Rule condition index is invalid." };
  if (!Number.isInteger(edit.actionIndex) || edit.actionIndex < 0) return { allowed: false, reason: "The Rule action index is invalid." };
  const conditions = Array.isArray(original.conditions) ? original.conditions : [];
  const actions = Array.isArray(original.actions) ? original.actions : [];
  if (edit.conditionIndex >= conditions.length) return { allowed: false, reason: "The Rule condition is no longer available." };
  if (edit.actionIndex >= actions.length) return { allowed: false, reason: "The Rule action is no longer available." };
  const references = parseRuleReferences(original);
  const condition = references.conditions[edit.conditionIndex];
  const originalCondition = conditions[edit.conditionIndex] && typeof conditions[edit.conditionIndex] === "object" && !Array.isArray(conditions[edit.conditionIndex])
    ? conditions[edit.conditionIndex] as Record<string, unknown>
    : undefined;
  if (condition?.status !== "recognized" || condition.kind !== "sensor" || condition.field !== "buttonevent"
    || originalCondition?.operator !== "eq" || !isNumericButtonEvent(originalCondition?.value)) {
    return { allowed: false, reason: "The Rule condition is not a recognized dimmer button event." };
  }
  const event = Number(originalCondition.value);
  if (event !== edit.event) return { allowed: false, reason: "The dimmer gesture changed; refresh the bridge before saving." };
  const rule = safeRuleShape(original);
  const recognitionInput: DimmerBindingRecognitionInput = {
    event,
    conditionIndex: edit.conditionIndex,
    rule,
    conditionReferences: references.conditions,
    actionReferences: references.actions,
  };
  try {
    if (edit.characterization.matchesRule(recognitionInput) !== true) {
      return { allowed: false, reason: "The existing Rule no longer matches the characterized simple form." };
    }
  } catch (_error) {
    return { allowed: false, reason: "The characterized simple form could not validate the existing Rule." };
  }
  if (!isDimmerActionPermittedByForm(edit.action, edit.characterization)) {
    return { allowed: false, reason: "The selected action is not permitted by the characterized simple form." };
  }
  const originalAction = rule.actions[edit.actionIndex];
  if (!originalAction || !isDimmerActionPermittedByForm(originalAction, edit.characterization)) {
    return { allowed: false, reason: "The existing Rule action is not permitted by the characterized simple form." };
  }
  const actionPolicy = validateRulePayload({ actions: [edit.action] });
  if (!actionPolicy.allowed) return { allowed: false, reason: actionPolicy.reason };
  const catalogPolicy = validateHueCatalogPayload("rule", "update", { actions: [edit.action] });
  if (!catalogPolicy.allowed) return { allowed: false, reason: catalogPolicy.reason };
  const nextActions = actions.map((value, index) => index === edit.actionIndex ? edit.action : value);
  return { allowed: true, payload: { actions: nextActions as unknown[] } };
}

/** Alias with a shorter name for service and test callers. */
export const buildSimpleBindingPayload = buildSimpleDimmerBindingPayload;

/**
 * Validate and normalize one explicitly supplied structural change set. The
 * result is deliberately finite and ephemeral; it is not a dependency graph
 * or a transaction journal.
 */
export function previewStructuralDimmerEdit(edit: StructuralDimmerEdit): StructuralDimmerPreview {
  const candidate = edit && typeof edit === "object" ? edit : {};
  const supplied = candidate.changeSet || (Array.isArray(candidate.operations) ? {
    ...(candidate.deviceKey ? { deviceKey: candidate.deviceKey } : {}),
    summary: `Apply ${candidate.operations.length} characterized dimmer operation${candidate.operations.length === 1 ? "" : "s"}.`,
    operations: candidate.operations,
  } : undefined);
  if (!supplied) return { allowed: false, reason: "This structural edit has no concrete operations." };
  if (typeof supplied.summary !== "string" || !supplied.summary.trim()) return { allowed: false, reason: "A structural edit needs a user-facing summary." };
  if (!Array.isArray(supplied.operations) || supplied.operations.length === 0) return { allowed: false, reason: "This structural edit has no concrete operations." };

  const operations: DimmerChangeOperation[] = [];
  for (const operation of supplied.operations) {
    const checked = validateStructuralOperation(operation);
    if (!checked.allowed) return checked;
    operations.push({
      ...operation,
      destructive: operation.operation === "delete",
      ...(operation.payload ? { payload: { ...operation.payload } } : {}),
    });
  }
  if (!isGenuinelyStructuralOperations(operations)) {
    return {
      allowed: false,
      reason: "This change affects only one existing Hue resource; use the direct Save path for a simple Rule edit.",
    };
  }
  return {
    allowed: true,
    changeSet: {
      ...(supplied.deviceKey ? { deviceKey: supplied.deviceKey } : {}),
      summary: supplied.summary,
      operations,
    },
  };
}

function isGenuinelyStructuralOperations(operations: readonly DimmerChangeOperation[]): boolean {
  if (operations.some((operation) => operation.operation === "create" || operation.operation === "delete")) return true;
  const resources = new Set<string>();
  operations.forEach((operation) => {
    resources.add(`${operation.kind}:${operation.id || "<new>"}`);
  });
  return resources.size > 1;
}

/** Alias matching the SAD service terminology. */
export const previewStructuralEdit = previewStructuralDimmerEdit;

function validateStructuralOperation(operation: DimmerChangeOperation): { readonly allowed: true } | { readonly allowed: false; readonly reason: string } {
  if (!operation || typeof operation !== "object") return { allowed: false, reason: "Structural operations must be structured objects." };
  if (typeof operation.label !== "string" || !operation.label.trim()) return { allowed: false, reason: "Each structural operation needs a user-facing label." };
  if (!isDimmerMutationOperation(operation.operation)) {
    return { allowed: false, reason: "The structural operation is not supported." };
  }
  if (!isDimmerResourceKind(operation.kind)) return { allowed: false, reason: "The structural resource kind is not supported." };
  if (operation.operation !== "create" && (typeof operation.id !== "string" || !operation.id.trim())) {
    return { allowed: false, reason: "This structural operation requires a Hue resource ID." };
  }
  if (operation.operation === "create" && operation.id) {
    return { allowed: false, reason: "Created Hue resource IDs are assigned by the bridge." };
  }
  if (operation.operation === "delete") return { allowed: true };
  const payload = operation.operation === "enable" || operation.operation === "disable"
    ? { status: operation.operation === "enable" ? "enabled" : "disabled" }
    : operation.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { allowed: false, reason: `${operation.operation} requires a structured payload.` };
  }
  const catalogOperation = operation.operation === "create" ? "create" : operation.operation === "update" ? "update" : "status";
  const catalog = validateHueCatalogPayload(operation.kind, catalogOperation, payload);
  if (!catalog.allowed) return { allowed: false, reason: catalog.reason };
  if (operation.kind === "rule") {
    const policy = validateRulePayload(payload);
    if (!policy.allowed) return { allowed: false, reason: policy.reason };
  }
  if (operation.kind === "schedule") {
    const policy = validateSchedulePayload(payload);
    if (!policy.allowed) return { allowed: false, reason: policy.reason };
  }
  return { allowed: true };
}

function isDimmerMutationOperation(value: unknown): value is DimmerChangeOperation["operation"] {
  return value === "create" || value === "update" || value === "enable" || value === "disable" || value === "delete";
}

function isDimmerResourceKind(value: unknown): value is DimmerChangeOperation["kind"] {
  return value === "light" || value === "group" || value === "scene" || value === "sensor"
    || value === "rule" || value === "schedule" || value === "resourcelink";
}

function isNumericButtonEvent(value: unknown): boolean {
  return (typeof value === "number" && Number.isInteger(value))
    || (typeof value === "string" && /^\d+$/.test(value.trim()));
}
