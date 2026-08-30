import { HueSnapshot, ResourceRef } from "../../../app/types";
import { validateRulePayload } from "../HueActionPolicy";
import { validateHueCatalogPayload } from "../catalog/resourceCatalog";
import { HueRuleAction } from "../catalog/rules";
import {
  DimmerModelCatalog,
  DimmerModelCatalogEntry,
  DimmerStructuralForm,
  findDimmerEvents,
  getDimmerModelCatalog,
  physicalDeviceKey,
  resolveDimmerIdentity,
  sensorFromSnapshot,
  sensorsForPhysicalDevice,
} from "./modelCatalog";
import {
  parseResourceLinkReferences,
  parseRuleReferences,
  parseScheduleCommandReference,
  safeRuleShape,
  safeCreatorProvenance,
} from "./references";
import {
  DimmerBindingRecognitionInput,
  DimmerActionKind,
  DimmerActionMapping,
  DimmerAdvancedBindingDetails,
  DimmerAdvancedModel,
  DimmerBindingClassification,
  DimmerBindingModel,
  DimmerControlModel,
  DimmerEditorModel,
  DimmerReference,
  DimmerSensorRecord,
  DimmerStructuralEditor,
  resourceRefKey,
} from "./types";
import { isDimmerActionPermittedByForm } from "./actions";

/**
 * Project the current Hue snapshot into the physical-control-first dimmer
 * model. This function has no side effects and does not perform network,
 * persistence, or React work.
 */
export function buildEditorModel(
  sensorRef: ResourceRef,
  snapshot: HueSnapshot,
  catalog: DimmerModelCatalog = getDimmerModelCatalog(),
): DimmerEditorModel {
  const identity = resolveDimmerIdentity(sensorRef, snapshot, catalog);
  if (identity.status !== "recognized" || !identity.entry || !identity.sensor) {
    const status = identity.status === "recognized" ? "missing" : identity.status;
    return buildUnrecognizedModel(status, identity.sensor, identity.deviceKey, identity.reason, snapshot);
  }

  const entry = identity.entry;
  const physicalSensors = sensorsForPhysicalDevice(snapshot, entry, identity.deviceKey);
  const sensors = physicalSensors.length > 0 ? physicalSensors : [identity.sensor];
  const sensorIds = sensors.map((sensor) => sensor.id);
  const automation = collectAutomationGraph(snapshot, sensorIds);
  const associationSensorIds = automation.sensorIds;
  const helperSensorIds = associationSensorIds.filter((id) => !sensorIds.includes(id));
  const associatedRules = collectAssociatedRules(snapshot, automation.ruleIds, sensorIds);
  const bindings: DimmerBindingModel[] = [];
  let bindingSequence = 0;

  associatedRules.forEach(({ id, value, parsed, matchingConditions }) => {
    if (matchingConditions.length === 0) {
      bindings.push(projectReadOnlyRuleBinding(
        bindingSequence++,
        id,
        value,
        parsed,
        associationSensorIds,
        helperSensorIds,
        automation.resourceLinkIds,
      ));
      return;
    }
    matchingConditions.forEach((conditionIndex) => bindings.push(projectRuleBinding(
      bindingSequence++,
      id,
      value,
      parsed,
      conditionIndex,
      entry,
      snapshot,
      associationSensorIds,
      sensorIds,
      helperSensorIds,
      automation.resourceLinkIds,
    )));
  });

  const fullRows = addUnboundControlRows(entry, bindings, associationSensorIds, helperSensorIds);
  const rows = fullRows.map(toBindingView);
  const advanced = buildAdvancedModel(sensorIds, helperSensorIds, fullRows, automation, sensors);
  const displayName = firstText(sensors.map((sensor) => sensor.name || sensor.productname)) || entry.label;
  const model: DimmerEditorModel = {
    deviceKey: identity.deviceKey,
    displayName,
    catalogId: entry.id,
    modelLabel: entry.label,
    recognized: true,
    identityStatus: "recognized",
    controls: buildControlModels(entry, rows),
    rows,
    advanced,
  };
  return model;
}

/** Compatibility alias matching the SAD terminology. */
export const buildDimmerEditorModel = buildEditorModel;

export function isRecognizedDimmerSensor(
  sensorRef: ResourceRef,
  snapshot: HueSnapshot,
  catalog: DimmerModelCatalog = getDimmerModelCatalog(),
): boolean {
  return resolveDimmerIdentity(sensorRef, snapshot, catalog).status === "recognized";
}

export function findDimmerSensorId(
  deviceKey: string,
  snapshot: HueSnapshot,
  catalog: DimmerModelCatalog = getDimmerModelCatalog(),
): string | undefined {
  for (const id of Object.keys(snapshot.sensors)) {
    const identity = resolveDimmerIdentity({ kind: "sensor", id }, snapshot, catalog);
    if (identity.status === "recognized" && identity.deviceKey === deviceKey) return id;
  }
  return undefined;
}

