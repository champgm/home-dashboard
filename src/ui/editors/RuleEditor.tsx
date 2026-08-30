import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { EditorAction, EditorCatalogNumberField, EditorChoice, EditorHueField, EditorSection, EditorSummaryRow, EditorTextField, EditorToggle, EditorXyColorField, ReadOnlyField } from "./editorControls";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
import { HueRuleAction, HueRuleCondition, HUE_RULE_CONDITION_OPERATORS } from "../../protocol/hue/catalog/rules";
import { buildRuleActionFromTarget, buildRuleConditionFromSensor, getHueActionFields, prepareHueMutationPayload, validateHueCatalogPayload } from "../../protocol/hue/catalog/resourceCatalog";
import { HueCatalogField } from "../../protocol/hue/catalog/resourceCatalog";
import { DeviceStateStore } from "../../app/DeviceStateStore";
import { definiteFailure } from "../../app/commandResults";
import { diagnostic } from "../../app/diagnostics";
import { ExpandableAdvancedSection } from "../components/ExpandableAdvancedSection";

interface ConditionRow {
  readonly sensorId: string;
  readonly event: string;
  readonly operator: HueRuleCondition["operator"];
  readonly value: string;
  readonly raw?: HueRuleCondition;
}

type RuleActionTargetKind = "light" | "group" | "scene";
type RuleActionOperation = "on" | "off" | "set" | "activate";
type RuleSceneType = "GroupScene" | "LightScene";

interface ActionRow {
  readonly targetKind: RuleActionTargetKind;
  readonly targetId: string;
  readonly operation: RuleActionOperation;
  readonly body: Record<string, unknown>;
  /** The Scene form controls the exact Hue action route. */
  readonly sceneType?: RuleSceneType;
  readonly sceneGroupId?: string;
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
  const initialActions = (value?.actions || []).map((action) => toActionRow(action, runtime.service.stateStore));
  const [conditions, setConditions] = useState<ConditionRow[]>(initialConditions.length > 0 ? initialConditions : [newConditionRow()]);
  const [actions, setActions] = useState<ActionRow[]>(initialActions.length > 0 ? initialActions : [newActionRow()]);
  const [expandedCondition, setExpandedCondition] = useState(-1);
  const [expandedAction, setExpandedAction] = useState(-1);
  const [preview, setPreview] = useState<string>();

