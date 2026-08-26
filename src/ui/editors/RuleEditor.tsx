import React, { useState } from "react";
import { EditorAction, EditorChoice, EditorNumberField, EditorSection, EditorTextField, EditorToggle, ReadOnlyField } from "./editorControls";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
import { HueRuleAction, HueRuleCondition, HUE_RULE_CONDITION_OPERATORS } from "../../protocol/hue/catalog/rules";
import { buildRuleActionFromTarget, buildRuleConditionFromSensor, getHueActionFields, prepareHueMutationPayload, validateHueCatalogPayload } from "../../protocol/hue/catalog/resourceCatalog";
import { HueCatalogField } from "../../protocol/hue/catalog/resourceCatalog";
import { DeviceStateStore } from "../../app/DeviceStateStore";
import { definiteFailure } from "../../app/commandResults";
import { diagnostic } from "../../app/diagnostics";

interface ConditionRow {
  readonly sensorId: string;
  readonly event: string;
  readonly operator: HueRuleCondition["operator"];
  readonly value: string;
  readonly raw?: HueRuleCondition;
}

type RuleActionTargetKind = "light" | "group" | "scene";
type RuleActionOperation = "on" | "off" | "set" | "activate";

interface ActionRow {
  readonly targetKind: RuleActionTargetKind;
  readonly targetId: string;
  readonly operation: RuleActionOperation;
  readonly body: Record<string, unknown>;
  readonly raw?: HueRuleAction;
}

const OPERATORS = ["eq", "neq", "gt", "lt", "dx", "stable", "ddx", "in", "not in"] as const;
const CONDITION_EVENTS = ["state.buttonevent", "state.presence", "state.temperature", "state.lightlevel", "config.on"] as const;

