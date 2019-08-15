import { verifyArray, verifyType } from ".";

export interface LightState {
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

// export namespace LightState {
export function create(payload: LightState): LightState {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("LightState not found");
  }
  return {
    alert: verifyType(payload.alert, "alert", "string"),
    bri: verifyType(payload.bri, "bri", "number"),
    colormode: verifyType(payload.colormode, "colormode", "string", false),
    ct: verifyType(payload.ct, "ct", "number", false),
    effect: verifyType(payload.effect, "effect", "string", false),
    hue: verifyType(payload.hue, "hue", "number", false),
    on: verifyType(payload.on, "on", "boolean"),
    reachable: verifyType(payload.on, "on", "boolean"),
    sat: verifyType(payload.sat, "sat", "number", false),
    xy: verifyArray(payload.xy, "xy", "number", false),
  };
}
// }
