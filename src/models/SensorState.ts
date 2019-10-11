import { printLeftoverKeys, verifyArray, verifyType } from ".";

export interface SensorState {
  daylight?: string;
  lastupdated: string;
  status?: number;
  buttonevent: number;
}

export function create(payload: SensorState): SensorState {
  if (!payload) { throw new Error("SensorState not found"); }
  const action = {
    daylight: verifyType(payload.daylight, "daylight", "string", false) ,
    lastupdated: verifyType(payload.lastupdated, "lastupdated", "string"),
    status: verifyType(payload.status, "status", "number", false),
    buttonevent: verifyType(payload.buttonevent, "buttonevent", "number", false) ,
  };
  printLeftoverKeys("SensorState", payload, action);
  return action;
}
