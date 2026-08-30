import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { EditorAction, EditorCatalogNumberField, EditorChoice, EditorChoiceOption, EditorHueField, EditorNumberField, EditorResourceSelector, EditorSection, EditorSummaryRow, EditorTextField, EditorToggle, EditorXyColorField, ReadOnlyField } from "./editorControls";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
import { buildScheduleCommandFromTarget, getHueActionFields, getHueSensorConfigFields, HueCatalogField, validateHueCatalogPayload } from "../../protocol/hue/catalog/resourceCatalog";
import { HUE_WEEKDAYS, HueScheduleTimePattern, HueScheduleWeekday, StructuredScheduleCommand, validateScheduleTimePattern } from "../../protocol/hue/catalog/schedules";
import { definiteFailure } from "../../app/commandResults";
import { diagnostic } from "../../app/diagnostics";
import { DeviceStateStore } from "../../app/DeviceStateStore";
import { ExpandableAdvancedSection } from "../components/ExpandableAdvancedSection";

type PatternKind = "at" | "timer" | "recurring-daily" | "recurring-weekly" | "randomized";
type TargetKind = "light" | "group" | "scene" | "sensor";
type CommandOperation = "on" | "off" | "set" | "activate" | "read";

export function ScheduleEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const stored = id ? runtime.service.stateStore.get({ kind: "schedule", id }) : undefined;
  const value = stored?.state.status === "known" ? stored.state.value as { description?: string; autodelete?: boolean; timePattern?: HueScheduleTimePattern; timePatternRaw?: unknown; command?: StructuredScheduleCommand; created?: string; lasttriggered?: string; timestriggered?: number } : undefined;
  const initialPattern = value?.timePattern;
  const initialCommand = value?.command;
  const commandEditable = !id || (initialCommand !== undefined && isEditableCommand(initialCommand));
  const unsupportedTimePattern = value?.timePatternRaw !== undefined;
  const [description, setDescription] = useState(value?.description || "");
  const [patternKind, setPatternKind] = useState<PatternKind>(patternFrom(initialPattern));
  const [localtime, setLocaltime] = useState(initialPattern?.localtime || "");
  const [timer, setTimer] = useState(initialPattern?.time || "");
  const [starttime, setStarttime] = useState(initialPattern?.date || "");
  const [recurring, setRecurring] = useState(initialPattern?.recurring === true);
  const [weekdays, setWeekdays] = useState<HueScheduleWeekday[]>(initialPattern?.weekdays ? [...initialPattern.weekdays] : [...HUE_WEEKDAYS]);
  const [randomSeconds, setRandomSeconds] = useState<number | undefined>(initialPattern?.randomSeconds);
  const [autodelete, setAutodelete] = useState(value?.autodelete === true);
  const [targetKind, setTargetKind] = useState<TargetKind>(isTargetKind(initialCommand?.resourceKind) ? initialCommand!.resourceKind as TargetKind : "light");
  const [targetId, setTargetId] = useState(initialCommand?.resourceId || "");
  const [operation, setOperation] = useState<CommandOperation>(operationFrom(initialCommand));
  const [commandBody, setCommandBody] = useState<Record<string, unknown>>(initialCommand?.body ? { ...initialCommand.body } : { on: true });
  const [commandDirty, setCommandDirty] = useState(false);
  const [timePatternReplaced, setTimePatternReplaced] = useState(!unsupportedTimePattern);
  const [timeExpanded, setTimeExpanded] = useState(false);
  const [commandExpanded, setCommandExpanded] = useState(false);
  const sensorType = targetKind === "sensor" ? sensorTypeFor(runtime.service.stateStore, targetId) : undefined;
  const commandFields = commandFieldsForTarget(targetKind, sensorType);
  const targetOptions = resourceOptionsFor(runtime.service.stateStore, targetKind, targetId);
  const updateCommandField = (key: string, next: unknown) => {
    const nextBody = { ...commandBody };
    if (next === undefined) delete nextBody[key];
    else nextBody[key] = next;
    setCommandDirty(true);
    setCommandBody(nextBody);
    setOperation(operationFromBody(nextBody));
  };
  const changeOperation = (next: string) => {
    const nextOperation = next as CommandOperation;
    setCommandDirty(true);
    if (nextOperation === "on" || nextOperation === "off") {
      const nextBody = { ...commandBody, on: nextOperation === "on" };
      setCommandBody(nextBody);
    }
    setOperation(nextOperation);
  };
  const changeTargetKind = (next: string) => {
    const nextKind = next as TargetKind;
    setCommandDirty(true);
    setTargetKind(nextKind);
    if (nextKind === "scene") {
      setCommandBody({});
      setOperation("activate");
    } else {
      setCommandBody({ on: true });
      setOperation("on");
    }
  };
  const replaceUnsupportedTimePattern = () => {
    setTimePatternReplaced(true);
    setPatternKind("at");
    setLocaltime("T07:00:00");
    setTimer("");
    setStarttime("");
    setRecurring(false);
    setWeekdays([...HUE_WEEKDAYS]);
    setRandomSeconds(undefined);
    setTimeExpanded(true);
  };
  const save = async (name: string) => {
    try {
      if (id && !commandEditable) return definiteFailure(diagnostic("ProtocolRejected", "This Schedule command is not represented by a supported structured form; disable or delete it instead."));
      if (id && unsupportedTimePattern && !timePatternReplaced) return definiteFailure(diagnostic("ProtocolRejected", "This Schedule uses an unsupported time pattern; replace it explicitly before saving."));
      const timePattern = buildTimePattern(patternKind, localtime, timer, starttime, recurring, weekdays, randomSeconds);
      const timeValidation = validateScheduleTimePattern(timePattern);
      if (!timeValidation.allowed) return definiteFailure(diagnostic("ProtocolRejected", `${timeValidation.path}: ${timeValidation.reason}`));
      const command = id && initialCommand && !commandDirty
        ? initialCommand
        : buildScheduleCommandFromTarget(targetKind, targetId.trim(), targetKind === "scene" ? "activate" : operation, commandBody);
      const payload = { name, description, timePattern, autodelete, command };
      return id ? runtime.service.mutateHue("schedule", id, "update", payload) : runtime.service.createHue("schedule", payload);
    } catch (error) {
      return definiteFailure(diagnostic("ProtocolRejected", error instanceof Error ? error.message : "The Schedule form is incomplete."));
    }
  };
  return <EditorForm
    id={id}
    kind="schedule"
    navigation={navigation}
    note="Schedule timing and commands use supported typed forms. Authorization is rebuilt only through the explicit recovery action."
    onSave={save}
    title="Schedule Editor"
  >
    <EditorSection title="When">
      <EditorSummaryRow label="Timing" onPress={() => setTimeExpanded((current) => !current)} testID="schedule-time-summary" value={unsupportedTimePattern && !timePatternReplaced ? "Unsupported time pattern · replace to edit" : scheduleTimeSummary(patternKind, localtime, timer, weekdays)} expanded={timeExpanded} />
      {unsupportedTimePattern && !timePatternReplaced && <EditorAction label="Replace unsupported time pattern" onPress={replaceUnsupportedTimePattern} testID="schedule-replace-time-pattern" />}
      {timeExpanded && <View style={styles.focusedEditor}>
        {unsupportedTimePattern && !timePatternReplaced
          ? <ReadOnlyField label="Time pattern" value="This existing pattern is not represented by the typed editor. Replace it before editing or saving." />
          : <>
            <EditorTextField label="Description" onChangeText={setDescription} testID="schedule-description" value={description} />
            <EditorChoice label="Pattern" onChange={(kind) => setPatternKind(kind as PatternKind)} options={["at", "timer", "recurring-daily", "recurring-weekly", "randomized"]} testID="schedule-pattern" value={patternKind} />
            {patternKind === "timer" ? <EditorTextField label="Timer duration" onChangeText={setTimer} placeholder="PT00:05:00" testID="schedule-time" value={timer} /> : <EditorTextField label="Local time" onChangeText={setLocaltime} placeholder="T07:00:00" testID="schedule-localtime" value={localtime} />}
            {(patternKind === "recurring-daily" || patternKind === "recurring-weekly" || patternKind === "randomized") && <EditorTextField label="Start time/date" onChangeText={setStarttime} placeholder="2026-01-01T07:00:00" testID="schedule-starttime" value={starttime} />}
            {(patternKind === "recurring-weekly" || patternKind === "randomized") && <EditorSection title="Weekdays">
              {HUE_WEEKDAYS.map((day) => <EditorToggle key={day} label={capitalize(day)} onValueChange={(selected) => setWeekdays((current) => selected ? [...current, day].filter((item, itemIndex, all) => all.indexOf(item) === itemIndex) : current.filter((item) => item !== day))} testID={`schedule-weekday-${day}`} value={weekdays.includes(day)} />)}
            </EditorSection>}
            {patternKind === "randomized" && <EditorNumberField label="Randomization window (seconds)" onChange={setRandomSeconds} placeholder="300" showExact={false} testID="schedule-random-seconds" value={randomSeconds} />}
            <EditorToggle disabled={patternKind !== "timer" && patternKind !== "randomized"} label="Recurring" onValueChange={setRecurring} testID="schedule-recurring" value={patternKind === "recurring-daily" || patternKind === "recurring-weekly" || ((patternKind === "timer" || patternKind === "randomized") && recurring)} />
            <EditorToggle label="Autodelete" onValueChange={setAutodelete} testID="schedule-autodelete" value={autodelete} />
          </>}
      </View>}
    </EditorSection>
    <EditorSection title="Action">
      <EditorSummaryRow label="Command" onPress={() => setCommandExpanded((current) => !current)} testID="schedule-command-summary" value={commandEditable ? commandSummary(targetKind, targetId, operation, commandBody) : unsupportedCommandSummary(initialCommand)} expanded={commandExpanded} />
      {commandExpanded && <View style={styles.focusedEditor}>
        {commandEditable ? <>
          <EditorChoice label="Target resource kind" onChange={changeTargetKind} options={["light", "group", "scene", "sensor"]} testID="schedule-target-kind" value={targetKind} />
          <EditorResourceSelector label="Target resource" onChange={(next) => { setCommandDirty(true); setTargetId(next); }} options={targetOptions} testID="schedule-target" value={targetId} />
          <EditorChoice label="Operation" onChange={changeOperation} options={targetKind === "scene" ? ["activate"] : ["on", "off", "set", "read"]} testID="schedule-operation" value={targetKind === "scene" ? "activate" : operation} />
          {targetKind !== "scene" && commandFields.length > 0 && <EditorSection title="Command fields">
            {commandFields.map((field) => renderCommandField(field, commandBody, updateCommandField))}
          </EditorSection>}
        </> : <ReadOnlyField label="Command editing" value="This existing command is not represented by a supported structured form. Disable or delete it instead." />}
        {id && commandEditable && <EditorAction label="Rebuild command authorization" onPress={() => void runtime.service.rebuildScheduleCommand(id)} testID="schedule-rebuild-command" />}
      </View>}
    </EditorSection>
    <ExpandableAdvancedSection summary="Exact target ID, existing command, and trigger history" testID="schedule-advanced">
      {commandEditable && <EditorTextField keyboardType={targetKind === "scene" ? "default" : "numeric"} label="Exact target resource ID" onChangeText={(next) => { setCommandDirty(true); setTargetId(next); }} placeholder="1" testID="schedule-target-id" value={targetId} />}
      <ReadOnlyField label="Existing command" value={initialCommand ? `${initialCommand.method} ${initialCommand.resourceKind}/${initialCommand.resourceId || ""}/${initialCommand.subpath || ""}` : "Not available"} />
      {unsupportedTimePattern && !timePatternReplaced && <ReadOnlyField label="Time pattern" value="This existing pattern is not represented by the typed editor." />}
      <ReadOnlyField label="Created" value={value?.created} />
      <ReadOnlyField label="Last triggered" value={value?.lasttriggered} />
      <ReadOnlyField label="Times triggered" value={value?.timestriggered} />
    </ExpandableAdvancedSection>
  </EditorForm>;
}

