import { printLeftoverKeys, verifyArray, verifyType } from ".";

export interface SensorState {
  daylight: string;
  lastupdated: string;
}

export function create(payload: SensorState): SensorState {
  if (!payload) { throw new Error("SensorState not found"); }
  const action = {
    daylight: verifyType(payload.daylight, "daylight", "string"),
    lastupdated: verifyType(payload.lastupdated, "lastupdated", "string"),
  };
  printLeftoverKeys("SensorState", payload, action);
  return action;
}
