import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CommandResult, ResourceRef } from "../../app/types";
import { definiteFailure } from "../../app/commandResults";
import { diagnostic } from "../../app/diagnostics";
import { useAppRuntime } from "../AppContext";
import { DimmerControlRow } from "../components/DimmerControlRow";
import { ExpandableAdvancedSection } from "../components/ExpandableAdvancedSection";
import { Screen } from "../components/Screen";
import {
  EditorCatalogNumberField,
  EditorChoice,
  EditorAction,
  EditorHueField,
  EditorToggle,
  EditorSection,
  EditorXyColorField,
  ReadOnlyField,
} from "../editors/editorControls";
import {
  buildEditorModel,
  DimmerActionKind,
  DimmerBindingModel,
  DimmerBindingView,
  DimmerModelCatalog,
  DimmerSimpleActionForm,
  DimmerStructuralEditor,
  DimmerStructuralForm,
  findDimmerSensorId,
  snapshotFromStateStore,
} from "../../protocol/hue/dimmer";
import { buildDimmerRuleAction, dimmerTargetOptions } from "../../protocol/hue/dimmer/actions";
import {
  DimmerChangeSet,
  SimpleDimmerBindingEdit,
  StructuralCommitReport,
  StructuralDimmerEdit,
} from "../../protocol/hue/dimmer/types";
import { DimmerStructuralChangePreview } from "../components/DimmerStructuralChangePreview";

interface ActionDraft {
  readonly kind: DimmerActionKind;
  readonly targetKey: string;
  readonly fields: Record<string, unknown>;
}