/**
 * Adapt the application's in-memory state store to the pure projector input.
 * Unknown resources are intentionally omitted; the projector must not treat
 * a stale last-known value as authoritative for an editor.
 */
export function snapshotFromStateStore(
  stateStore: { readonly getAll: () => ReadonlyMap<string, { readonly state: { readonly status: string; readonly value?: unknown } }> },
): HueSnapshot {
  const snapshot: HueSnapshot = {
    lights: {},
    groups: {},
    scenes: {},
    sensors: {},
    rules: {},
    schedules: {},
    resourcelinks: {},
  };
  stateStore.getAll().forEach((stored, key) => {
    if (stored.state.status !== "known" || !stored.state.value || typeof stored.state.value !== "object") return;
    const separator = key.indexOf(":");
    if (separator <= 0) return;
    const kind = key.slice(0, separator);
    const id = key.slice(separator + 1);
    const collection = kind === "resourcelink"
      ? snapshot.resourcelinks
      : snapshot[`${kind}s` as keyof HueSnapshot];
    if (collection && typeof collection === "object" && !Array.isArray(collection)) {
      (collection as Record<string, unknown>)[id] = stored.state.value;
    }
  });
  return snapshot;
}

interface AssociatedRule {
  readonly id: string;
  readonly value: Record<string, unknown>;
  readonly parsed: ReturnType<typeof parseRuleReferences>;
  readonly matchingConditions: readonly number[];
}

function collectAssociatedRules(
  snapshot: HueSnapshot,
  ruleIds: readonly string[],
  physicalSensorIds: readonly string[],
): readonly AssociatedRule[] {
  const sensors = new Set(physicalSensorIds);
  const selected = new Set(ruleIds);
  return Object.entries(snapshot.rules).reduce<AssociatedRule[]>((result, [id, raw]) => {
    const value = asRecord(raw);
    const parsed = parseRuleReferences(value);
    const matchingConditions = parsed.conditions.reduce<number[]>((indices, reference, index) => {
      const candidate = reference.status === "recognized" ? reference.ref : reference.ref;
      if (candidate?.kind === "sensor" && candidate.id && sensors.has(candidate.id)) indices.push(index);
      return indices;
    }, []);
    if (selected.has(id)) result.push({ id, value, parsed, matchingConditions });
    return result;
  }, []);
}

