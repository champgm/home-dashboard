import { changedFields } from "../changedFields";

export type GroupAggregateState = "on" | "off" | "indeterminate";

export interface HueGroupState {
  readonly all_on?: boolean;
  readonly any_on?: boolean;
  readonly [key: string]: unknown;
}

export interface HueGroupAction {
  readonly on?: boolean;
  readonly bri?: number;
  readonly hue?: number;
  readonly sat?: number;
  readonly xy?: readonly number[];
  readonly ct?: number;
  readonly alert?: string;
  readonly effect?: string;
  readonly [key: string]: unknown;
}

export interface HueGroup {
  readonly id: string;
  readonly name?: string;
  readonly type?: string;
  readonly lights?: readonly string[];
  readonly sensors?: readonly string[];
  readonly class?: string;
  readonly recycle?: boolean;
  readonly state?: HueGroupState;
  readonly action?: HueGroupAction;
  readonly [key: string]: unknown;
}

export function parseGroups(collection: Record<string, unknown>): Record<string, HueGroup> {
  return Object.keys(collection).reduce((result, id) => {
    const raw = (collection[id] && typeof collection[id] === "object" ? collection[id] : {}) as HueGroup;
    result[id] = { ...raw, id };
    return result;
  }, {} as Record<string, HueGroup>);
}

export function groupAggregateState(group: HueGroup): GroupAggregateState {
  const state = group.state;
  if (state?.all_on === true) {
    return "on";
  }
  if (state?.any_on === false) {
    return "off";
  }
  if (state?.any_on === true) {
    return "indeterminate";
  }
  return "indeterminate";
}

export function absoluteGroupAction(on: boolean): Pick<HueGroupAction, "on"> {
  return { on };
}

export function buildGroupUpdate(original: Partial<HueGroup> | undefined, draft: Partial<HueGroup>): Partial<HueGroup> {
  return changedFields(
    original as Record<string, unknown> | undefined,
    draft as Record<string, unknown>,
    ["name", "lights", "class"] as readonly (keyof HueGroup)[],
  ) as Partial<HueGroup>;
}

export function buildGroupAction(original: Partial<HueGroupAction> | undefined, draft: Partial<HueGroupAction>): Partial<HueGroupAction> {
  return changedFields(
    original as Record<string, unknown> | undefined,
    draft as Record<string, unknown>,
    ["on", "bri", "hue", "sat", "xy", "ct", "alert", "effect"] as readonly (keyof HueGroupAction)[],
  ) as Partial<HueGroupAction>;
}