  const buildDraft = (name?: string): Record<string, unknown> => ({
    ...(name === undefined ? {} : { name }),
    conditions: conditions.map((row) => row.raw || buildRuleConditionFromSensor(row.sensorId.trim(), row.event, row.operator, row.value === "" ? undefined : row.value)),
    actions: actions.map((row) => row.raw || buildRuleActionFromTarget(
      row.targetKind,
      row.targetId.trim(),
      row.operation,
      row.body,
      row.targetKind === "scene" ? sceneTargetDetails(runtime.service.stateStore, row) : undefined,
    )),
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
    note="Known conditions and actions are edited one at a time. Unsupported existing entries stay read-only until explicitly replaced."
    onSave={save}
    title="Rule Editor"
  >
    <EditorSection title="Conditions">
      {conditions.length === 0 && <ReadOnlyField label="Conditions" value="No conditions. Add one before saving." />}
      {conditions.map((condition, index) => <React.Fragment key={`condition-${index}`}>
        <EditorSummaryRow
          label={`Condition ${index + 1}`}
          onPress={() => setExpandedCondition((current) => current === index ? -1 : index)}
          testID={`rule-condition-${index}-summary`}
          value={conditionSummary(runtime.service.stateStore, condition)}
          expanded={expandedCondition === index}
        />
        {expandedCondition === index && <View style={styles.itemEditor} testID={`rule-condition-${index}-editor`}>
          {condition.raw ? <>
            <ReadOnlyField label="Unsupported condition path" value={`${condition.raw.address} ${condition.raw.operator}${condition.raw.value ? ` ${condition.raw.value}` : ""}`} />
            <EditorAction label="Replace condition" onPress={() => setConditions((current) => current.map((row, rowIndex) => rowIndex === index ? newConditionRow() : row))} testID={`rule-condition-${index}-replace`} />
          </> : <>
            <EditorTextField keyboardType="numeric" label="Sensor ID" onChangeText={(sensorId) => updateCondition(setConditions, index, { sensorId })} placeholder="1" testID={`rule-condition-${index}-sensor`} value={condition.sensorId} />
            <EditorChoice label="Event" onChange={(event) => updateCondition(setConditions, index, { event })} options={CONDITION_EVENTS} testID={`rule-condition-${index}-event`} value={condition.event} />
            <EditorChoice label="Operator" onChange={(operator) => updateCondition(setConditions, index, { operator: operator as ConditionRow["operator"] })} options={OPERATORS} testID={`rule-condition-${index}-operator`} value={condition.operator} />
            <EditorTextField label="Value" onChangeText={(valueText) => updateCondition(setConditions, index, { value: valueText })} placeholder="100" testID={`rule-condition-${index}-value`} value={condition.value} />
            <ReadOnlyField label="Exact Sensor reference" value={resourceLabel(runtime.service.stateStore, "sensor", condition.sensorId)} />
          </>}
          <EditorAction label="Remove condition" onPress={() => { removeRow(setConditions, index); setExpandedCondition((current) => current === index ? -1 : current); }} testID={`rule-condition-${index}-remove`} />
        </View>}
      </React.Fragment>)}
      <EditorAction label="Add condition" onPress={() => { setConditions((current) => { setExpandedCondition(current.length); return [...current, newConditionRow()]; }); }} testID="rule-add-condition" />
    </EditorSection>
    <EditorSection title="Actions">
      {actions.length === 0 && <ReadOnlyField label="Actions" value="No actions. Add one before saving." />}
      {actions.map((action, index) => <React.Fragment key={`action-${index}`}>
        <EditorSummaryRow
          label={`Action ${index + 1}`}
          onPress={() => setExpandedAction((current) => current === index ? -1 : index)}
          testID={`rule-action-${index}-summary`}
          value={actionSummary(runtime.service.stateStore, action)}
          expanded={expandedAction === index}
        />
        {expandedAction === index && <View style={styles.itemEditor} testID={`rule-action-${index}-editor`}>
          {action.raw ? <>
            <ReadOnlyField label="Unsupported action path" value={`${action.raw.method} ${action.raw.address}`} />
            <ExpandableAdvancedSection summary="The existing action body is preserved exactly" testID={`rule-action-${index}-advanced`}>
              <ReadOnlyField label="Existing action body" value={action.raw.body} />
            </ExpandableAdvancedSection>
            <EditorAction label="Replace action" onPress={() => setActions((current) => current.map((row, rowIndex) => rowIndex === index ? newActionRow() : row))} testID={`rule-action-${index}-replace`} />
          </> : <>
            <EditorChoice label="Target" onChange={(targetKind) => changeActionTarget(setActions, index, targetKind as RuleActionTargetKind)} options={["light", "group", "scene"]} testID={`rule-action-${index}-target`} value={action.targetKind} />
            <EditorTextField keyboardType={action.targetKind === "scene" ? "default" : "numeric"} label="Resource ID" onChangeText={(targetId) => updateActionTargetId(setActions, index, targetId, runtime.service.stateStore)} placeholder="1" testID={`rule-action-${index}-id`} value={action.targetId} />
            {action.targetKind === "scene" && <>
              <EditorChoice
                label="Scene type"
                onChange={(sceneType) => changeActionSceneType(setActions, index, sceneType as RuleSceneType)}
                options={["LightScene", "GroupScene"]}
                testID={`rule-action-${index}-scene-type`}
                value={action.sceneType || "LightScene"}
              />
              {(action.sceneType || "LightScene") === "GroupScene" && <EditorTextField
                keyboardType="numeric"
                label="Owning Group ID"
                onChangeText={(sceneGroupId) => updateAction(setActions, index, { sceneGroupId })}
                placeholder="3"
                testID={`rule-action-${index}-scene-group`}
                value={action.sceneGroupId || ""}
              />}
              <ReadOnlyField label="Exact Scene action path" value={sceneActionPath(action)} />
            </>}
            <EditorChoice label="Operation" onChange={(operation) => changeActionOperation(setActions, index, operation as RuleActionOperation)} options={action.targetKind === "scene" ? ["activate"] : ["on", "off", "set"]} testID={`rule-action-${index}-operation`} value={action.operation} />
            {action.targetKind !== "scene" && getHueActionFields(action.targetKind).map((field) => renderActionField(action, index, field, setActions))}
            <ReadOnlyField label="Exact target reference" value={resourceLabel(runtime.service.stateStore, action.targetKind, action.targetId)} />
          </>}
          <EditorAction label="Remove action" onPress={() => { removeRow(setActions, index); setExpandedAction((current) => current === index ? -1 : current); }} testID={`rule-action-${index}-remove`} />
        </View>}
      </React.Fragment>)}
      <EditorAction label="Add action" onPress={() => { setActions((current) => { setExpandedAction(current.length); return [...current, newActionRow()]; }); }} testID="rule-add-action" />
    </EditorSection>
    <EditorAction label="Preview rule changes" onPress={showPreview} testID="rule-preview" />
    {preview !== undefined && <ExpandableAdvancedSection defaultExpanded summary="Validated changed fields" testID="rule-preview-details">
      <ReadOnlyField label="Rule change preview" value={preview} />
    </ExpandableAdvancedSection>}
    <ExpandableAdvancedSection summary="Owner, status, and trigger history" testID="rule-advanced">
      <ReadOnlyField label="Owner" value={value?.owner} />
      <ReadOnlyField label="Status" value={value?.status} />
      <ReadOnlyField label="Last triggered" value={value?.lasttriggered} />
      <ReadOnlyField label="Times triggered" value={value?.timestriggered} />
    </ExpandableAdvancedSection>
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

function updateActionTargetId(
  setter: React.Dispatch<React.SetStateAction<ActionRow[]>>,
  index: number,
  targetId: string,
  stateStore: DeviceStateStore,
): void {
  setter((current) => current.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    if (row.targetKind !== "scene") return { ...row, targetId, raw: undefined };
    const metadata = sceneMetadataForId(stateStore, targetId.trim());
    return {
      ...row,
      targetId,
      sceneType: metadata?.type || "LightScene",
      sceneGroupId: metadata?.group || "0",
      raw: undefined,
    };
  }));
}

function changeActionSceneType(
  setter: React.Dispatch<React.SetStateAction<ActionRow[]>>,
  index: number,
  sceneType: RuleSceneType,
): void {
  setter((current) => current.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    if (sceneType === "LightScene") return { ...row, sceneType, sceneGroupId: "0", raw: undefined };
    return {
      ...row,
      sceneType,
      sceneGroupId: row.sceneType === "GroupScene" && row.sceneGroupId !== "0" ? row.sceneGroupId : "",
      raw: undefined,
    };
  }));
}

