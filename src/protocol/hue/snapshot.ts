import { HueSnapshot } from "../../app/types";

const collectionNames = ["lights", "groups", "scenes", "sensors", "rules", "schedules", "resourcelinks"] as const;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function parseHueSnapshot(payload: Record<string, unknown>): HueSnapshot {
  const snapshot: {
    lights: Record<string, unknown>;
    groups: Record<string, unknown>;
    scenes: Record<string, unknown>;
    sensors: Record<string, unknown>;
    rules: Record<string, unknown>;
    schedules: Record<string, unknown>;
    resourcelinks: Record<string, unknown>;
    config?: Record<string, unknown>;
    capabilities?: Record<string, unknown>;
  } = {
    lights: {}, groups: {}, scenes: {}, sensors: {}, rules: {}, schedules: {}, resourcelinks: {},
  };
  collectionNames.forEach((name) => {
    snapshot[name] = record(payload[name]);
  });
  snapshot.config = payload.config === undefined ? undefined : record(payload.config);
  snapshot.capabilities = payload.capabilities === undefined ? undefined : record(payload.capabilities);
  return snapshot;
}

export function attachResourceIds<T extends Record<string, unknown>>(collection: Record<string, T>): Record<string, T & { id: string }> {
  return Object.keys(collection).reduce((result, id) => {
    result[id] = { ...collection[id], id };
    return result;
  }, {} as Record<string, T & { id: string }>);
}

export function snapshotResourceCollection(snapshot: HueSnapshot, kind: keyof Pick<HueSnapshot, "lights" | "groups" | "scenes" | "sensors" | "rules" | "schedules" | "resourcelinks">): Array<Record<string, unknown> & { id: string }> {
  return Object.values(attachResourceIds(snapshot[kind] as Record<string, Record<string, unknown>>));
}