function projectRuleBinding(
  sequence: number,
  ruleId: string,
  rule: Record<string, unknown>,
  parsed: ReturnType<typeof parseRuleReferences>,
  conditionIndex: number,
  entry: DimmerModelCatalogEntry,
  snapshot: HueSnapshot,
  associationSensorIds: readonly string[],
  physicalSensorIds: readonly string[],
  helperSensorIds: readonly string[],
  resourceLinkIds: readonly string[],
): DimmerBindingModel {
  const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
  const actions = Array.isArray(rule.actions) ? rule.actions : [];
  const condition = asRecord(conditions[conditionIndex]);
  const conditionReference = parsed.conditions[conditionIndex];
  const rawEvent = numericEvent(condition.value);
  const conditionSensorId = conditionReference?.ref?.kind === "sensor" ? conditionReference.ref.id : undefined;
  const isPhysicalCondition = Boolean(conditionSensorId && physicalSensorIds.includes(conditionSensorId));
  const eventMatches = rawEvent === undefined || !isPhysicalCondition ? [] : rawEventMappings(entry, rawEvent);
  // Keep the first mapping for readable labels, but never treat duplicate
  // catalog claims as editable. A duplicate event is an ambiguous model
  // characterization, not a permission to pick whichever row comes first.
  const eventMapping = eventMatches[0];
  const eventAmbiguous = eventMatches.length > 1;
  const actionReferences = parsed.actions;
  const simpleForm = eventMapping?.gesture.simpleForm;
  const actionIndex = simpleForm?.actionIndex;
  const action = actionIndex !== undefined && actionIndex >= 0 && actionIndex < actions.length ? asRecord(actions[actionIndex]) : undefined;
  const actionReference = actionIndex !== undefined ? actionReferences[actionIndex] : undefined;
  const ruleShape = safeRuleShape(rule);
  const recognitionInput = rawEvent === undefined ? undefined : {
    event: rawEvent,
    conditionIndex,
    rule: ruleShape,
    conditionReferences: parsed.conditions,
    actionReferences: parsed.actions,
  } satisfies DimmerBindingRecognitionInput;
  const mappedAction = action && actionReference?.status === "recognized"
    ? mapRuleAction(action as unknown as HueRuleAction, actionReference, snapshot)
    : undefined;
  const allActionsRecognized = actions.every((candidate, index) => {
    const reference = actionReferences[index];
    return reference?.status === "recognized"
      && mapRuleAction(candidate as unknown as HueRuleAction, reference, snapshot) !== undefined;
  });
  const structuralForm = eventMapping?.gesture.bindingKind === "structural" && eventMapping.gesture.structuralFormId
    ? entry.structuralForms?.find((form) => form.id === eventMapping!.gesture.structuralFormId)
    : undefined;
  const structuralRecognized = Boolean(structuralForm
    && recognitionInput
    && actions.length > 0
    && allActionsRecognized
    && structuralActionShapeRecognized(structuralForm, actions, actionReferences, snapshot)
    && matchesRuleForm(structuralForm.matchesRule, recognitionInput));
  const simpleActionAllowed = Boolean(simpleForm && action && isDimmerActionPermittedByForm(action as unknown as HueRuleAction, simpleForm));
  const simpleRecognized = Boolean(simpleForm && recognitionInput && matchesRuleForm(simpleForm.matchesRule, recognitionInput));
  const structuralAction = structuralRecognized && structuralForm ? {
    kind: structuralForm.actionKind || "cycle" as const,
    label: structuralForm.label,
    targetLabel: "Choose scenes in the structural editor",
    fields: {},
  } : undefined;
  const actionMapping = structuralAction || (mappedAction ? {
    kind: mappedAction.kind,
    label: mappedAction.label,
    targetLabel: mappedAction.targetLabel,
    fields: mappedAction.fields,
  } : undefined);
  const missingActionTargetAt = (reference: DimmerReference, index: number): boolean => {
    const target = reference.status === "recognized" ? reference.ref : reference.ref;
    return Boolean(target && ["light", "group", "scene"].includes(target.kind) && !targetExists(snapshot, target) && index >= 0);
  };
  const missingActionTarget = actionReferences.some(missingActionTargetAt);
  const selectedActionTargetMissing = actionIndex !== undefined
    && Boolean(actionReferences[actionIndex] && missingActionTargetAt(actionReferences[actionIndex], actionIndex));
  const companionActionTargetMissing = actionReferences.some((reference, index) => index !== actionIndex && missingActionTargetAt(reference, index));

  const references = [...parsed.all];
  const resourceRefs = uniqueResourceRefs(references);
  const creator = safeCreatorProvenance(rule.owner);
  const baseAdvanced: DimmerAdvancedBindingDetails = {
    sensorIds: [...associationSensorIds],
    helperSensorIds: [...helperSensorIds],
    rawEvents: rawEvent === undefined ? [] : [rawEvent],
    references,
    resourceRefs,
    ruleId,
    ...(ruleShape ? { ruleShape } : {}),
    conditionIndex,
    ...(action ? { actionIndex } : {}),
    resourceLinkIds: [...resourceLinkIds],
    ...(mappedAction?.target ? { actionTarget: mappedAction.target } : {}),
    creator,
    sourceKind: "rule",
  };

  const eventStatus = classifyCondition(conditionReference, condition, rawEvent, eventMapping, eventAmbiguous);
  let classification: DimmerBindingClassification = eventStatus.classification;
  let reason = eventStatus.reason;
  let editable = false;
  if (classification === "unsupported" || classification === "malformed" || classification === "ambiguous") {
    // Keep the explicit parser classification.
  } else if (eventMapping?.gesture.bindingKind === "structural") {
    classification = missingActionTarget ? "missing_target" : structuralRecognized ? "recognized_structural" : "custom";
    editable = structuralRecognized
      && Boolean(structuralForm?.buildChangeSet && isUsableStructuralEditor(structuralForm.editor))
      && !missingActionTarget;
    if (missingActionTarget) reason = "One or more referenced Scene targets are not present in the current Hue snapshot.";
    else if (!structuralForm) reason = "This structural gesture has no characterized change form.";
    else if (!structuralRecognized) reason = "The existing Rule does not match the characterized structural form.";
    else if (!structuralForm.buildChangeSet) reason = "This structural form has no editor implementation.";
    else if (!isUsableStructuralEditor(structuralForm.editor)) reason = "This structural form has no local value editor.";
  } else if (!action || !actionReference || actionReference.status !== "recognized" || !actionMapping) {
    classification = actionReference?.status === "malformed" ? "malformed" : "custom";
    reason = actionReference?.status === "unsupported"
      ? actionReference.reason
      : "The Rule action is not a recognized structured dimmer action.";
  } else if (!targetExists(snapshot, mappedAction?.target)) {
    classification = "missing_target";
    editable = selectedActionTargetMissing
      && !companionActionTargetMissing
      && Boolean(simpleForm && simpleActionAllowed && simpleRecognized);
    reason = editable
      ? "The original target is unavailable. Choose an explicit replacement target; the action and companion automation will be preserved."
      : companionActionTargetMissing
        ? "More than one Rule action target is missing; inspect the Rule before repairing it."
        : "The referenced target is not present and the Rule is not an otherwise characterized simple binding.";
  } else if (!simpleForm) {
    classification = "custom";
    reason = "This gesture has no characterized simple action form.";
  } else if (!simpleActionAllowed) {
    classification = "custom";
    reason = "The existing Rule action is not permitted by the characterized simple form.";
  } else if (!simpleRecognized) {
    classification = "custom";
    reason = "The existing Rule does not match the characterized simple form.";
  } else {
    classification = "editable_simple";
    editable = true;
  }

  const controlLabel = eventMapping?.control.label || "Unrecognized control";
  const gestureLabel = eventMapping?.gesture.label || (rawEvent === undefined ? "Unrecognized gesture" : "Unknown button event");
  const binding: DimmerBindingModel = {
    id: `binding:${sequence}`,
    controlId: eventMapping?.control.id || "unknown-control",
    controlLabel,
    gestureId: eventMapping?.gesture.id,
    gestureLabel,
    ...(rawEvent === undefined ? {} : { event: rawEvent }),
    classification,
    editable,
    ...(simpleForm ? { simpleForm } : {}),
    ...(actionMapping ? { action: actionMapping } : {}),
    ...(eventMapping?.gesture.structuralFormId ? { structuralFormId: eventMapping.gesture.structuralFormId } : {}),
    ...(reason ? { reason } : {}),
    advanced: {
      ...baseAdvanced,
      reason,
    },
  };
  return binding;
}

