import { printLeftoverKeys, verifyType } from ".";

export interface Plug {
  setPowerState?: (powerState: boolean) => boolean;
  getPowerState?: () => boolean;
  id?: string;
  on: boolean;
  deviceId: string;
  host: string;
  port: string;
  name: string;
  deviceName: string;
  model: string;
  softwareVersion: string;
  hardwareVersion: string;
  mac: string;
  latitude: string;
  longitude: string;
  status: string;
  sysInfo: string;
  cloudInfo: string;
  consumption: string;
}

export interface Plugs {
  [id: string]: Plug;
}

export function create(payload: Plug): Plug {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("Plug not found");
  }
  const plug: Plug = {
    id: verifyType(payload.id, "id", "string", false),
    on: verifyType(payload.on, "on", "boolean"),
    deviceId: verifyType(payload.deviceId, "deviceId", "string"),
    host: verifyType(payload.host, "host", "string"),
    port: verifyType(payload.port, "port", "string"),
    name: verifyType(payload.name, "name", "string"),
    deviceName: verifyType(payload.deviceName, "deviceName", "string"),
    model: verifyType(payload.model, "model", "string"),
    softwareVersion: verifyType(payload.softwareVersion, "softwareVersion", "string"),
    hardwareVersion: verifyType(payload.hardwareVersion, "hardwareVersion", "string"),
    mac: verifyType(payload.mac, "mac", "string"),
    latitude: verifyType(payload.latitude, "latitude", "string"),
    longitude: verifyType(payload.longitude, "longitude", "string"),
    status: verifyType(payload.status, "status", "string"),
    sysInfo: verifyType(payload.sysInfo, "sysInfo", "string"),
    cloudInfo: verifyType(payload.cloudInfo, "cloudInfo", "string"),
    consumption: verifyType(payload.consumption, "consumption", "string"),
  };
  printLeftoverKeys("Plug", payload, plug);
  return plug;
}

export function createSubmittable(payload: Plug): Partial<Plug> {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("Plug not found");
  }
  const plug = {
    name: verifyType(payload.name, "name", "string", false),
  };
  return plug;
}
