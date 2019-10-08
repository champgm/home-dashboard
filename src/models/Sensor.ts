import { printLeftoverKeys, verifyType } from ".";
import { Item } from "./Item";
import { create as createSensorConfig, SensorConfig } from "./SensorConfig";
import { create as createSensorState, SensorState } from "./SensorState";

export interface Sensor extends Item {
  config: SensorConfig;
  manufacturername: string;
  modelid: string;
  recycle: boolean;
  state: SensorState;
  swversion: string;
  type: string;
  uniqueid: string;
}

export interface Sensors {
  [id: string]: Sensor;
}

export function create(payload: Sensor): Sensor {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("Sensor not found");
  }
  const sensor = {
    config: createSensorConfig(payload.config),
    id: verifyType(payload.id, "id", "string"),
    manufacturername: verifyType(payload.manufacturername, "manufacturername", "string"),
    modelid: verifyType(payload.modelid, "modelid", "string"),
    name: verifyType(payload.name, "name", "string"),
    recycle: verifyType(payload.recycle, "recycle", "boolean"),
    state: createSensorState(payload.state),
    swversion: verifyType(payload.swversion, "swversion", "string"),
    type: verifyType(payload.type, "type", "string"),
    uniqueid: verifyType(payload.uniqueid, "uniqueid", "string"),
  };
  printLeftoverKeys("Sensor", payload, sensor);
  return sensor;
}