function patternFrom(pattern: HueScheduleTimePattern | undefined): PatternKind {
  if (pattern?.kind === "timer") return "timer";
  if (pattern?.kind === "recurring") return pattern.weekdays && pattern.weekdays.length < HUE_WEEKDAYS.length ? "recurring-weekly" : "recurring-daily";
  if (pattern?.kind === "recurring-daily") return "recurring-daily";
  if (pattern?.kind === "recurring-weekly") return "recurring-weekly";
  if (pattern?.kind === "randomized") return "randomized";
  return "at";
}

function scheduleTimeSummary(pattern: PatternKind, localtime: string, timer: string, weekdays: readonly string[]): string {
  if (pattern === "timer") return `Timer ${timer || "not set"}`;
  const daySummary = pattern === "recurring-weekly" || pattern === "randomized" ? ` · ${weekdays.length} day${weekdays.length === 1 ? "" : "s"}` : "";
  return `${capitalize(pattern)} · ${localtime || "time not set"}${daySummary}`;
}

function commandSummary(kind: TargetKind, id: string, operation: CommandOperation, body: Record<string, unknown>): string {
  const target = id.trim() ? `${capitalize(kind)} ${id.trim()}` : `No ${kind} selected`;
  const fields = Object.keys(body).filter((key) => key !== "on" || operation === "set");
  return `${operation} · ${target}${fields.length > 0 ? ` · ${fields.join(", ")}` : ""}`;
}