export function ConfigureDimmerScreen({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState<string>();
  const [drafts, setDrafts] = useState<Record<string, ActionDraft>>({});
  const [structuralValues, setStructuralValues] = useState<Record<string, Record<string, unknown>>>({});
  const [structuralPreview, setStructuralPreview] = useState<{ readonly edit: StructuralDimmerEdit; readonly changeSet: DimmerChangeSet }>();
  const structuralCommitInFlight = useRef(false);
  const params = route?.params || {};
  // The ApplicationService owns the one catalog used for both projection and
  // mutation revalidation. It is deliberately not passed through navigation.
  const catalog = runtime.service.dimmerCatalog as DimmerModelCatalog;
  const snapshot = useMemo(() => snapshotFromStateStore(runtime.service.stateStore), [runtime, version]);
  const requestedSensorId = typeof params.sensorId === "string" ? params.sensorId : typeof params.id === "string" ? params.id : undefined;
  const sensorId = requestedSensorId || (typeof params.deviceKey === "string" ? findDimmerSensorId(params.deviceKey, snapshot, catalog) : undefined);
  const model = useMemo(() => buildEditorModel({ kind: "sensor", id: sensorId || "" }, snapshot, catalog), [sensorId, snapshot, catalog]);
  const targetOptions = useMemo(() => dimmerTargetOptions(snapshot), [snapshot]);
  const fullBindings = model.advanced.bindings;

  useEffect(() => {
    const subscribe = runtime.service.stateStore?.subscribe;
    if (typeof subscribe !== "function") return undefined;
    return subscribe(() => setVersion((value) => value + 1));
  }, [runtime]);

  useEffect(() => {
    const initial: Record<string, ActionDraft> = {};
    fullBindings.forEach((binding) => {
      if (!binding.editable || binding.classification !== "editable_simple" || !binding.action || !binding.advanced.actionTarget) return;
      initial[binding.id] = {
        kind: binding.action.kind,
        targetKey: resourceKey(binding.advanced.actionTarget),
        fields: { ...binding.action.fields },
      };
    });
    setDrafts(initial);
  }, [model.deviceKey, version]); // A refresh establishes a new authoritative draft.

  useEffect(() => {
    const initial: Record<string, Record<string, unknown>> = {};
    fullBindings.forEach((binding) => {
      if (binding.classification !== "recognized_structural" || !binding.structuralFormId || !model.catalogId) return;
      const form = findStructuralForm(catalog, model.catalogId, binding.structuralFormId);
      if (!form) return;
      const values = { ...(form.initialValues?.({ model, binding }) || {}) };
      if (form.editor?.kind === "scene_cycle" && values.sceneIds === undefined) {
        values.sceneIds = initialSceneIds(binding, form.editor.sceneCount, targetOptions);
      }
      initial[binding.id] = { ...values };
    });
    setStructuralValues(initial);
    if (!structuralCommitInFlight.current) setStructuralPreview(undefined);
  }, [catalog, fullBindings, model, targetOptions, version]);

  const saveSimple = async (binding: DimmerBindingModel): Promise<void> => {
    const full = fullBindings.find((candidate) => candidate.id === binding.id);
    const draft = drafts[binding.id];
    const ruleId = binding.advanced.ruleId;
    const actionIndex = binding.advanced.actionIndex;
    const targetOption = draft && targetOptions.find((option) => resourceKey(option.ref) === draft.targetKey);
    const target = targetOption?.ref;
    if (!full || !draft || !ruleId || actionIndex === undefined || !target) {
      setMessage("This binding is no longer available for editing. Refresh the bridge and try again.");
      return;
    }
    try {
      if (!full.simpleForm) {
        setMessage("This binding has no complete catalog characterization for simple editing.");
        return;
      }
      const actionForm = full.simpleForm.actions.find((candidate) => candidate.kind === draft.kind && candidate.targetKinds.includes(target.kind as "light" | "group" | "scene"));
      const action = buildDimmerRuleAction({ kind: draft.kind, target, targetDetails: targetOption?.scene, fields: draft.fields, form: full.simpleForm });
      if (!actionForm) {
        setMessage("The selected action/target combination is not characterized for this gesture.");
        return;
      }
      const edit: SimpleDimmerBindingEdit = {
        sensorId: requestedSensorId || model.advanced.sensorIds[0] || "",
        catalogId: model.catalogId || "",
        controlId: full.controlId,
        ...(full.gestureId ? { gestureId: full.gestureId } : {}),
        event: full.event ?? 0,
        ruleId,
        conditionIndex: full.advanced.conditionIndex ?? 0,
        actionIndex,
        action,
        characterization: full.simpleForm,
        deviceKey: model.deviceKey,
      };
      const saveMethod = (runtime.service as typeof runtime.service & {
        saveSimpleBinding?: (value: SimpleDimmerBindingEdit) => Promise<CommandResult>;
      }).saveSimpleBinding;
      if (!saveMethod) {
        setMessage("Simple dimmer editing is unavailable; refresh the bridge and try again.");
        return;
      }
      const result = await saveMethod.call(runtime.service, edit);
      setMessage(result.kind === "success" ? "Binding saved and refreshed." : result.diagnostic?.message || "Binding was not saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Binding was not saved.");
    }
  };

  const updateDraft = (bindingId: string, update: Partial<ActionDraft>, replaceFields = false): void => {
    setDrafts((current) => {
      const existing = current[bindingId];
      const fields = Object.prototype.hasOwnProperty.call(update, "fields")
        ? mergeActionFields(existing?.fields, update.fields, replaceFields)
        : undefined;
      const next = { ...existing, ...update, ...(fields ? { fields } : {}) } as ActionDraft;
      return { ...current, [bindingId]: next };
    });
  };

  const renderEditable = (binding: DimmerBindingView): JSX.Element | null => {
    if (!binding.editable || binding.classification !== "editable_simple") return null;
    const full = fullBindings.find((candidate) => candidate.id === binding.id);
    const draft = drafts[binding.id];
    if (!full || !draft) return null;
    const simpleForm = full.simpleForm;
    if (!simpleForm) return <ReadOnlyField label="Simple action" value="This binding has no complete catalog characterization." />;
    const permittedTargetOptions = targetOptions.filter((option) => simpleForm.actions.some((candidate) => candidate.targetKinds.includes(option.ref.kind as "light" | "group" | "scene")));
    const selectedTarget = permittedTargetOptions.find((option) => resourceKey(option.ref) === draft.targetKey);
    const targetLabels = uniqueOptionLabels(permittedTargetOptions);
    const selectedTargetLabel = targetLabels.find((option) => option.key === draft.targetKey)?.label || selectedTarget?.label || "Choose a target";
    const actionOptions = simpleForm.actions
      .filter((candidate) => !selectedTarget || candidate.targetKinds.includes(selectedTarget.ref.kind as "light" | "group" | "scene"))
      .map((candidate) => ({ value: candidate.kind, label: actionLabel(candidate.kind), form: candidate }));
    if (actionOptions.length === 0) return <ReadOnlyField label="Simple action" value="No characterized action is available for the current target." />;
    const selectedAction = actionOptions.find((option) => option.value === draft.kind) || actionOptions[0];
    const selectedActionLabel = selectedAction.label;
    return <View style={styles.editPanel} testID={`dimmer-edit-${binding.id}`}>
      <EditorChoice
        label="Action"
        onChange={(next) => {
          const option = actionOptions.find((candidate) => candidate.label === next);
          const kind = option?.value || draft.kind;
          updateDraft(binding.id, { kind, fields: fieldsForAction(kind, selectedTarget?.ref, snapshot, option?.form) }, true);
        }}
        options={actionOptions.map((option) => option.label)}
        testID={`dimmer-action-${binding.id}`}
        value={selectedActionLabel}
      />
      <EditorChoice
        label="Target"
        onChange={(next) => {
          const target = targetLabels.find((option) => option.label === next);
          if (!target) return;
          const targetRef = targetOptions.find((option) => resourceKey(option.ref) === target.key)?.ref;
          if (!targetRef) return;
          const option = simpleForm.actions.find((candidate) => candidate.kind === draft.kind && candidate.targetKinds.includes(targetRef.kind as "light" | "group" | "scene"))
            || simpleForm.actions.find((candidate) => candidate.targetKinds.includes(targetRef.kind as "light" | "group" | "scene"));
          if (!option) return;
          updateDraft(binding.id, { targetKey: target.key, kind: option.kind, fields: fieldsForAction(option.kind, targetRef, snapshot, option) }, true);
        }}
        options={targetLabels.map((option) => option.label)}
        testID={`dimmer-target-${binding.id}`}
        value={selectedTargetLabel}
      />
      {(draft.kind === "set" || draft.kind === "brighten" || draft.kind === "dim")
        && selectedTarget
        && (selectedTarget.ref.kind === "light" || selectedTarget.ref.kind === "group")
        && renderActionFields(binding.id, selectedTarget.ref.kind, draft.fields, selectedAction.form.fields, (key, value) => updateDraft(binding.id, { fields: { [key]: value } }))}
      <Pressable accessibilityRole="button" onPress={() => void saveSimple(full)} style={styles.save} testID={`dimmer-save-${binding.id}`}><Text style={styles.saveText}>Save</Text></Pressable>
    </View>;
  };

  const renderStructural = (binding: DimmerBindingView): JSX.Element | null => {
    if (binding.classification !== "recognized_structural" || !binding.structuralFormId || !model.catalogId) return null;
    const full = fullBindings.find((candidate) => candidate.id === binding.id);
    const form = findStructuralForm(catalog, model.catalogId, binding.structuralFormId);
    if (!form) return null;
    if (!binding.editable) return <ReadOnlyField label={form.label} value={binding.reason || "This structural form is not editable for the current snapshot."} />;
    if (!full || !form.editor || !form.buildChangeSet) {
      return <ReadOnlyField label={form.label} value="This characterized structural form has no local editor." />;
    }
    const values = structuralValues[binding.id] || {};
    return <View style={styles.editPanel} testID={`dimmer-structural-editor-${binding.id}`}>
      {renderStructuralEditor(binding.id, form.editor, values, targetOptions, (key, value) => {
        setStructuralValues((current) => ({
          ...current,
          [binding.id]: { ...(current[binding.id] || {}), [key]: value },
        }));
        setStructuralPreview(undefined);
        setMessage(undefined);
      })}
      <EditorAction
        label={`Review ${form.label}`}
        onPress={() => {
          const editWithoutChangeSet: StructuralDimmerEdit = {
            sensorId: requestedSensorId || model.advanced.sensorIds[0] || "",
            catalogId: model.catalogId,
            deviceKey: model.deviceKey,
            formId: form.id,
            controlId: full.controlId,
            ...(full.gestureId ? { gestureId: full.gestureId } : {}),
            event: full.event,
            ruleId: full.advanced.ruleId,
            conditionIndex: full.advanced.conditionIndex,
            actionIndex: full.advanced.actionIndex,
            bindingId: full.id,
            values,
          };
          const changeSet = full.advanced.ruleShape
            ? form.buildChangeSet?.({ edit: editWithoutChangeSet, model, binding: full, rule: full.advanced.ruleShape, snapshot })
            : undefined;
          if (!changeSet) {
            setMessage("This structural form is not available for the current snapshot.");
            return;
          }
          const edit: StructuralDimmerEdit = { ...editWithoutChangeSet, changeSet };
          const preview = runtime.service.previewStructuralEdit(edit);
          if (!preview.allowed) {
            setMessage(preview.reason);
            return;
          }
          setStructuralPreview({ edit, changeSet: preview.changeSet });
          setMessage(undefined);
        }}
        testID={`dimmer-structural-${binding.id}`}
      />
    </View>;
  };

  // Concrete operations are intentionally not accepted from navigation
  // params. A structural change must come from the recognized catalog form
  // rendered above, for this model and this binding.
  const structuralEdit = structuralPreview;
  return <Screen title="Configure Dimmer">
    <Text style={styles.deviceName}>{model.displayName}</Text>
    {model.modelLabel && <Text style={styles.subtitle}>{model.modelLabel}</Text>}
    {!model.recognized && <View accessibilityRole="alert" style={styles.warning}><Text style={styles.warningText}>{model.reason || "This physical dimmer cannot be identified from the current snapshot."}</Text><Text style={styles.warningText}>Configure Dimmer is inspection-only until the model is characterized.</Text></View>}
    {model.recognized && <EditorSection title="Controls and gestures">
      {model.controls.map((control) => <View key={control.id} style={styles.control} testID={`dimmer-control-${control.id}`}>
        <Text style={styles.controlTitle}>{control.label}</Text>
        {control.gestures.map((binding) => <React.Fragment key={binding.id}>
          <DimmerControlRow binding={binding} />
          {renderEditable(binding)}
          {renderStructural(binding)}
        </React.Fragment>)}
      </View>)}
      {model.controls.length === 0 && <ReadOnlyField label="Controls" value="No characterized controls are available." />}
    </EditorSection>}
    {!model.recognized && <EditorSection title="Inspection">
      {model.rows.map((binding) => <DimmerControlRow binding={binding} key={binding.id} />)}
    </EditorSection>}
    {structuralEdit && <DimmerStructuralChangePreview
      changeSet={structuralEdit.changeSet}
      onCommit={async (): Promise<StructuralCommitReport | CommandResult> => {
        const service = runtime.service as typeof runtime.service & { commitStructuralEdit?: (value: StructuralDimmerEdit) => Promise<StructuralCommitReport> };
        if (!service.commitStructuralEdit) {
          return { kind: "definite_failure" as const, diagnostic: { category: "Unknown", message: "Structural editing is unavailable." } };
        }
        structuralCommitInFlight.current = true;
        try {
          const result = await service.commitStructuralEdit(structuralEdit.edit);
          setMessage(result.kind === "success" ? "Structural change applied and refreshed." : result.diagnostic?.message || "Structural change stopped; state was refreshed.");
          return result;
        } finally {
          structuralCommitInFlight.current = false;
        }
      }}
    />}
    {message && <Text accessibilityRole="alert" style={styles.message}>{message}</Text>}
    <ExpandableAdvancedSection summary={`${model.advanced.bindings.length} binding(s), ${model.advanced.resourceRefs.length} exact reference(s)`} testID="dimmer-advanced">
      <ReadOnlyField label="Sensor IDs" value={model.advanced.sensorIds} />
      <ReadOnlyField label="Helper Sensor IDs" value={model.advanced.helperSensorIds} />
      <ReadOnlyField label="Raw button events" value={model.advanced.rawEvents} />
      <ReadOnlyField label="Exact referenced resources" value={model.advanced.references} />
      <ReadOnlyField label="Rule IDs" value={model.advanced.ruleIds} />
      <ReadOnlyField label="Schedule IDs" value={model.advanced.scheduleIds} />
      <ReadOnlyField label="Resource Link IDs" value={model.advanced.resourceLinkIds} />
      <ReadOnlyField label="Creator provenance" value={model.advanced.creatorProvenance} />
      {model.advanced.bindings.map((binding) => <View key={binding.id} style={styles.advancedBinding} testID={`dimmer-advanced-binding-${binding.id}`}>
        <ReadOnlyField label="Binding" value={`${binding.controlLabel} — ${binding.gestureLabel}`} />
        <ReadOnlyField label="Status" value={binding.classification} />
        {binding.reason && <ReadOnlyField label="Why" value={binding.reason} />}
        {binding.advanced.sensorIds.map((id) => <Pressable accessibilityRole="button" key={`sensor-${id}`} onPress={() => navigation?.navigate?.("SensorEditor", { id })} style={styles.link}><Text style={styles.linkText}>Inspect Sensor {id}</Text></Pressable>)}
        {binding.advanced.ruleId && <Pressable accessibilityRole="button" onPress={() => navigation?.navigate?.("RuleEditor", { id: binding.advanced.ruleId })} style={styles.link}><Text style={styles.linkText}>Inspect Rule {binding.advanced.ruleId}</Text></Pressable>}
      </View>)}
    </ExpandableAdvancedSection>
  </Screen>;
}

function renderActionFields(
  bindingId: string,
  kind: "light" | "group",
  fields: Record<string, unknown>,
  allowedFields: readonly string[],
  update: (key: string, value: unknown) => void,
): JSX.Element {
  const values = fields;
  return <View testID={`dimmer-fields-${bindingId}`}>
    {allowedFields.includes("on") && <EditorToggle label="Power" onValueChange={(value) => update("on", value)} testID={`dimmer-${bindingId}-on`} value={values.on === true} />}
    {allowedFields.includes("bri") && <EditorCatalogNumberField fieldKey="bri" label="Brightness" onChange={(value) => update("bri", value)} testID={`dimmer-${bindingId}-bri`} value={numberValue(values.bri)} />}
    {allowedFields.includes("hue") && <EditorHueField label="Hue color" onChange={(value) => update("hue", value)} testID={`dimmer-${bindingId}-hue`} value={numberValue(values.hue)} />}
    {allowedFields.includes("sat") && <EditorCatalogNumberField fieldKey="sat" label="Saturation" onChange={(value) => update("sat", value)} testID={`dimmer-${bindingId}-sat`} value={numberValue(values.sat)} />}
    {allowedFields.includes("xy") && <EditorXyColorField label="XY color" onChangeText={(value) => update("xy", parsePair(value))} testID={`dimmer-${bindingId}-xy`} value={pairValue(values.xy)} />}
    {allowedFields.includes("ct") && <EditorCatalogNumberField fieldKey="ct" label="Color temperature" onChange={(value) => update("ct", value)} testID={`dimmer-${bindingId}-ct`} value={numberValue(values.ct)} />}
    {allowedFields.includes("bri_inc") && <EditorCatalogNumberField fieldKey="bri_inc" label="Brightness step" onChange={(value) => update("bri_inc", value)} testID={`dimmer-${bindingId}-bri-inc`} value={relativeNumberValue(values.bri_inc)} />}
    {allowedFields.includes("alert") && <EditorChoice label="Alert" onChange={(value) => update("alert", value)} options={["none", "select", "lselect"]} testID={`dimmer-${bindingId}-alert`} value={stringValue(values.alert, "none")} />}
    {allowedFields.includes("effect") && <EditorChoice label="Effect" onChange={(value) => update("effect", value)} options={["none", "colorloop"]} testID={`dimmer-${bindingId}-effect`} value={stringValue(values.effect, "none")} />}
    {allowedFields.includes("transitiontime") && <EditorCatalogNumberField fieldKey="transitiontime" label="Transition duration" onChange={(value) => update("transitiontime", value)} testID={`dimmer-${bindingId}-transitiontime`} value={numberValue(values.transitiontime)} />}
    {allowedFields.length === 0 && <Text style={styles.hint}>{kind === "light" || kind === "group" ? "Choose a supported value when needed." : "No editable fields."}</Text>}
  </View>;
}

function findStructuralForm(catalog: DimmerModelCatalog, catalogId: string, formId: string): DimmerStructuralForm | undefined {
  return catalog.models.find((entry) => entry.id === catalogId)?.structuralForms?.find((form) => form.id === formId);
}

function renderStructuralEditor(
  bindingId: string,
  editor: DimmerStructuralEditor,
  values: Record<string, unknown>,
  targetOptions: readonly { readonly ref: ResourceRef; readonly label: string }[],
  update: (key: string, value: unknown) => void,
): JSX.Element {
  if (editor.kind !== "scene_cycle") return <Text style={styles.hint}>This structural form is not supported by this app version.</Text>;
  const count = editor.sceneCount;
  if (!Number.isInteger(count) || (count as number) < 2) return <Text style={styles.hint}>This Scene cycle form has no valid scene-slot characterization.</Text>;
  const slotCount = count as number;
  const scenes = uniqueOptionLabels(targetOptions.filter((option) => option.ref.kind === "scene"))
    .map((scene) => ({ ...scene, key: scene.key.replace(/^scene:/, "") }));
  if (scenes.length === 0) return <Text style={styles.hint}>No Scene targets are available in the current snapshot.</Text>;
  const selected = Array.isArray(values.sceneIds) ? values.sceneIds.map((value) => typeof value === "string" ? value : "") : [];
  const options = ["Choose a scene", ...scenes.map((scene) => scene.label)];
  return <View testID={`dimmer-structural-fields-${bindingId}`}>
    {Array.from({ length: slotCount }, (_unused, index) => {
      const selectedKey = selected[index] || "";
      const selectedLabel = scenes.find((scene) => scene.key === selectedKey)?.label || options[0];
      return <EditorChoice
        key={`scene-slot-${index}`}
        label={`Scene ${index + 1}`}
        onChange={(next) => {
          const scene = scenes.find((candidate) => candidate.label === next);
          const nextSelected = [...selected];
          nextSelected[index] = scene?.key || "";
          update("sceneIds", nextSelected);
        }}
        options={options}
        testID={`dimmer-${bindingId}-scene-${index}`}
        value={selectedLabel}
      />;
    })}
  </View>;
}

function uniqueOptionLabels(options: readonly { readonly ref: ResourceRef; readonly label: string }[]): readonly { readonly key: string; readonly label: string }[] {
  const seen = new Map<string, number>();
  return options.map((option) => {
    const base = `${capitalize(option.ref.kind)}: ${option.label}`;
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return { key: resourceKey(option.ref), label: count === 1 ? base : `${base} (${count})` };
  });
}

function resourceKey(ref: ResourceRef): string { return `${ref.kind}:${ref.id || ""}`; }
function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
function actionLabel(kind: DimmerActionKind): string {
  switch (kind) {
    case "on": return "Turn on";
    case "off": return "Turn off";
    case "set": return "Set light/group values";
    case "brighten": return "Brighten while held";
    case "dim": return "Dim while held";
    case "activate": return "Activate Scene";
    case "cycle": return "Cycle scenes";
  }
}
function numberValue(value: unknown): number | undefined { return typeof value === "number" ? value : undefined; }
function relativeNumberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.abs(value) : undefined;
}

