import { createArray, printLeftoverKeys, verifyType } from ".";
import { Item } from "./Item";
import { create as createSensorCapability, SensorCapability } from "./SensorCapability";
import { create as createSensorConfig, SensorConfig } from "./SensorConfig";
import { create as createSensorState, SensorState } from "./SensorState";

export interface Sensor extends Item {
  config: SensorConfig;
  manufacturername: string;
  modelid: string;
  productname: string;
  diversityid: string;
  recycle?: boolean;
  state: SensorState;
  swversion?: string;
  type: string;
  uniqueid?: string;
  pending?: any[];
  swupdate: { lastinstall: string, state: string };
  capabilities: SensorCapability;
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
    productname: verifyType(payload.productname, "productname", "string", false),
    diversityid: verifyType(payload.diversityid, "diversityid", "string", false),
    name: verifyType(payload.name, "name", "string"),
    recycle: verifyType(payload.recycle, "recycle", "boolean", false),
    capabilities: payload.capabilities ? createSensorCapability(payload.capabilities) : payload.capabilities,
    state: createSensorState(payload.state),
    swversion: verifyType(payload.swversion, "swversion", "string", false),
    type: verifyType(payload.type, "type", "string"),
    uniqueid: verifyType(payload.uniqueid, "uniqueid", "string", false),
    pending: payload.pending,
    swupdate: payload.swupdate,
  };
  printLeftoverKeys("Sensor", payload, sensor);
  return sensor;
}

export function createSubmittable(payload: Sensor): Partial<Sensor> {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("Sensor not found");
  }
  const group = {
    config: createSensorConfig(payload.config),
    manufacturername: verifyType(payload.manufacturername, "manufacturername", "string"),
    modelid: verifyType(payload.modelid, "modelid", "string"),
    name: verifyType(payload.name, "name", "string"),
    recycle: verifyType(payload.recycle, "recycle", "boolean", false),
    state: createSensorState(payload.state),
    swversion: verifyType(payload.swversion, "swversion", "string", false),
    type: verifyType(payload.type, "type", "string"),
    uniqueid: verifyType(payload.uniqueid, "uniqueid", "string", false),
    pending: payload.pending,
  };
  return group;
}

export function getEmpty(): Sensor {
  return create({
    id: "id",
    name: "name",
    diversityid: "diversityid",
    type: "type",
    swupdate: {
      lastinstall: "lastinstall",
      state: "state",
    },
    capabilities: {
      certified: true,
      primary: true,
      inputs: [],
    },
    config: {
      on: true,
    },
    manufacturername: "manufacturername",
    modelid: "modelid",
    productname: "productname",
    state: createSensorState({
      lastupdated: "lastupdated",
    }),
  });
}