function changeActionTarget(setter: React.Dispatch<React.SetStateAction<ActionRow[]>>, index: number, targetKind: RuleActionTargetKind): void {
  setter((current) => current.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    if (targetKind === "scene") return { ...row, targetKind, operation: "activate", body: {}, sceneType: "LightScene", sceneGroupId: "0", raw: undefined };
    return { ...row, targetKind, operation: row.operation === "activate" ? "on" : row.operation, body: Object.keys(row.body).length > 0 ? row.body : { on: true }, sceneType: undefined, sceneGroupId: undefined, raw: undefined };
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
  if (field.type === "number" && key === "hue") return <EditorHueField key={field.path} label={label} onChange={(next) => updateActionField(setter, index, key, next)} showExact={false} testID={`rule-action-${index}-${key}`} value={typeof value === "number" ? value : undefined} />;
  if (field.type === "number") return <EditorCatalogNumberField fieldKey={key} key={field.path} label={label} onChange={(next) => updateActionField(setter, index, key, next)} showExact={false} testID={`rule-action-${index}-${key}`} value={typeof value === "number" ? value : undefined} />;
  if (field.type === "enum") return <EditorChoice key={field.path} label={label} onChange={(next) => updateActionField(setter, index, key, next)} options={field.enumValues || []} testID={`rule-action-${index}-${key}`} value={typeof value === "string" ? value : field.enumValues?.[0] || ""} />;
  if (field.type === "number[]" && key === "xy") return <EditorXyColorField key={field.path} label={label} onChangeText={(next) => updateActionField(setter, index, key, parseNumberArray(next))} showExact={false} testID={`rule-action-${index}-${key}`} value={Array.isArray(value) ? value.join(",") : ""} />;
  if (field.type === "number[]") return <EditorTextField key={field.path} label={`${label} (comma-separated)`} onChangeText={(next) => updateActionField(setter, index, key, parseNumberArray(next))} placeholder="0.4,0.5" testID={`rule-action-${index}-${key}`} value={Array.isArray(value) ? value.join(",") : ""} />;
  return <ReadOnlyField key={field.path} label={label} value={value} />;
}

function parseNumberArray(value: string): number[] | undefined {
  if (!value.trim()) return undefined;
  return value.split(",").map((entry) => Number(entry.trim()));
}

function conditionSummary(stateStore: DeviceStateStore, condition: ConditionRow): string {
  if (condition.raw) return `Unsupported path · ${condition.raw.address}`;
  const sensor = resourceLabel(stateStore, "sensor", condition.sensorId);
  return `${sensor} · ${condition.event} ${condition.operator}${condition.value ? ` ${condition.value}` : ""}`;
}

function actionSummary(stateStore: DeviceStateStore, action: ActionRow): string {
  if (action.raw) return `Unsupported path · ${action.raw.method} ${action.raw.address}`;
  const target = resourceLabel(stateStore, action.targetKind, action.targetId);
  const sceneRoute = action.targetKind === "scene"
    ? (action.sceneType || "LightScene") === "GroupScene"
      ? ` · GroupScene / Group ${action.sceneGroupId || "not set"}`
      : " · LightScene / Group 0"
    : "";
  const fields = Object.keys(action.body).filter((key) => key !== "on" || action.operation === "set");
  return `${action.operation} · ${target}${sceneRoute}${fields.length > 0 ? ` · ${fields.join(", ")}` : ""}`;
}

function toConditionRow(condition: HueRuleCondition): ConditionRow {
  const match = condition.address.match(/^(?:\/api\/[^/]+)?\/sensors\/([^/]+)\/(state|config)\/([^/]+)$/i);
  const event = match ? `${match[2]}.${match[3]}` : "";
  return match && CONDITION_EVENTS.includes(event as typeof CONDITION_EVENTS[number]) && HUE_RULE_CONDITION_OPERATORS.includes(condition.operator as never)
    ? { sensorId: safeDecode(match[1]), event, operator: condition.operator, value: condition.value || "" }
    : { sensorId: "", event: "state.buttonevent", operator: condition.operator, value: condition.value || "", raw: condition };
}

function toActionRow(action: HueRuleAction, stateStore: DeviceStateStore): ActionRow {
  const scene = action.body?.scene;
  const sceneMatch = action.address.match(/^(?:\/api\/[^/]+)?\/groups\/([^/]+)\/action$/i);
  const match = action.address.match(/^(?:\/api\/[^/]+)?\/(lights|groups)\/([^/]+)\/(state|action)$/i);
  const sceneGroupId = sceneMatch ? safeDecode(sceneMatch[1]) : undefined;
  const sceneId = typeof scene === "string" ? safeDecode(scene) : undefined;
  if (sceneMatch && sceneGroupId && /^\d+$/.test(sceneGroupId) && action.method.toUpperCase() === "PUT" && sceneId && !/[\/?#]/.test(sceneId) && Object.keys(action.body || {}).length === 1) {
    const metadata = sceneMetadataForId(stateStore, sceneId);
    const storedScene = stateStore.get({ kind: "scene", id: sceneId });
    if (storedScene?.state.status === "known" && !metadata) return unsupportedActionRow(action);
    if (metadata && metadata.group !== sceneGroupId) return unsupportedActionRow(action);
    return {
      targetKind: "scene",
      targetId: sceneId,
      operation: "activate",
      body: {},
      sceneType: metadata?.type || (sceneGroupId === "0" ? "LightScene" : "GroupScene"),
      sceneGroupId: metadata?.group || sceneGroupId,
    };
  }
  if (match && action.method.toUpperCase() === "PUT" && action.body && typeof action.body === "object" && !Array.isArray(action.body)) {
    const targetKind = match[1].toLowerCase() === "lights" ? "light" : "group";
    const expectedSubpath = targetKind === "light" ? "state" : "action";
    if (match[3].toLowerCase() === expectedSubpath && validateHueCatalogPayload(targetKind, "action", action.body).allowed) {
      const body = { ...action.body };
      const operation = Object.keys(body).length === 1 && typeof body.on === "boolean" ? (body.on ? "on" : "off") : "set";
      return { targetKind, targetId: safeDecode(match[2]), operation, body };
    }
  }
  return unsupportedActionRow(action);
}

function unsupportedActionRow(action: HueRuleAction): ActionRow {
  return { targetKind: "light", targetId: "", operation: "set", body: {}, raw: action };
}

function sceneMetadataForId(stateStore: DeviceStateStore, id: string): { readonly type: RuleSceneType; readonly group: string } | undefined {
  if (!id) return undefined;
  const stored = stateStore.get({ kind: "scene", id });
  if (stored?.state.status !== "known" || !stored.state.value || typeof stored.state.value !== "object" || Array.isArray(stored.state.value)) return undefined;
  const scene = stored.state.value as { readonly type?: unknown; readonly group?: unknown };
  if (scene.type === "LightScene") return { type: "LightScene", group: "0" };
  if (scene.type === "GroupScene" && typeof scene.group === "string" && /^\d+$/.test(scene.group)) return { type: "GroupScene", group: scene.group };
  return undefined;
}

function sceneTargetDetails(stateStore: DeviceStateStore, action: ActionRow): { readonly type: RuleSceneType; readonly group: string } {
  const sceneType = action.sceneType || "LightScene";
  const group = sceneType === "LightScene" ? "0" : action.sceneGroupId?.trim() || "";
  const id = action.targetId.trim();
  const stored = id ? stateStore.get({ kind: "scene", id }) : undefined;
  const metadata = sceneMetadataForId(stateStore, id);
  if (stored?.state.status === "known" && !metadata) throw new Error("The selected Scene has incomplete or unsupported type/owning Group metadata.");
  if (metadata && (metadata.type !== sceneType || metadata.group !== group)) throw new Error("The selected Scene type and owning Group do not match the selected Scene.");
  return { type: sceneType, group };
}

function sceneActionPath(action: ActionRow): string {
  if ((action.sceneType || "LightScene") === "GroupScene") return action.sceneGroupId?.trim() ? `/groups/${action.sceneGroupId.trim()}/action` : "Select an owning Group ID";
  return "/groups/0/action";
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

const styles = StyleSheet.create({
  itemEditor: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, marginBottom: 8, marginTop: 4, padding: 10 },
});