function projectReadOnlyRuleBinding(
  sequence: number,
  ruleId: string,
  rule: Record<string, unknown>,
  parsed: ReturnType<typeof parseRuleReferences>,
  associationSensorIds: readonly string[],
  helperSensorIds: readonly string[],
  resourceLinkIds: readonly string[],
): DimmerBindingModel {
  const rawEvents = (Array.isArray(rule.conditions) ? rule.conditions : [])
    .map((condition) => numericEvent(asRecord(condition).value))
    .filter(isNumber);
  const classification = parsed.conditions.some((reference) => reference.status === "malformed")
    ? "malformed" as const
    : parsed.conditions.some((reference) => reference.status === "unsupported")
      ? "unsupported" as const
      : "custom" as const;
  const reason = "This associated Rule is inspectable but has no catalog-recognized physical gesture.";
  const ruleShape = safeRuleShape(rule);
  const binding: DimmerBindingModel = {
    id: `binding:${sequence}`,
    controlId: "unknown-control",
    controlLabel: "Associated automation",
    gestureLabel: rawEvents.length === 1 ? `Event ${rawEvents[0]}` : "Rule automation",
    ...(rawEvents.length === 1 ? { event: rawEvents[0] } : {}),
    classification,
    editable: false,
    reason,
    advanced: {
      sensorIds: [...associationSensorIds],
      helperSensorIds: [...helperSensorIds],
      rawEvents,
      references: [...parsed.all],
      resourceRefs: uniqueResourceRefs(parsed.all),
      ruleId,
      ruleShape,
      resourceLinkIds: [...resourceLinkIds],
      creator: safeCreatorProvenance(rule.owner),
      sourceKind: "rule",
      reason,
    },
  };
  return binding;
}

function matchesRuleForm(
  matcher: ((input: DimmerBindingRecognitionInput) => boolean) | undefined,
  input: DimmerBindingRecognitionInput,
): boolean {
  if (typeof matcher !== "function") return false;
  try {
    return matcher(input) === true;
  } catch (_error) {
    return false;
  }
}

function classifyCondition(
  reference: DimmerReference | undefined,
  condition: Record<string, unknown>,
  event: number | undefined,
  mapping: ReturnType<typeof rawEventMappings>[number] | undefined,
  ambiguous: boolean,
): { readonly classification: DimmerBindingClassification; readonly reason?: string } {
  if (reference?.status === "malformed") return { classification: "malformed", reason: reference.reason };
  if (reference?.status === "unsupported") return { classification: "unsupported", reason: reference.reason };
  if (!reference || reference.status !== "recognized") return { classification: "malformed", reason: "The Rule condition is not a recognized exact Sensor reference." };
  if (reference.kind !== "sensor" || reference.field !== "buttonevent") return { classification: "unsupported", reason: "The Rule condition does not observe a button event." };
  if (condition.operator !== "eq") return { classification: "unsupported", reason: "Dimmer bindings require an exact button-event condition." };
  if (event === undefined) return { classification: "malformed", reason: "The button event value is not a whole number." };
  if (ambiguous) return { classification: "ambiguous", reason: "The button event is claimed by multiple catalog gestures." };
  if (!mapping) return { classification: "unsupported", reason: "The button event is not characterized for this dimmer model." };
  return { classification: "editable_simple" };
}

function rawEventMappings(entry: DimmerModelCatalogEntry, event: number) {
  return findDimmerEvents(entry, event);
}

function isUsableStructuralEditor(editor: DimmerStructuralEditor | undefined): boolean {
  return editor?.kind === "scene_cycle" && Number.isInteger(editor.sceneCount) && (editor.sceneCount as number) >= 2;
}

