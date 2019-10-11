import { printLeftoverKeys, verifyArray, verifyType } from ".";

export interface SensorConfig {
  on: boolean;
  reachable?: boolean;
  battery?: number;
  pending?: any[];
  sunriseoffset: number;
  sunsetoffset: number;
  configured: boolean;
}

export function create(payload: SensorConfig): SensorConfig {
  if (!payload) { throw new Error("SensorConfig not found"); }
  const sensorConfig = {
    on: verifyType(payload.on, "on", "boolean"),
    reachable: verifyType(payload.reachable, "reachable", "boolean", false),
    configured: verifyType(payload.configured, "configured", "boolean",false),
    sunriseoffset: verifyType(payload.sunriseoffset, "sunriseoffset", "number", false),
    sunsetoffset: verifyType(payload.sunsetoffset, "sunsetoffset", "number", false),
    battery: payload.battery ? verifyType(payload.battery, "battery", "number") : payload.battery,
    pending: payload.pending,
  };
  printLeftoverKeys("SensorConfig", payload, sensorConfig);
  return sensorConfig;
}