function unsupportedCommandSummary(command: StructuredScheduleCommand | undefined): string {
  return command ? "Unsupported command · read-only" : "Command unavailable · read-only";
}

function resourceOptionsFor(stateStore: DeviceStateStore, kind: TargetKind, selectedId: string): readonly EditorChoiceOption[] {
  const prefix = `${kind}:`;
  const options: EditorChoiceOption[] = [];
  stateStore.getAll().forEach((stored, key) => {
    if (!key.startsWith(prefix) || stored.state.status !== "known") return;
    const id = key.slice(prefix.length);
    const raw = stored.state.value;
    const name = raw && typeof raw === "object" && typeof (raw as { name?: unknown }).name === "string"
      ? String((raw as { name: string }).name).trim()
      : `${capitalize(kind)} ${id}`;
    options.push({ value: id, label: `${name || capitalize(kind)} (ID ${id})` });
  });
  if (selectedId.trim() && !options.some((option) => option.value === selectedId.trim())) {
    options.push({ value: selectedId.trim(), label: `${capitalize(kind)} unavailable (ID ${selectedId.trim()})` });
  }
  return options.sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true }));
}

function isTargetKind(value: string | undefined): boolean { return value === "light" || value === "group" || value === "scene" || value === "sensor"; }

function isEditableCommand(command: StructuredScheduleCommand): boolean {
  if (!isTargetKind(command.resourceKind)) return false;
  return validateHueCatalogPayload("schedule", "update", { command }).allowed;
}