function mergeActionFields(
  existing: Record<string, unknown> | undefined,
  update: Record<string, unknown> | undefined,
  replace: boolean,
): Record<string, unknown> {
  const next = replace ? {} : { ...(existing || {}) };
  Object.entries(update || {}).forEach(([key, value]) => {
    if (value === undefined) delete next[key];
    else next[key] = value;
  });
  return next;
}
function stringValue(value: unknown, fallback: string): string { return typeof value === "string" ? value : fallback; }
function pairValue(value: unknown): string { return Array.isArray(value) && value.length === 2 ? value.join(",") : ""; }
function parsePair(value: string): number[] | undefined {
  if (!value.trim()) return undefined;
  return value.split(",").map((part) => Number(part.trim()));
}

function fieldsForAction(
  kind: DimmerActionKind,
  target: ResourceRef | undefined,
  snapshot: ReturnType<typeof snapshotFromStateStore>,
  form?: DimmerSimpleActionForm,
): Record<string, unknown> {
  const allowedFields = form?.fields || [];
  if (kind === "on") return allowedFields.includes("on") ? { on: true } : {};
  if (kind === "off") return allowedFields.includes("on") ? { on: false } : {};
  if (kind === "brighten" || kind === "dim") return allowedFields.includes("bri_inc") ? { bri_inc: 25 } : {};
  if (kind === "set") return seedSetFields(target, snapshot, allowedFields);
  return {};
}

