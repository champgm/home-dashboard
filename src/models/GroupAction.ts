import { printLeftoverKeys, verifyArray, verifyType } from ".";

export interface GroupAction {
  alert: string;
  bri: number;
  colormode?: string;
  ct?: number;
  effect?: string;
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
      alert: verifyType(payload.alert, "alert", "string"),
      bri: verifyType(payload.bri, "bri", "number"),
      colormode: verifyType(payload.colormode, "colormode", "string",false),
      ct: verifyType(payload.ct, "ct", "number",false),
      effect: verifyType(payload.effect, "effect", "string", false),
      hue: verifyType(payload.hue, "hue", "number", false),
      on: verifyType(payload.on, "on", "boolean"),
      sat: verifyType(payload.sat, "sat", "number", false),
      xy: verifyArray(payload.xy, "xy", "number", false),
    };
    printLeftoverKeys("GroupAction", payload, action);
    return action;
  }
// }
