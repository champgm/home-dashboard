import React, { useState } from "react";
import { Text } from "react-native";
import { EditorChoice, EditorNumberField, EditorSection, EditorTextField, EditorToggle, ReadOnlyField, editorStyles } from "./editorControls";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
import { getHueSensorConfigFields, HUE_SENSOR_TYPES, HueCatalogField } from "../../protocol/hue/catalog/resourceCatalog";

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
  const references = sensorReferences(runtime, id);
  return <EditorForm
    id={id}
    kind="sensor"
    navigation={navigation}
    note="Sensor state, identity, capabilities, battery, and event data are inspection-only. Configuration writes use the Hue /config subresource."
    onSave={save}
    title="Sensor Editor"
  >
    <EditorSection title="Sensor identity and capabilities">
      {id ? <>
        <ReadOnlyField label="Sensor ID" value={id} />
        <ReadOnlyField label="Type" value={value?.type} />
        <ReadOnlyField label="Manufacturer" value={value?.manufacturername} />
        <ReadOnlyField label="Model" value={value?.modelid} />
        <ReadOnlyField label="Unique ID" value={value?.uniqueid} />
        <ReadOnlyField label="Software version" value={value?.swversion} />
      </> : <>
        <EditorChoice label="Sensor type" onChange={setSensorType} options={HUE_SENSOR_TYPES} testID="sensor-type" value={sensorType} />
        <EditorTextField label="Manufacturer" onChangeText={setManufacturer} testID="sensor-manufacturer" value={manufacturer} />
        <EditorTextField label="Model ID" onChangeText={setModel} testID="sensor-model" value={model} />
        <EditorTextField label="Unique ID (optional)" onChangeText={setUniqueId} testID="sensor-uniqueid" value={uniqueId} />
      </>}
      <ReadOnlyField label="Capabilities" value={value?.capabilities} />
      <ReadOnlyField label="Reachable" value={value?.config?.reachable} />
      <ReadOnlyField label="Battery" value={value?.config?.battery} />
      <ReadOnlyField label="Button event" value={value?.state?.buttonevent} />
      <ReadOnlyField label="Last updated" value={value?.state?.lastupdated} />
      <ReadOnlyField label="Current sensor state" value={value?.state} />
    </EditorSection>
    <EditorSection title="Supported configuration">
      {configFields.map((field) => <React.Fragment key={field.path}>{renderConfigField(field, config, updateConfig)}</React.Fragment>)}
      <Text style={editorStyles.readOnlyValue}>Unsupported or read-only configuration is not rendered as an edit control.</Text>
    </EditorSection>
    <EditorSection title="Automation references">
      {references.length === 0 ? <ReadOnlyField label="Rules and schedules" value="No current automation references this Sensor." /> : references.map((reference) => <ReadOnlyField key={reference} label="Referenced by" value={reference} />)}
    </EditorSection>
  </EditorForm>;
}

function sensorReferences(runtime: ReturnType<typeof useAppRuntime>, sensorId: string | undefined): string[] {
  if (!sensorId) return [];
  const result: string[] = [];
  runtime.service.stateStore.getAll().forEach((stored, key) => {
    if (stored.state.status !== "known") return;
    const value = stored.state.value as Record<string, unknown>;
    const serialized = JSON.stringify(value);
    if (serialized.includes(`/sensors/${sensorId}/`) || serialized.includes(`/sensors/${sensorId}`)) result.push(key);
  });
  return result;
}

function renderConfigField(field: HueCatalogField, config: Record<string, unknown>, update: (key: string, value: unknown) => void): JSX.Element {
  const key = field.path.slice("config.".length);
  const label = field.description;
  if (field.type === "boolean") return <EditorToggle label={label} onValueChange={(value) => update(key, value)} testID={`sensor-config-${key}`} value={config[key] === true} />;
  if (field.type === "number") return <EditorNumberField label={label} onChange={(value) => update(key, value)} testID={`sensor-config-${key}`} value={numberValue(config[key])} />;
  return <ReadOnlyField label={label} value={config[key]} />;
}

function numberValue(value: unknown): number | undefined { return typeof value === "number" ? value : undefined; }
