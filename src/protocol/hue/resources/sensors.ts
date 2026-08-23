import { changedFields } from "../changedFields";

export interface HueSensor {
  readonly id: string;
  readonly name?: string;
  readonly type?: string;
  readonly state?: Record<string, unknown>;
  readonly config?: Record<string, unknown>;
  readonly capabilities?: Record<string, unknown>;
  readonly manufacturername?: string;
  readonly modelid?: string;
  readonly uniqueid?: string;
  readonly [key: string]: unknown;
}

export function parseSensors(collection: Record<string, unknown>): Record<string, HueSensor> {
  return Object.keys(collection).reduce((result, id) => {
    const raw = (collection[id] && typeof collection[id] === "object" ? collection[id] : {}) as HueSensor;
    result[id] = { ...raw, id };
    return result;
  }, {} as Record<string, HueSensor>);
}

export function buildSensorUpdate(original: Partial<HueSensor> | undefined, draft: Partial<HueSensor>): Partial<HueSensor> {
  return changedFields(
    original as Record<string, unknown> | undefined,
    draft as Record<string, unknown>,
    ["name", "config", "state", "manufacturername", "modelid", "uniqueid"] as readonly (keyof HueSensor)[],
  ) as Partial<HueSensor>;
}

export function sensorBinaryState(sensor: HueSensor): boolean | undefined {
  const on = sensor.config?.on;
  return typeof on === "boolean" ? on : undefined;
}
