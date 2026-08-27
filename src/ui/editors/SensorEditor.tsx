import React, { useMemo, useState } from "react";
import { Text } from "react-native";
import { EditorAction, EditorCatalogNumberField, EditorChoice, EditorSection, EditorTextField, EditorToggle, ReadOnlyField, editorStyles } from "./editorControls";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
import { getHueSensorConfigFields, HUE_SENSOR_TYPES, HueCatalogField } from "../../protocol/hue/catalog/resourceCatalog";
import { ExpandableAdvancedSection } from "../components/ExpandableAdvancedSection";
import {
  buildEditorModel,
  findSensorAutomationReferences,
  snapshotFromStateStore,
} from "../../protocol/hue/dimmer";

interface SensorValue {
  readonly name?: string;
  readonly type?: string;
  readonly manufacturername?: string;
  readonly modelid?: string;
  readonly uniqueid?: string;
  readonly swversion?: string;
  readonly config?: Record<string, unknown>;
  readonly state?: Record<string, unknown>;
  readonly capabilities?: Record<string, unknown>;
}

export function SensorEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const stored = id ? runtime.service.stateStore.get({ kind: "sensor", id }) : undefined;
  const value = stored?.state.status === "known" ? stored.state.value as SensorValue : undefined;
  const initialConfig = value?.config || {};
  const [sensorType, setSensorType] = useState(value?.type || HUE_SENSOR_TYPES[0]);
  const [manufacturer, setManufacturer] = useState(value?.manufacturername || "Home Dashboard");
  const [model, setModel] = useState(value?.modelid || "HomeDashboardSensor");
  const [uniqueId, setUniqueId] = useState(value?.uniqueid || "");
  const [config, setConfig] = useState<Record<string, unknown>>({
    ...initialConfig,
    ...(id === undefined && initialConfig.on === undefined ? { on: true } : {}),
  });
  const configFields = getHueSensorConfigFields(sensorType);
  const updateConfig = (key: string, next: unknown) => setConfig((current) => ({ ...current, [key]: next }));
  const configPayload = configFields.reduce((result, field) => {
    const key = field.path.slice("config.".length);
    if (config[key] !== undefined) result[key] = config[key];
    return result;
  }, {} as Record<string, unknown>);
  const save = async (name: string) => {
    if (!id) {
      return runtime.service.createHue("sensor", {
        name,
        type: sensorType,
        manufacturername: manufacturer,
        modelid: model,
        ...(uniqueId.trim() ? { uniqueid: uniqueId.trim() } : {}),
        config: configPayload,
      });
    }
    let result = await runtime.service.mutateHue("sensor", id, "update", { name });
    if (result.kind !== "success") return result;
    return runtime.service.mutateHue("sensor", id, "config", { config: configPayload });
  };
  const snapshot = useMemo(() => snapshotFromStateStore(runtime.service.stateStore), [runtime]);
  const dimmerModel = id ? buildEditorModel({ kind: "sensor", id }, snapshot, runtime.service.dimmerCatalog) : undefined;
  const references = id ? findSensorAutomationReferences(snapshot, id) : [];
  const configureDimmer = () => {
    if (!dimmerModel?.recognized) return;
    navigation?.navigate?.("ConfigureDimmer", { sensorId: id, deviceKey: dimmerModel.deviceKey });
  };
  return <EditorForm
    id={id}
    kind="sensor"
    navigation={navigation}
    note="Sensor state, identity, capabilities, battery, and event data are inspection-only. Configuration writes use the Hue /config subresource."
    onSave={save}
    title="Sensor Editor"
    >
      <EditorSection title="Editable sensor fields">
      {!id && <>
        <EditorChoice label="Sensor type" onChange={setSensorType} options={HUE_SENSOR_TYPES} testID="sensor-type" value={sensorType} />
        <EditorTextField label="Manufacturer" onChangeText={setManufacturer} testID="sensor-manufacturer" value={manufacturer} />
        <EditorTextField label="Model ID" onChangeText={setModel} testID="sensor-model" value={model} />
        <EditorTextField label="Unique ID (optional)" onChangeText={setUniqueId} testID="sensor-uniqueid" value={uniqueId} />
      </>}
      {configFields.map((field) => <React.Fragment key={field.path}>{renderConfigField(field, config, updateConfig)}</React.Fragment>)}
      <Text style={editorStyles.readOnlyValue}>Unsupported or read-only configuration is not rendered as an edit control.</Text>
      </EditorSection>
      <EditorSection title="Sensor details">
        {id && <>
        <ReadOnlyField label="Type" value={value?.type} />
        <ReadOnlyField label="Manufacturer" value={value?.manufacturername} />
        <ReadOnlyField label="Model" value={value?.modelid} />
        <ReadOnlyField label="Software version" value={value?.swversion} />
      </>}
      <ReadOnlyField label="Reachable" value={humanBoolean(value?.config?.reachable, "Reachability not reported")} />
      <ReadOnlyField label="Battery" value={batteryValue(value?.config?.battery)} />
      <ReadOnlyField label="Button event" value={value?.state?.buttonevent === undefined ? "Not reported" : "Reported"} />
      {dimmerModel?.recognized && <EditorAction label="Configure Dimmer" onPress={configureDimmer} testID="sensor-configure-dimmer" />}
      </EditorSection>
      <EditorSection title="Automation references">
      {references.length === 0 ? <ReadOnlyField label="Rules and schedules" value="No current automation references this Sensor." /> : <ReadOnlyField label="Exact references" value={`${references.length} current reference${references.length === 1 ? "" : "s"}`} />}
      </EditorSection>
      <ExpandableAdvancedSection summary="IDs, raw events, capabilities, and exact reference paths" testID="sensor-advanced">
        <ReadOnlyField label="Sensor ID" value={id} />
        <ReadOnlyField label="Unique ID" value={value?.uniqueid} />
        <ReadOnlyField label="Capabilities" value={value?.capabilities} />
        <ReadOnlyField label="Raw button event" value={value?.state?.buttonevent} />
        <ReadOnlyField label="Last updated" value={value?.state?.lastupdated} />
        <ReadOnlyField label="Current sensor state" value={value?.state} />
        {references.map((reference, index) => <ReadOnlyField
          key={`${reference.source.kind}:${reference.source.id}:${index}`}
          label="Referenced by"
          value={`${reference.source.kind} (exact reference; path ${reference.reference.path})`}
        />)}
      </ExpandableAdvancedSection>
  </EditorForm>;
}

function renderConfigField(field: HueCatalogField, config: Record<string, unknown>, update: (key: string, value: unknown) => void): JSX.Element {
  const key = field.path.slice("config.".length);
  const label = field.description;
  if (field.type === "boolean") return <EditorToggle label={label} onValueChange={(value) => update(key, value)} testID={`sensor-config-${key}`} value={config[key] === true} />;
  if (field.type === "number") return <EditorCatalogNumberField fieldKey={key} label={label} onChange={(value) => update(key, value)} testID={`sensor-config-${key}`} value={numberValue(config[key])} />;
  return <ReadOnlyField label={label} value={config[key]} />;
}

function numberValue(value: unknown): number | undefined { return typeof value === "number" ? value : undefined; }
function humanBoolean(value: unknown, unavailable: string): string {
  return typeof value === "boolean" ? (value ? "Reachable" : "Not reachable") : unavailable;
}
function batteryValue(value: unknown): string | number {
  return typeof value === "number" ? `${value}%` : "Not reported";
}