/**
 * Keep the local structural editor's semantic boundary closed even when a
 * catalog matcher is accidentally broader than its form. A Scene-cycle may
 * only contain valid, currently routable Scene activations; a Light/Group
 * action or a malformed companion action must remain read-only.
 */
function structuralActionShapeRecognized(
  form: DimmerStructuralForm,
  actions: readonly unknown[],
  references: readonly DimmerReference[],
  snapshot: HueSnapshot,
): boolean {
  if (form.actionKind !== "cycle") return true;
  return actions.every((candidate, index) => {
    const reference = references[index];
    if (!reference || reference.status !== "recognized" || reference.kind !== "scene") return false;
    const mapped = mapRuleAction(candidate as HueRuleAction, reference, snapshot);
    return mapped?.kind === "activate";
  });
}

function mapRuleAction(action: HueRuleAction, reference: Extract<DimmerReference, { status: "recognized" }>, snapshot: HueSnapshot): DimmerActionMapping | undefined {
  const body = action.body && typeof action.body === "object" && !Array.isArray(action.body) ? action.body : {};
  if (action.method.toUpperCase() !== "PUT") return undefined;
  const policy = validateRulePayload({ actions: [action] });
  if (!policy.allowed) return undefined;
  const catalogPolicy = validateHueCatalogPayload("rule", "update", { actions: [action] });
  if (!catalogPolicy.allowed) return undefined;
  if (reference.kind === "scene") {
    const sceneId = body.scene;
    if (typeof sceneId !== "string" || sceneId !== reference.id) return undefined;
    const scene = asRecord(snapshot.scenes[sceneId]);
    const expectedGroup = scene.type === "LightScene" ? "0" : scene.type === "GroupScene" ? scene.group : undefined;
    if (typeof expectedGroup !== "string" || !/^\d+$/.test(expectedGroup)
      || normalizedHuePath(action.address) !== `/groups/${expectedGroup}/action`) return undefined;
    return {
      kind: "activate",
      label: "Activate Scene",
      target: reference.ref,
      targetLabel: resourceLabel(snapshot, reference.ref),
      // The scene ID is retained in Advanced.actionTarget; the normal view
      // must not expose raw Hue identifiers.
      fields: {},
    };
  }
  if (reference.kind !== "light" && reference.kind !== "group") return undefined;
  const operation = actionKindFromBody(body);
  if (!operation) return undefined;
  return {
    kind: operation,
    label: actionLabel(operation),
    target: reference.ref,
    targetLabel: resourceLabel(snapshot, reference.ref),
    fields: { ...body },
  };
}

function normalizedHuePath(value: string): string {
  return value.replace(/^\/api\/[^/]+/i, "");
}

interface AutomationGraph {
  readonly sensorIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly scheduleIds: readonly string[];
  readonly resourceLinkIds: readonly string[];
  readonly references: readonly DimmerReference[];
  readonly creatorProvenance: readonly NonNullable<ReturnType<typeof safeCreatorProvenance>>[];
}

/**
 * Collect the exact automation closure rooted at the physical Sensor(s).
 * Resource Links can promote Rules/Schedules, and those resources can in turn
 * identify helper Sensors or additional targets. Every discovered root is
 * processed until the closure stops growing; no serialized-text association is
 * used.
 */
