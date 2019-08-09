import { printLeftoverKeys, verifyArray, verifyType } from ".";
import { Alert, verify as verifyAlert } from "./Alert";
import { ColorMode, verify as verifyColorMode } from "./ColorMode";
import { Effect, verify as verifyEffect } from "./Effect";

export interface GroupAction {
  alert: Alert;
  bri: number;
  colormode?: ColorMode;
  ct?: number;
  effect?: Effect;
  hue?: number;
  on: boolean;
  sat?: number;
  xy?: number[];
}
export interface GroupActions {
  [id: string]: GroupAction;
}

// export namespace GroupAction {
export function create(payload: GroupAction): GroupAction {
  if (!payload) { throw new Error("GroupAction not found"); }
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
// }
