import { createArray, printLeftoverKeys, verifyArray, verifyType } from ".";
import { create as createSensorEvent, SensorEvent } from "./SensorEvent";

export interface SensorInput {
  repeatintervals: number[];
  events: SensorEvent[];
}

export function create(payload: SensorInput): SensorInput {
  if (!payload) { throw new Error("SensorInput not found"); }
  const sensorInput = {
    repeatintervals: verifyArray(payload.repeatintervals, "repeatintervals", "number", false),
    events: createArray(payload.events, "events", createSensorEvent, false),
  };
  printLeftoverKeys("SensorInput", payload, sensorInput);
  return sensorInput;
}