function collectAutomationGraph(snapshot: HueSnapshot, initialSensorIds: readonly string[]): AutomationGraph {
  const sensorIds = new Set(initialSensorIds);
  const ruleIds = new Set<string>();
  const scheduleIds = new Set<string>();
  const resourceLinkIds = new Set<string>();
  const processedRuleIds = new Set<string>();
  const processedScheduleIds = new Set<string>();
  const processedResourceLinkIds = new Set<string>();
  const knownReferences = new Set(initialSensorIds.map((id) => `sensor:${id}`));
  const references: DimmerReference[] = initialSensorIds.map((id) => ({
    status: "recognized" as const,
    ref: { kind: "sensor" as const, id },
    kind: "sensor" as const,
    id,
    path: `/sensors/${encodeURIComponent(id)}`,
  }));
  const creatorProvenance: Array<NonNullable<ReturnType<typeof safeCreatorProvenance>>> = [];
  let changed = true;

  while (changed) {
    changed = false;
    Object.entries(snapshot.rules).forEach(([id, raw]) => {
      if (processedRuleIds.has(id)) return;
      const value = asRecord(raw);
      const parsed = parseRuleReferences(value);
      const touchesKnownSensor = parsed.conditions.some((reference) => {
        const ref = reference.ref;
        return ref?.kind === "sensor" && Boolean(ref.id && sensorIds.has(ref.id));
      });
      if (!ruleIds.has(id) && !touchesKnownSensor) return;
      ruleIds.add(id);
      processedRuleIds.add(id);
      changed = true;
      references.push(...parsed.all);
      addKnownReference({ kind: "rule", id });
      parsed.all.forEach(addReference);
      const creator = safeCreatorProvenance(value.owner);
      if (creator) creatorProvenance.push(creator);
    });

    Object.entries(snapshot.schedules).forEach(([id, raw]) => {
      if (processedScheduleIds.has(id)) return;
      const value = asRecord(raw);
      const reference = parseScheduleCommandReference(value.command);
      const touchesKnownSensor = reference.ref?.kind === "sensor"
        && Boolean(reference.ref.id && sensorIds.has(reference.ref.id));
      if (!scheduleIds.has(id) && !touchesKnownSensor) return;
      scheduleIds.add(id);
      processedScheduleIds.add(id);
      changed = true;
      references.push(reference);
      addKnownReference({ kind: "schedule", id });
      addReference(reference);
      const creator = safeCreatorProvenance(value.owner);
      if (creator) creatorProvenance.push(creator);
    });

    Object.entries(snapshot.resourcelinks).forEach(([id, raw]) => {
      if (processedResourceLinkIds.has(id)) return;
      const parsed = parseResourceLinkReferences(raw);
      const touchesKnownResource = parsed.some((reference) => {
        const ref = reference.ref;
        return Boolean(ref && knownReferences.has(resourceRefKey(ref)));
      });
      if (!resourceLinkIds.has(id) && !touchesKnownResource) return;
      resourceLinkIds.add(id);
      processedResourceLinkIds.add(id);
      changed = true;
      references.push(...parsed);
      addKnownReference({ kind: "resourcelink", id });
      parsed.forEach(addReference);
      const creator = safeCreatorProvenance(asRecord(raw).owner);
      if (creator) creatorProvenance.push(creator);
    });
  }

  return {
    sensorIds: [...sensorIds],
    ruleIds: [...ruleIds],
    scheduleIds: [...scheduleIds],
    resourceLinkIds: [...resourceLinkIds],
    references,
    creatorProvenance,
  };

  function addReference(reference: DimmerReference): void {
    if (!reference.ref) return;
    addKnownReference(reference.ref);
    if (reference.ref.kind === "sensor" && reference.ref.id) sensorIds.add(reference.ref.id);
    if (reference.ref.kind === "rule" && reference.ref.id) ruleIds.add(reference.ref.id);
    if (reference.ref.kind === "schedule" && reference.ref.id) scheduleIds.add(reference.ref.id);
    if (reference.ref.kind === "resourcelink" && reference.ref.id) resourceLinkIds.add(reference.ref.id);
  }

  function addKnownReference(ref: ResourceRef): void {
    knownReferences.add(resourceRefKey(ref));
  }
}

function actionKindFromBody(body: Record<string, unknown>): DimmerActionKind | undefined {
  if (typeof body.on === "boolean") {
    const keys = Object.keys(body).filter((key) => key !== "transitiontime");
    if (keys.length === 1) return body.on ? "on" : "off";
  }
  const relativeKeys = Object.keys(body).filter((key) => key !== "transitiontime");
  if (body.bri_inc === 0 && relativeKeys.length === 1) return "stop";
  if (typeof body.bri_inc === "number" && Number.isFinite(body.bri_inc) && body.bri_inc !== 0 && relativeKeys.length === 1) {
    return body.bri_inc > 0 ? "brighten" : "dim";
  }
  const supportedFields = new Set(["on", "bri", "hue", "sat", "xy", "ct", "alert", "effect", "transitiontime"]);
  if (Object.keys(body).length > 0 && Object.keys(body).every((key) => supportedFields.has(key))) return "set";
  return undefined;
}

function actionLabel(kind: DimmerActionKind): string {
  switch (kind) {
    case "on": return "Turn on";
    case "off": return "Turn off";
    case "activate": return "Activate Scene";
    case "set": return "Set light/group values";
    case "brighten": return "Brighten while held";
    case "dim": return "Dim while held";
    case "stop": return "Stop brightness change";
    case "cycle": return "Cycle scenes";
  }
}

function addUnboundControlRows(
  entry: DimmerModelCatalogEntry,
  bindings: readonly DimmerBindingModel[],
  sensorIds: readonly string[],
  helperSensorIds: readonly string[],
): DimmerBindingModel[] {
  const result: DimmerBindingModel[] = [];
  entry.controls.forEach((control) => control.gestures.forEach((gesture) => {
    const matching = bindings.filter((binding) => binding.controlId === control.id && binding.gestureId === gesture.id
      || binding.controlId === control.id && binding.gestureId === undefined && binding.advanced.rawEvents.includes(gesture.event));
    if (matching.length > 0) result.push(...matching);
    else result.push({
      id: `unbound:${control.id}:${gesture.id || gesture.event}`,
      controlId: control.id,
      controlLabel: control.label,
      gestureId: gesture.id,
      gestureLabel: gesture.label,
      event: gesture.event,
      classification: "custom",
      editable: false,
      reason: "No current Rule binding was found for this control and gesture.",
      advanced: {
        sensorIds: [...sensorIds],
        helperSensorIds: [...helperSensorIds],
        rawEvents: [],
        references: [],
        resourceRefs: [],
        resourceLinkIds: [],
        sourceKind: "sensor",
        reason: "No current Rule binding was found for this control and gesture.",
      },
    });
  }));
  // Preserve custom/malformed/unknown Rules that are associated with the
  // physical Sensor but do not map to one catalog gesture.
  bindings.filter((binding) => binding.controlId === "unknown-control").forEach((binding) => result.push(binding));
  return result;
}

