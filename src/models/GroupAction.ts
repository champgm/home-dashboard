import { printLeftoverKeys, verifyArray, verifyType } from ".";
import { Alert, verify as verifyAlert } from "./Alert";
import { ColorMode, verify as verifyColorMode } from "./ColorMode";
import { Effect, verify as verifyEffect } from "./Effect";

export interface GroupAction {
  alert: Alert;
  bri: number; // Phillips brightness is 0 - 254, hsl is looking for 0-100%
  colormode?: ColorMode;
  ct?: number;
  effect?: Effect;
  hue?: number; // Phillips hue is 0 - 65535, hsl is looking for 0-360
  on: boolean;
  sat?: number; // Phillips saturation is 0 - 254, hsl is looking for 0-100%
  xy?: number[];
}
export interface GroupActions {
  [id: string]: GroupAction;
}

export function create(payload: GroupAction): GroupAction {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("GroupAction not found");
  }
  const action = {
    alert: verifyAlert(payload.alert),
    bri: verifyType(payload.bri, "bri", "number"),
    colormode: payload.colormode
      ? verifyColorMode(payload.colormode)
      : undefined,
    ct: verifyType(payload.ct, "ct", "number", false),
    effect: payload.effect
      ? verifyEffect(payload.effect)
      : undefined,
    hue: verifyType(payload.hue, "hue", "number", false),
    on: verifyType(payload.on, "on", "boolean"),
    sat: verifyType(payload.sat, "sat", "number", false),
    xy: verifyArray(payload.xy, "xy", "number", false),
  };
  printLeftoverKeys("GroupAction", payload, action);
  return action;
}

export function createSubmittable(payload: Partial<GroupAction>): GroupAction {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("GroupAction not found");
  }
  const action = {
    alert: payload.alert ?
      verifyAlert(payload.alert)
      : undefined,
    bri: verifyType(payload.bri, "bri", "number", false),
    colormode: payload.colormode
      ? verifyColorMode(payload.colormode)
      : undefined,
    hue: verifyType(payload.hue, "hue", "number", false),
    on: verifyType(payload.on, "on", "boolean", false),
    sat: verifyType(payload.sat, "sat", "number", false),
  };
  return action;
}