function initialSceneIds(
  binding: DimmerBindingModel,
  count: number | undefined,
  targetOptions: readonly { readonly ref: ResourceRef; readonly label: string }[],
): string[] {
  if (!Number.isInteger(count) || (count as number) < 2) return [];
  const available = new Set(targetOptions.filter((option) => option.ref.kind === "scene").map((option) => option.ref.id || ""));
  const referenced = binding.advanced.references
    .filter((reference): reference is Extract<typeof reference, { readonly status: "recognized" }> => reference.status === "recognized" && reference.kind === "scene" && Boolean(reference.ref.id) && available.has(reference.ref.id || ""))
    .map((reference) => reference.ref.id || "");
  return Array.from({ length: count as number }, (_unused, index) => referenced[index] || "");
}

function seedSetFields(
  target: ResourceRef | undefined,
  snapshot: ReturnType<typeof snapshotFromStateStore>,
  allowedFields: readonly string[],
): Record<string, unknown> {
  if (!target || (target.kind !== "light" && target.kind !== "group") || !target.id) return { on: false };
  const collection = target.kind === "light" ? snapshot.lights : snapshot.groups;
  const raw = collection[target.id];
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const stateKey = target.kind === "light" ? "state" : "action";
  const current = value[stateKey] && typeof value[stateKey] === "object" && !Array.isArray(value[stateKey]) ? value[stateKey] as Record<string, unknown> : {};
  const supported = ["on", "bri", "hue", "sat", "xy", "ct", "alert", "effect", "transitiontime"]
    .filter((key) => allowedFields.includes(key));
  const fields = supported.reduce((result, key) => {
    if (current[key] !== undefined) result[key] = current[key];
    return result;
  }, {} as Record<string, unknown>);
  return fields;
}

const styles = StyleSheet.create({
  deviceName: { color: "#fdf6e3", fontSize: 21, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: "#93a1a1", marginBottom: 8 },
  warning: { backgroundColor: "#3d1f1f", borderColor: "#dc322f", borderRadius: 8, borderWidth: 1, marginTop: 10, padding: 10 },
  warningText: { color: "#fdf6e3", lineHeight: 19 },
  control: { marginBottom: 10 },
  controlTitle: { color: "#fdf6e3", fontSize: 16, fontWeight: "700", marginBottom: 6 },
  editPanel: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, marginBottom: 12, padding: 10 },
  save: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, marginTop: 4, padding: 10 },
  saveText: { color: "#fff", fontWeight: "700" },
  hint: { color: "#93a1a1", marginBottom: 8 },
  message: { color: "#b58900", marginTop: 10 },
  advancedBinding: { borderTopColor: "#586e75", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 8 },
  link: { alignSelf: "flex-start", paddingVertical: 5 },
  linkText: { color: "#268bd2", textDecorationLine: "underline" },
});
