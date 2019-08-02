import { printLeftoverKeys, verifyArray, verifyType } from ".";

export interface State {
  alert: string;
  bri: number;
  colormode?: string;
  ct?: number;
  effect?: string;
  hue?: number;
  on: boolean;
  reachable: boolean;
  sat?: number;
  xy?: number[];
}

// export namespace State {
export function create(payload: State): State {
  if (!payload) { throw new Error("State not found"); }
  const state = {
    alert: verifyType(payload.alert, "alert", "string"),
    bri: verifyType(payload.bri, "bri", "number"),
    colormode: verifyType(payload.colormode, "colormode", "string", false),
    ct: verifyType(payload.ct, "ct", "number", false),
    effect: verifyType(payload.effect, "effect", "string", false),
    hue: verifyType(payload.hue, "hue", "number", false),
    on: verifyType(payload.on, "on", "boolean"),
    reachable: verifyType(payload.reachable, "reachable", "boolean"),
    sat: verifyType(payload.sat, "sat", "number", false),
    xy: verifyArray(payload.xy, "xy", "number", false),
  };
  printLeftoverKeys("State", payload, state);
  return state;
}
// }
