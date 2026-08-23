import { HueBinding } from "../app/types";

export function parseHueBinding(raw: string): HueBinding {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid Hue binding.");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.bridgeId !== "string" || record.bridgeId.length === 0
    || typeof record.credential !== "string" || record.credential.length === 0) {
    throw new Error("Invalid Hue binding fields.");
  }
  return { bridgeId: record.bridgeId, credential: record.credential };
}

export function serializeHueBinding(binding: HueBinding): string {
  if (!binding.bridgeId || !binding.credential) {
    throw new Error("Cannot save an incomplete Hue binding.");
  }
  return JSON.stringify({ bridgeId: binding.bridgeId, credential: binding.credential });
}
