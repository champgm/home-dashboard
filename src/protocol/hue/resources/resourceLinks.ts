import { changedFields } from "../changedFields";

export interface HueResourceLink {
  readonly id: string;
  readonly class?: string;
  readonly description?: string;
  readonly links?: readonly string[];
  readonly [key: string]: unknown;
}

export function parseResourceLinks(collection: Record<string, unknown>): Record<string, HueResourceLink> {
  return Object.keys(collection).reduce((result, id) => {
    const raw = (collection[id] && typeof collection[id] === "object" ? collection[id] : {}) as HueResourceLink;
    result[id] = { ...raw, id };
    return result;
  }, {} as Record<string, HueResourceLink>);
}

export function buildResourceLinkUpdate(original: Partial<HueResourceLink> | undefined, draft: Partial<HueResourceLink>): Partial<HueResourceLink> {
  return changedFields(
    original as Record<string, unknown> | undefined,
    draft as Record<string, unknown>,
    ["class", "description", "links"] as readonly (keyof HueResourceLink)[],
  ) as Partial<HueResourceLink>;
}