function buildControlModels(entry: DimmerModelCatalogEntry, rows: readonly import("./types").DimmerBindingView[]): readonly DimmerControlModel[] {
  return entry.controls.map((control) => ({
    id: control.id,
    label: control.label,
    gestures: rows.filter((row) => row.controlId === control.id),
  }));
}

function buildAdvancedModel(
  sensorIds: readonly string[],
  helperSensorIds: readonly string[],
  bindings: readonly DimmerBindingModel[],
  automation: AutomationGraph,
  sensors: readonly DimmerSensorRecord[],
): DimmerAdvancedModel {
  const allBindings = [...bindings];
  const references = [
    ...allBindings.flatMap((binding) => binding.advanced.references),
    ...automation.references,
  ];
  const resourceRefs = uniqueResourceRefs(references);
  const ruleIds = uniqueStrings([
    ...automation.ruleIds,
    ...allBindings.map((binding) => binding.advanced.ruleId).filter(isString),
  ]);
  const scheduleIds = uniqueStrings([
    ...automation.scheduleIds,
    ...allBindings.map((binding) => binding.advanced.scheduleId).filter(isString),
  ]);
  const rawEvents = uniqueNumbers([
    ...allBindings.flatMap((binding) => binding.advanced.rawEvents),
    ...sensors.map((sensor) => numericEvent(sensor.state?.buttonevent)).filter(isNumber),
  ]);
  const creators = [
    ...automation.creatorProvenance,
    ...allBindings.map((binding) => binding.advanced.creator).filter((value): value is NonNullable<typeof value> => Boolean(value)),
  ];
  return {
    sensorIds: [...sensorIds],
    helperSensorIds: [...helperSensorIds],
    rawEvents,
    references,
    resourceRefs,
    ruleIds,
    scheduleIds,
    resourceLinkIds: [...automation.resourceLinkIds],
    creatorProvenance: uniqueCreators(creators),
    bindings: allBindings,
    customBindings: allBindings.filter((binding) => binding.classification === "custom"),
    unsupportedBindings: allBindings.filter((binding) => ["unsupported", "malformed", "ambiguous", "missing_target"].includes(binding.classification)),
  };
}

