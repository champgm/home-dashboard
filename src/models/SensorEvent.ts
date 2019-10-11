import { printLeftoverKeys, verifyType } from ".";

export interface SensorEvent {
  eventtype: string;
  buttonevent: number;
}

export function create(payload: SensorEvent): SensorEvent {
  if (!payload) { throw new Error("SensorEvent not found"); }
  const action = {
    eventtype: verifyType(payload.eventtype, "eventtype", "string"),
    buttonevent: verifyType(payload.buttonevent, "buttonevent", "number"),
  };
  printLeftoverKeys("SensorEvent", payload, action);
  return action;
}