function operationFrom(command: StructuredScheduleCommand | undefined): CommandOperation {
  if (!command) return "on";
  if (command.resourceKind === "scene") return "activate";
  if (command.method === "GET") return "read";
  return operationFromBody(command.body || {});
}

function operationFromBody(body: Record<string, unknown>): CommandOperation {
  const keys = Object.keys(body);
  if (keys.length === 1 && typeof body.on === "boolean") return body.on ? "on" : "off";
  return "set";
}

function buildTimePattern(
  kind: PatternKind,
  localtime: string,
  timer: string,
  starttime: string,
  recurring: boolean,
  weekdays: readonly HueScheduleWeekday[],
  randomSeconds: number | undefined,
): HueScheduleTimePattern {
  const time = localtime.trim();
  const date = starttime.trim();
  switch (kind) {
    case "timer":
      return { kind, time: timer.trim(), recurring };
    case "recurring-daily":
      return { kind, localtime: time, recurring: true, ...(date ? { date } : {}) };
    case "recurring-weekly":
      return { kind, localtime: time, weekdays, recurring: true, ...(date ? { date } : {}) };
    case "randomized":
      return { kind, localtime: time, weekdays, randomSeconds: randomSeconds as number, recurring, ...(date ? { date } : {}) };
    case "at":
    default:
      return { kind: "at", localtime: time };
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sensorTypeFor(stateStore: DeviceStateStore, id: string): string | undefined {
  if (!id.trim()) return undefined;
  const stored = stateStore.get({ kind: "sensor", id: id.trim() });
  if (stored?.state.status !== "known" || !stored.state.value || typeof stored.state.value !== "object") return undefined;
  const type = (stored.state.value as { type?: unknown }).type;
  return typeof type === "string" ? type : undefined;
}

function commandFieldsForTarget(targetKind: TargetKind, sensorType: string | undefined): readonly HueCatalogField[] {
  if (targetKind === "light" || targetKind === "group") return getHueActionFields(targetKind);
  if (targetKind === "sensor") return getHueSensorConfigFields(sensorType);
  return [];
}

function renderCommandField(
  field: HueCatalogField,
  body: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void,
): JSX.Element {
  const key = field.path.slice(field.path.indexOf(".") + 1);
  const label = `Command ${field.description}`;
  const value = body[key];
  if (field.type === "boolean") return <EditorToggle key={field.path} label={label} onValueChange={(next) => onChange(key, next)} testID={`schedule-command-${key}`} value={value === true} />;
  if (field.type === "number" && key === "hue") return <EditorHueField key={field.path} label={label} onChange={(next) => onChange(key, next)} showExact={false} testID={`schedule-command-${key}`} value={typeof value === "number" ? value : undefined} />;
  if (field.type === "number") return <EditorCatalogNumberField fieldKey={key} key={field.path} label={label} onChange={(next) => onChange(key, next)} showExact={false} testID={`schedule-command-${key}`} value={typeof value === "number" ? value : undefined} />;
  if (field.type === "enum") return <EditorChoice key={field.path} label={label} onChange={(next) => onChange(key, next)} options={field.enumValues || []} testID={`schedule-command-${key}`} value={typeof value === "string" ? value : field.enumValues?.[0] || ""} />;
  if (field.type === "number[]" && key === "xy") return <EditorXyColorField key={field.path} label={label} onChangeText={(next) => onChange(key, parseNumberArray(next))} showExact={false} testID={`schedule-command-${key}`} value={Array.isArray(value) ? value.join(",") : ""} />;
  if (field.type === "number[]") return <EditorTextField key={field.path} label={`${label} (comma-separated)`} onChangeText={(next) => onChange(key, parseNumberArray(next))} placeholder="0.4,0.5" testID={`schedule-command-${key}`} value={Array.isArray(value) ? value.join(",") : ""} />;
  return <ReadOnlyField key={field.path} label={label} value={value} />;
}

function parseNumberArray(value: string): number[] | undefined {
  if (!value.trim()) return undefined;
  return value.split(",").map((entry) => Number(entry.trim()));
}

const styles = StyleSheet.create({
  focusedEditor: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, marginTop: 4, padding: 10 },
});
