import { changedFields } from "../changedFields";

export type HueSceneType = "GroupScene" | "LightScene" | string;

export interface HueSceneLightState {
  readonly on?: boolean;
  readonly bri?: number;
  readonly hue?: number;
  readonly sat?: number;
  readonly xy?: readonly number[];
  readonly ct?: number;
  readonly effect?: string;
  readonly [key: string]: unknown;
}

export interface HueScene {
  readonly id: string;
  readonly name?: string;
  readonly type?: HueSceneType;
  readonly group?: string;
  readonly lights?: readonly string[];
  readonly owner?: string;
  readonly recycle?: boolean;
  readonly locked?: boolean;
  readonly appdata?: Record<string, unknown>;
  readonly picture?: string;
  readonly lastupdated?: string;
  readonly version?: number;
  readonly lightstates?: Record<string, HueSceneLightState>;
  readonly [key: string]: unknown;
}

export function parseScenes(collection: Record<string, unknown>): Record<string, HueScene> {
  return Object.keys(collection).reduce((result, id) => {
    const raw = (collection[id] && typeof collection[id] === "object" ? collection[id] : {}) as HueScene;
    result[id] = { ...raw, id };
    return result;
  }, {} as Record<string, HueScene>);
}

export function buildSceneUpdate(original: Partial<HueScene> | undefined, draft: Partial<HueScene>): Partial<HueScene> {
  return changedFields(
    original as Record<string, unknown> | undefined,
    draft as Record<string, unknown>,
    ["name", "group", "lights", "appdata", "picture", "lightstates"] as readonly (keyof HueScene)[],
  ) as Partial<HueScene>;
}

export interface SceneActivationRequest {
  readonly groupId: string;
  readonly payload: { readonly scene: string };
}

export function buildSceneActivation(scene: HueScene): SceneActivationRequest {
  return {
    // LightScene activation is deliberately routed through group 0. Do not
    // infer a group from its lights.
    groupId: scene.type === "LightScene" ? "0" : scene.group || "0",
    payload: { scene: scene.id },
  };
}

export function buildSceneLightStateUpdate(
  original: Partial<HueSceneLightState> | undefined,
  draft: Partial<HueSceneLightState>,
): Partial<HueSceneLightState> {
  return changedFields(
    original as Record<string, unknown> | undefined,
    draft as Record<string, unknown>,
    ["on", "bri", "hue", "sat", "xy", "ct", "effect"] as readonly (keyof HueSceneLightState)[],
  ) as Partial<HueSceneLightState>;
}
