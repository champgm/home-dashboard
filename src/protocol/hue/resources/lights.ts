import { changedFields } from "../changedFields";

export interface HueLightState {
  readonly on?: boolean;
  readonly bri?: number;
  readonly hue?: number;
  readonly sat?: number;
  readonly xy?: readonly number[];
  readonly ct?: number;
  readonly alert?: string;
  readonly effect?: string;
  readonly colormode?: string;
  readonly reachable?: boolean;
  readonly [key: string]: unknown;
}

export interface HueLight {
  readonly id: string;
  readonly name?: string;
  readonly type?: string;
  readonly state?: HueLightState;
  readonly config?: Record<string, unknown>;
  readonly capabilities?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

const metadataKeys = ["name"] as const;
const stateKeys = ["on", "bri", "hue", "sat", "xy", "ct", "alert", "effect", "transitiontime"] as const;

export function parseLights(collection: Record<string, unknown>): Record<string, HueLight> {
  return Object.keys(collection).reduce((result, id) => {
    const raw = (collection[id] && typeof collection[id] === "object" ? collection[id] : {}) as HueLight;
    result[id] = { ...raw, id };
    return result;
  }, {} as Record<string, HueLight>);
}

export function buildLightUpdate(original: Partial<HueLight> | undefined, draft: Partial<HueLight>): Partial<HueLight> {
  return changedFields(original as Record<string, unknown> | undefined, draft as Record<string, unknown>, metadataKeys as readonly (keyof HueLight)[]) as Partial<HueLight>;
}

export function buildLightStateUpdate(original: Partial<HueLightState> | undefined, draft: Partial<HueLightState>): Partial<HueLightState> {
  return changedFields(original as Record<string, unknown> | undefined, draft as Record<string, unknown>, stateKeys as readonly (keyof HueLightState)[]) as Partial<HueLightState>;
}

export function absoluteLightState(on: boolean): Pick<HueLightState, "on"> {
  return { on };
}

export function lightIsReachable(light: HueLight): boolean {
  return light.state?.reachable !== false;
}