export function RuleEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const stored = id ? runtime.service.stateStore.get({ kind: "rule", id }) : undefined;
  const value = stored?.state.status === "known" ? stored.state.value as {
    name?: string;
    owner?: string;
    status?: string;
    lasttriggered?: string;
    timestriggered?: number;
    conditions?: readonly HueRuleCondition[];
    actions?: readonly HueRuleAction[];
  } : undefined;
  const original = value as Record<string, unknown> | undefined;
  const initialConditions = (value?.conditions || []).map(toConditionRow);
  const initialActions = (value?.actions || []).map(toActionRow);
  const [conditions, setConditions] = useState<ConditionRow[]>(initialConditions.length > 0 ? initialConditions : [newConditionRow()]);
  const [actions, setActions] = useState<ActionRow[]>(initialActions.length > 0 ? initialActions : [newActionRow()]);
  const [preview, setPreview] = useState<string>();

  const buildDraft = (name?: string): Record<string, unknown> => ({
    ...(name === undefined ? {} : { name }),
    conditions: conditions.map((row) => row.raw || buildRuleConditionFromSensor(row.sensorId.trim(), row.event, row.operator, row.value === "" ? undefined : row.value)),
    actions: actions.map((row) => row.raw || buildRuleActionFromTarget(row.targetKind, row.targetId.trim(), row.operation, row.body)),
  });

  const save = async (name: string) => {
    try {
      const draft = buildDraft(name);
      return id
        ? runtime.service.mutateHue("rule", id, "update", draft)
        : runtime.service.createHue("rule", { ...draft, status: "disabled" });
    } catch (error) {
      return definiteFailure(diagnostic("ProtocolRejected", error instanceof Error ? error.message : "The Rule form is incomplete."));
    }
  };

  const showPreview = () => {
    try {
      const draft = buildDraft();
      if (id) {
        const result = prepareHueMutationPayload("rule", "update", original, draft);
        if (!result.allowed) {
          setPreview(`Cannot preview: ${result.reason}`);
          return;
        }
        setPreview(JSON.stringify(result.payload, null, 2));
      } else {
        const result = validateHueCatalogPayload("rule", "create", draft);
        if (!result.allowed) {
          setPreview(`Cannot preview: ${result.reason}`);
          return;
        }
        setPreview(JSON.stringify(draft, null, 2));
      }
    } catch (error) {
      setPreview(`Cannot preview: ${error instanceof Error ? error.message : "The Rule form is incomplete."}`);
    }
  };

  return <EditorForm
    id={id}
    kind="rule"
    navigation={navigation}
    note="Rules use catalog-backed Sensor conditions and Light/Group/Scene action controls. Unsupported existing entries can be replaced or removed; no raw JSON write path is provided. Preview validates the exact changed fields before saving."
    onSave={save}
    title="Rule Editor"
  >
    <EditorSection title="Rule metadata">
      <ReadOnlyField label="Owner" value={value?.owner} />
      <ReadOnlyField label="Status" value={value?.status} />
      <ReadOnlyField label="Last triggered" value={value?.lasttriggered} />
      <ReadOnlyField label="Times triggered" value={value?.timestriggered} />
    </EditorSection>
    <EditorSection title="Conditions">
      {conditions.length === 0 && <ReadOnlyField label="Conditions" value="No conditions. Add one before saving." />}
      {conditions.map((condition, index) => <React.Fragment key={`condition-${index}`}>
        {condition.raw ? <>
          <ReadOnlyField label={`Condition ${index + 1} (unrecognized)`} value={`${condition.raw.address} ${condition.raw.operator}${condition.raw.value ? ` ${condition.raw.value}` : ""}`} />
          <EditorAction label="Replace condition" onPress={() => setConditions((current) => current.map((row, rowIndex) => rowIndex === index ? newConditionRow() : row))} testID={`rule-condition-${index}-replace`} />
        </> : <>
          <ReadOnlyField label={`Condition ${index + 1} Sensor reference`} value={resourceLabel(runtime.service.stateStore, "sensor", condition.sensorId)} />
          <EditorTextField label={`Condition ${index + 1} Sensor ID`} onChangeText={(sensorId) => updateCondition(setConditions, index, { sensorId })} placeholder="1" testID={`rule-condition-${index}-sensor`} value={condition.sensorId} />
          <EditorChoice label={`Condition ${index + 1} event`} onChange={(event) => updateCondition(setConditions, index, { event })} options={CONDITION_EVENTS} testID={`rule-condition-${index}-event`} value={condition.event} />
          <EditorChoice label={`Condition ${index + 1} operator`} onChange={(operator) => updateCondition(setConditions, index, { operator: operator as ConditionRow["operator"] })} options={OPERATORS} testID={`rule-condition-${index}-operator`} value={condition.operator} />
          <EditorTextField label={`Condition ${index + 1} value`} onChangeText={(valueText) => updateCondition(setConditions, index, { value: valueText })} placeholder="100" testID={`rule-condition-${index}-value`} value={condition.value} />
        </>}
        <EditorAction label="Remove condition" onPress={() => removeRow(setConditions, index)} testID={`rule-condition-${index}-remove`} />
      </React.Fragment>)}
      <EditorAction label="Add condition" onPress={() => setConditions((current) => [...current, newConditionRow()])} testID="rule-add-condition" />
    </EditorSection>
    <EditorSection title="Actions">
      {actions.length === 0 && <ReadOnlyField label="Actions" value="No actions. Add one before saving." />}
      {actions.map((action, index) => <React.Fragment key={`action-${index}`}>
        {action.raw ? <>
          <ReadOnlyField label={`Action ${index + 1} (unrecognized)`} value={`${action.raw.method} ${action.raw.address}${action.raw.body ? ` ${JSON.stringify(action.raw.body)}` : ""}`} />
          <EditorAction label="Replace action" onPress={() => setActions((current) => current.map((row, rowIndex) => rowIndex === index ? newActionRow() : row))} testID={`rule-action-${index}-replace`} />
        </> : <>
          <ReadOnlyField label={`Action ${index + 1} target reference`} value={resourceLabel(runtime.service.stateStore, action.targetKind, action.targetId)} />
          <EditorChoice label={`Action ${index + 1} target`} onChange={(targetKind) => changeActionTarget(setActions, index, targetKind as RuleActionTargetKind)} options={["light", "group", "scene"]} testID={`rule-action-${index}-target`} value={action.targetKind} />
          <EditorTextField label={`Action ${index + 1} resource ID`} onChangeText={(targetId) => updateAction(setActions, index, { targetId })} placeholder="1" testID={`rule-action-${index}-id`} value={action.targetId} />
          <EditorChoice label={`Action ${index + 1} operation`} onChange={(operation) => changeActionOperation(setActions, index, operation as RuleActionOperation)} options={action.targetKind === "scene" ? ["activate"] : ["on", "off", "set"]} testID={`rule-action-${index}-operation`} value={action.operation} />
          {action.targetKind !== "scene" && getHueActionFields(action.targetKind).map((field) => renderActionField(action, index, field, setActions))}
        </>}
        <EditorAction label="Remove action" onPress={() => removeRow(setActions, index)} testID={`rule-action-${index}-remove`} />
      </React.Fragment>)}
      <EditorAction label="Add action" onPress={() => setActions((current) => [...current, newActionRow()])} testID="rule-add-action" />
    </EditorSection>
    <EditorAction label="Preview rule changes" onPress={showPreview} testID="rule-preview" />
    {preview !== undefined && <ReadOnlyField label="Rule change preview" value={preview} />}
  </EditorForm>;
}

function newConditionRow(): ConditionRow {
  return { sensorId: "", event: "state.buttonevent", operator: "eq", value: "" };
}

function newActionRow(): ActionRow {
  return { targetKind: "light", targetId: "", operation: "on", body: { on: true } };
}

function updateCondition(setter: React.Dispatch<React.SetStateAction<ConditionRow[]>>, index: number, update: Partial<ConditionRow>): void {
  setter((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...update, raw: undefined } : row));
}

function updateAction(setter: React.Dispatch<React.SetStateAction<ActionRow[]>>, index: number, update: Partial<ActionRow>): void {
  setter((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...update, raw: undefined } : row));
}

function changeActionTarget(setter: React.Dispatch<React.SetStateAction<ActionRow[]>>, index: number, targetKind: RuleActionTargetKind): void {
  setter((current) => current.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    if (targetKind === "scene") return { ...row, targetKind, operation: "activate", body: {}, raw: undefined };
    return { ...row, targetKind, operation: row.operation === "activate" ? "on" : row.operation, body: Object.keys(row.body).length > 0 ? row.body : { on: true }, raw: undefined };
  }));
}

