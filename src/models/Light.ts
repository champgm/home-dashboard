import { printLeftoverKeys, verifyType } from ".";
import { Status } from "../tabs/editor/components/StatusToggle";
import { Alert } from "./Alert";
import { Item } from "./Item";
import { create as StateCreate, LightState } from "./LightState";

export interface Light extends Item {
  state: LightState;
  type: string;
  modelid: string;
  manufacturername: string;
  uniqueid: string;
  swversion: string;
  swconfigid?: string;
  productid?: string;
  swupdate: { lastinstall: null, state: string };
  productname: string;
  capabilities: {
    certified: boolean,
    control: {
      mindimlevel: number,
      maxlumen: number,
      colorgamuttype: string,
      colorgamut: [[number, number], [number, number], [number, number]],
      ct: { min: number, max: number },
    },
    streaming: {
      renderer: true,
      proxy: true,
    },
  };
  config: {
    archetype: string,
    function: string,
    direction: string,
    startup: {
      mode: string,
      configured: true,
    },
  };
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
    capabilities: payload.capabilities,
    config: payload.config,
    swupdate: payload.swupdate,
    productname: payload.productname,
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
  switch (light.state.alert) {
    case Alert.NONE: return Status.OFF;
    case Alert.LSELECT: return Status.ON;
    case Alert.SELECT: return Status.ON;
    default: throw new Error(`Unknown Alert value: ${light.state.alert}`);
  }
}
