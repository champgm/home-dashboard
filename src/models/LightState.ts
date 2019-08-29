// import { verifyArray, verifyType } from ".";

// export interface LightState {
//   alert: string;
//   bri: number; // Phillips brightness is 0 - 254, hsl is looking for 0-100%
//   colormode?: string;
//   ct?: number;
//   effect?: string;
//   hue?: number; // Phillips hue is 0 - 65535, hsl is looking for 0-360
//   on: boolean;
//   reachable: boolean;
//   sat?: number; // Phillips saturation is 0 - 254, hsl is looking for 0-100%
//   xy?: number[];
// }

// export function create(payload: LightState): LightState {
//   if (!payload) {
//     console.log(`${JSON.stringify(payload, null, 2)}`);
//     throw new Error("LightState not found");
//   }
//   return {
//     alert: verifyType(payload.alert, "alert", "string"),
//     bri: verifyType(payload.bri, "bri", "number"),
//     colormode: verifyType(payload.colormode, "colormode", "string", false),
//     ct: verifyType(payload.ct, "ct", "number", false),
//     effect: verifyType(payload.effect, "effect", "string", false),
//     hue: verifyType(payload.hue, "hue", "number", false),
//     on: verifyType(payload.on, "on", "boolean"),
//     reachable: verifyType(payload.on, "on", "boolean"),
//     sat: verifyType(payload.sat, "sat", "number", false),
//     xy: verifyArray(payload.xy, "xy", "number", false),
//   };
// }

// export function createSubmittable(payload: Partial<LightState>): Partial<LightState> {
//   if (!payload) {
//     console.log(`${JSON.stringify(payload, null, 2)}`);
//     throw new Error("LightState not found");
//   }
//   return {
//     alert: verifyType(payload.alert, "alert", "string", false),
//     bri: verifyType(payload.bri, "bri", "number", false),
//     colormode: verifyType(payload.colormode, "colormode", "string", false),
//     hue: verifyType(payload.hue, "hue", "number", false),
//     on: verifyType(payload.on, "on", "boolean", false),
//     sat: verifyType(payload.sat, "sat", "number", false),
//   };
// }
