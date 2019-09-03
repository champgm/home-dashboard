import { printLeftoverKeys, verifyArray, verifyType } from ".";

export interface SensorConfig {
  on: boolean;
  reachable: boolean;
  battery: number;
}

export function create(payload: SensorConfig): SensorConfig {
  if (!payload) { throw new Error("SensorConfig not found"); }
  const sensorConfig = {
    on: verifyType(payload.on, "on", "boolean"),
    reachable: verifyType(payload.reachable, "reachable", "boolean"),
    battery: verifyType(payload.battery, "battery", "number"),
  };
  printLeftoverKeys("SensorConfig", payload, sensorConfig);
  return sensorConfig;
}
