import { printLeftoverKeys, verifyType } from ".";
import { Status } from "../tabs/editor/components/StatusToggle";
import { Alert } from "./Alert";
import { Item } from "./Item";
import { create as StateCreate, State } from "./State";

export interface Light extends Item {
  state: State;
  type: string;
  modelid: string;
  manufacturername: string;
  uniqueid: string;
  swversion: string;
  swconfigid?: string;
  productid?: string;
}

export interface Lights {
  [id: string]: Light;
}

export function create(payload: Light): Light {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("Light not found");
  }
  const light = {
    id: verifyType(payload.id, "id", "string"),
    name: verifyType(payload.name, "name", "string"),
    state: StateCreate(payload.state),
    type: verifyType(payload.type, "type", "string"),
    modelid: verifyType(payload.modelid, "modelid", "string"),
    manufacturername: verifyType(payload.manufacturername, "manufacturername", "string"),
    uniqueid: verifyType(payload.uniqueid, "uniqueid", "string"),
    swversion: verifyType(payload.swversion, "swversion", "string"),
    swconfigid: verifyType(payload.swconfigid, "swconfigid", "string", false),
    productid: verifyType(payload.productid, "productid", "string", false),
  };
  printLeftoverKeys("Light", payload, light);
  return light;
}

export function createSubmittable(payload: Light): Partial<Light> {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("Light not found");
  }
  const light = {
    name: verifyType(payload.name, "name", "string", false),
  };
  return light;
}

export function getBlinking(light: Light): Status {
  if (light.state.alert === Alert.NONE) { return Status.OFF; }
  if (light.state.alert === Alert.LSELECT) { return Status.ON; }
}