function changeActionOperation(setter: React.Dispatch<React.SetStateAction<ActionRow[]>>, index: number, operation: RuleActionOperation): void {
  setter((current) => current.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    const body = { ...row.body };
    if (operation === "on" || operation === "off") body.on = operation === "on";
    return { ...row, operation, body, raw: undefined };
  }));
}

function updateActionField(setter: React.Dispatch<React.SetStateAction<ActionRow[]>>, index: number, key: string, value: unknown): void {
  setter((current) => current.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    const body = { ...row.body };
    if (value === undefined) delete body[key];
    else body[key] = value;
    return { ...row, body, operation: row.operation === "on" || row.operation === "off" ? row.operation : "set", raw: undefined };
  }));
}

function removeRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number): void {
  setter((current) => current.filter((_row, rowIndex) => rowIndex !== index));
}

function renderActionField(
  action: ActionRow,
  index: number,
  field: HueCatalogField,
  setter: React.Dispatch<React.SetStateAction<ActionRow[]>>,
): JSX.Element {
  const key = field.path.slice(field.path.indexOf(".") + 1);
  const label = `Action ${index + 1} ${field.description}`;
  const value = action.body[key];
  if (field.type === "boolean") return <EditorToggle key={field.path} label={label} onValueChange={(next) => updateActionField(setter, index, key, next)} testID={`rule-action-${index}-${key}`} value={value === true} />;
  if (field.type === "number") return <EditorNumberField key={field.path} label={label} onChange={(next) => updateActionField(setter, index, key, next)} testID={`rule-action-${index}-${key}`} value={typeof value === "number" ? value : undefined} />;
  if (field.type === "enum") return <EditorChoice key={field.path} label={label} onChange={(next) => updateActionField(setter, index, key, next)} options={field.enumValues || []} testID={`rule-action-${index}-${key}`} value={typeof value === "string" ? value : field.enumValues?.[0] || ""} />;
  if (field.type === "number[]") return <EditorTextField key={field.path} label={`${label} (comma-separated)`} onChangeText={(next) => updateActionField(setter, index, key, parseNumberArray(next))} placeholder="0.4,0.5" testID={`rule-action-${index}-${key}`} value={Array.isArray(value) ? value.join(",") : ""} />;
  return <ReadOnlyField key={field.path} label={label} value={value} />;
}

function parseNumberArray(value: string): number[] | undefined {
  if (!value.trim()) return undefined;
  return value.split(",").map((entry) => Number(entry.trim()));
}

function toConditionRow(condition: HueRuleCondition): ConditionRow {
  const match = condition.address.match(/^(?:\/api\/[^/]+)?\/sensors\/([^/]+)\/(state|config)\/([^/]+)$/i);
  const event = match ? `${match[2]}.${match[3]}` : "";
  return match && CONDITION_EVENTS.includes(event as typeof CONDITION_EVENTS[number]) && HUE_RULE_CONDITION_OPERATORS.includes(condition.operator as never)
    ? { sensorId: safeDecode(match[1]), event, operator: condition.operator, value: condition.value || "" }
    : { sensorId: "", event: "state.buttonevent", operator: condition.operator, value: condition.value || "", raw: condition };
}

function toActionRow(action: HueRuleAction): ActionRow {
  const scene = action.body?.scene;
  const sceneMatch = action.address.match(/^(?:\/api\/[^/]+)?\/groups\/0\/action$/i);
  const match = action.address.match(/^(?:\/api\/[^/]+)?\/(lights|groups)\/([^/]+)\/(state|action)$/i);
  if (sceneMatch && action.method.toUpperCase() === "PUT" && typeof scene === "string" && /^\d+$/.test(scene)) return { targetKind: "scene", targetId: scene, operation: "activate", body: {} };
  if (match && action.method.toUpperCase() === "PUT" && action.body && typeof action.body === "object" && !Array.isArray(action.body)) {
    const targetKind = match[1].toLowerCase() === "lights" ? "light" : "group";
    const expectedSubpath = targetKind === "light" ? "state" : "action";
    if (match[3].toLowerCase() === expectedSubpath && validateHueCatalogPayload(targetKind, "action", action.body).allowed) {
      const body = { ...action.body };
      const operation = Object.keys(body).length === 1 && typeof body.on === "boolean" ? (body.on ? "on" : "off") : "set";
      return { targetKind, targetId: safeDecode(match[2]), operation, body };
    }
  }
  return { targetKind: "light", targetId: "", operation: "set", body: {}, raw: action };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
}

function resourceLabel(stateStore: DeviceStateStore, kind: RuleActionTargetKind | "sensor", id: string): string {
  if (!id) return "Select a resource ID";
  const stored = stateStore.get({ kind, id });
  if (stored?.state.status === "known" && stored.state.value && typeof stored.state.value === "object") {
    const name = (stored.state.value as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return `${name} (ID ${id})`;
  }
  return `${kind} ${id} (label unavailable)`;
}
