import { createArray, printLeftoverKeys, verifyArray, verifyType } from ".";
import { create as createSensorEvent, SensorEvent } from "./SensorEvent";
import { create as createSensorInput, SensorInput } from "./SensorInput";
import { verify } from "./Type";

export interface SensorCapability {
  certified: boolean;
  primary: boolean;
  inputs: SensorInput[];
}

export function create(payload: SensorCapability): SensorCapability {
  if (!payload) { throw new Error("SensorCapability not found"); }
  const sensorCapability = {
    certified: verifyType(payload.certified, "certified", "boolean"),
    primary: verifyType(payload.primary, "primary", "boolean"),
    inputs: createArray(payload.inputs, "inputs", createSensorInput),
  };
  printLeftoverKeys("SensorCapability", payload, sensorCapability);
  return sensorCapability;
}