function buildUnrecognizedModel(
  status: "unsupported" | "ambiguous" | "missing",
  sensor: DimmerSensorRecord | undefined,
  deviceKey: string,
  reason: string | undefined,
  snapshot: HueSnapshot,
): DimmerEditorModel {
  // An unsupported/ambiguous catalog result has no characterized physical
  // identity. Exact uniqueid equality is not enough evidence to merge
  // Sensors here; only the automation graph's explicit references may add
  // helper Sensors.
  const sensorIds = sensor ? [sensor.id] : [];
  const automation = collectAutomationGraph(snapshot, sensorIds);
  const associationSensorIds = automation.sensorIds;
  const helperSensorIds = associationSensorIds.filter((id) => !sensorIds.includes(id));
  const sensors = associationSensorIds
    .map((id) => sensorFromSnapshot(snapshot, id))
    .filter((value): value is DimmerSensorRecord => Boolean(value));
  const associatedRules = collectAssociatedRules(snapshot, automation.ruleIds, []);
  const automationBindings = associatedRules.map(({ id, value, parsed }, index) => projectReadOnlyRuleBinding(
    index,
    id,
    value,
    parsed,
    associationSensorIds,
    helperSensorIds,
    automation.resourceLinkIds,
  ));
  const rawEvent = sensor ? numericEvent(sensor.state?.buttonevent) : undefined;
  const placeholderReason = reason || "The physical dimmer identity is not established.";
  const sensorReference = sensor ? {
    status: "recognized" as const,
    ref: { kind: "sensor" as const, id: sensor.id },
    kind: "sensor" as const,
    id: sensor.id,
    path: `/sensors/${encodeURIComponent(sensor.id)}`,
  } : undefined;
  const binding: DimmerBindingModel = {
    id: `unrecognized:${sensor?.id || deviceKey}`,
    controlId: "unknown-control",
    controlLabel: "Physical control not recognized",
    gestureLabel: rawEvent === undefined ? "Unknown gesture" : "Unsupported button event",
    ...(rawEvent === undefined ? {} : { event: rawEvent }),
    classification: status === "missing" ? "malformed" : status,
    editable: false,
    reason: placeholderReason,
    advanced: {
      sensorIds: associationSensorIds,
      helperSensorIds,
      rawEvents: rawEvent === undefined ? [] : [rawEvent],
      references: sensorReference ? [sensorReference] : [],
      resourceRefs: sensor ? [{ kind: "sensor", id: sensor.id }] : [],
      resourceLinkIds: [...automation.resourceLinkIds],
      sourceKind: "sensor",
      reason: placeholderReason,
    },
  };
  const rowsForModel = automationBindings.length > 0 ? automationBindings : [binding];
  const advanced: DimmerAdvancedModel = {
    sensorIds,
    helperSensorIds,
    rawEvents: uniqueNumbers([
      ...rowsForModel.flatMap((row) => row.advanced.rawEvents),
      ...sensors.map((value) => numericEvent(value.state?.buttonevent)).filter(isNumber),
    ]),
    references: [
      ...rowsForModel.flatMap((row) => row.advanced.references),
      ...automation.references,
    ],
    resourceRefs: uniqueResourceRefs([
      ...rowsForModel.flatMap((row) => row.advanced.references),
      ...automation.references,
    ]),
    ruleIds: [...automation.ruleIds],
    scheduleIds: [...automation.scheduleIds],
    resourceLinkIds: [...automation.resourceLinkIds],
    creatorProvenance: uniqueCreators([
      ...automation.creatorProvenance,
      ...rowsForModel.map((row) => row.advanced.creator).filter((value): value is NonNullable<typeof value> => Boolean(value)),
    ]),
    bindings: rowsForModel,
    customBindings: rowsForModel.filter((row) => row.classification === "custom"),
    unsupportedBindings: rowsForModel.filter((row) => ["unsupported", "malformed", "ambiguous", "missing_target"].includes(row.classification)),
  };
  const rows = rowsForModel.map(toBindingView);
  return {
    deviceKey,
    displayName: sensor?.name || sensor?.productname || "Unrecognized dimmer Sensor",
    catalogId: undefined,
    modelLabel: sensor?.modelid,
    recognized: false,
    identityStatus: status,
    controls: [{ id: "unknown-control", label: "Physical control not recognized", gestures: rows }],
    rows,
    advanced,
    reason: reason || "The physical dimmer identity is not established.",
  };
}

function toBindingView(binding: DimmerBindingModel): import("./types").DimmerBindingView {
  return {
    id: binding.id,
    controlId: binding.controlId,
    controlLabel: binding.controlLabel,
    gestureId: binding.gestureId,
    gestureLabel: binding.gestureLabel,
    classification: binding.classification,
    editable: binding.editable,
    ...(binding.action ? { action: binding.action } : {}),
    ...(binding.structuralFormId ? { structuralFormId: binding.structuralFormId } : {}),
    ...(binding.reason ? { reason: binding.reason } : {}),
  };
}

function targetExists(snapshot: HueSnapshot, target: ResourceRef | undefined): boolean {
  if (!target || !target.id) return false;
  const collectionName = target.kind === "resourcelink" ? "resourcelinks" : `${target.kind}s`;
  const collection = snapshot[collectionName as keyof HueSnapshot];
  return Boolean(collection && typeof collection === "object" && Object.prototype.hasOwnProperty.call(collection, target.id));
}

function resourceLabel(snapshot: HueSnapshot, target: ResourceRef): string {
  if (!targetExists(snapshot, target)) return `${capitalize(target.kind)} unavailable`;
  const collectionName = target.kind === "resourcelink" ? "resourcelinks" : `${target.kind}s`;
  const raw = snapshot[collectionName as keyof HueSnapshot];
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>)[target.id || ""] : undefined;
  const record = asRecord(value);
  return typeof record.name === "string" ? record.name : typeof record.description === "string" ? record.description : `${capitalize(target.kind)} target`;
}

function numericEvent(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function uniqueResourceRefs(references: readonly DimmerReference[]): ResourceRef[] {
  const result: ResourceRef[] = [];
  const seen = new Set<string>();
  references.forEach((reference) => {
    const ref = reference.status === "recognized" ? reference.ref : reference.ref;
    if (!ref) return;
    const key = resourceRefKey(ref);
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ ...ref });
    }
  });
  return result;
}

function uniqueStrings(values: readonly string[]): string[] { return [...new Set(values)]; }
function uniqueNumbers(values: readonly number[]): number[] { return [...new Set(values)]; }
function isNumber(value: number | undefined): value is number { return typeof value === "number"; }
function uniqueCreators(values: readonly { present: boolean; label: string }[]): { present: boolean; label: string }[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value.label)) return false;
    seen.add(value.label);
    return true;
  });
}
function isString(value: string | undefined): value is string { return typeof value === "string"; }
function firstText(values: readonly (string | undefined)[]): string | undefined { return values.find((value) => Boolean(value && value.trim())); }
function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
