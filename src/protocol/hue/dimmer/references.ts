import { HueSnapshot, ResourceRef } from "../../../app/types";
import { HueRuleAction, HueRuleCondition, parseRuleAction, parseRuleCondition } from "../catalog/rules";
import { StructuredScheduleCommand } from "../catalog/schedules";
import { redactHueCredential } from "../redaction";
import {
  DimmerReference,
  DimmerCreatorProvenance,
  RecognizedDimmerReference,
  UnrecognizedDimmerReference,
  DimmerRuleShape,
} from "./types";

const RESOURCE_SEGMENTS: Readonly<Record<string, RecognizedDimmerReference["kind"]>> = {
  lights: "light",
  groups: "group",
  scenes: "scene",
  sensors: "sensor",
  rules: "rule",
  schedules: "schedule",
  resourcelinks: "resourcelink",
};

const ROOT_KINDS = new Set(["light", "group", "scene", "sensor", "rule", "schedule", "resourcelink"]);
const STATE_FIELDS = new Set(["on", "bri", "hue", "sat", "xy", "ct", "alert", "effect", "transitiontime", "buttonevent", "presence", "temperature", "lightlevel", "lastupdated"]);

export interface SensorAutomationReference {
  readonly source: ResourceRef;
  readonly reference: RecognizedDimmerReference;
}

/**
 * Parse a Hue path by segments. Authentication segments are discarded, and
 * the returned path is redacted. No caller receives the credential-bearing
 * path or an authorization identifier.
 */
export function parseHueResourceReference(path: unknown): DimmerReference {
  if (typeof path !== "string" || path.trim() === "") return malformedPath(path, "A Hue resource path is required.");
  const safePath = redactHueCredential(path);
  if (!path.startsWith("/")) return malformedPath(safePath, "Hue resource paths must start with '/'.");
  if (/[?#]/.test(path)) return malformedPath(safePath, "Hue resource paths may not contain a query or fragment.");

  const pieces = path.slice(1).split("/");
  if (pieces.some((part) => part.length === 0)) return malformedPath(safePath, "Hue resource paths may not contain empty path segments.");
  let parts = pieces;
  if (pieces[0]?.toLowerCase() === "api") {
    if (pieces.length < 3 || !pieces[1]) return malformedPath(safePath, "An authenticated Hue path is missing its API-user segment or resource.");
    parts = pieces.slice(2);
  }
  if (parts.length < 2) return malformedPath(safePath, "A Hue resource path requires a resource kind and ID.");

  const resourceSegment = parts[0].toLowerCase();
  const kind = RESOURCE_SEGMENTS[resourceSegment];
  if (!kind) return unsupportedPath(safePath, "The Hue resource kind is not supported.");
  const id = decodeSegment(parts[1]);
  if (!id || id.includes("/")) return malformedPath(safePath, "The Hue resource ID is malformed.");
  const suffix = parts.slice(2).map(decodeSegment);
  if (suffix.some((part) => part === undefined)) return malformedPath(safePath, "A Hue path segment is not valid URL encoding.");
  const decodedSuffix = suffix as string[];

  if (decodedSuffix.length === 0) return recognized(kind, id, safePath);
  if (decodedSuffix.length === 1) {
    const endpoint = decodedSuffix[0].toLowerCase();
    if ((endpoint === "state" && kind === "light")
      || (endpoint === "action" && kind === "group")
      || (endpoint === "config" && kind === "sensor")) {
      return recognized(kind, id, safePath, endpoint);
    }
    return unsupportedPath(safePath, "The Hue resource endpoint is not represented by the reference catalog.", { kind, id });
  }
  if (decodedSuffix.length !== 2) return malformedPath(safePath, "The Hue resource path contains unexpected trailing components.", { kind, id });

  const endpoint = decodedSuffix[0].toLowerCase();
  const field = decodedSuffix[1].toLowerCase();
  if (endpoint === "state" && (kind === "light" || kind === "sensor")) {
    if (!STATE_FIELDS.has(field)) return unsupportedPath(safePath, "The Hue state field is not represented by the reference catalog.", { kind, id });
    return recognized(kind, id, safePath, endpoint, field);
  }
  if (endpoint === "config" && kind === "sensor") {
    if (field !== "on" && field !== "battery" && field !== "reachable") return unsupportedPath(safePath, "The Hue Sensor configuration field is not represented by the reference catalog.", { kind, id });
    return recognized(kind, id, safePath, endpoint, field);
  }
  if (endpoint === "action" && kind === "group") return recognized(kind, id, safePath, endpoint);
  return unsupportedPath(safePath, "The Hue resource endpoint is not represented by the reference catalog.");
}

export function parseRuleConditionReference(condition: unknown): DimmerReference {
  const value = condition && typeof condition === "object" && !Array.isArray(condition)
    ? condition as Partial<HueRuleCondition>
    : {};
  const parsed = parseHueResourceReference(value.address);
  if (parsed.status !== "recognized") return parsed;
  return parsed;
}

/** Parse the target of one Rule action, including the Hue scene activation form. */
export function parseRuleActionReference(action: unknown): DimmerReference {
  const value = action && typeof action === "object" && !Array.isArray(action)
    ? action as Partial<HueRuleAction>
    : {};
  const parsed = parseHueResourceReference(value.address);
  if (parsed.status !== "recognized") return parsed;
  if (parsed.kind === "group" && parsed.endpoint === "action") {
    const sceneId = value.body && typeof value.body === "object" && !Array.isArray(value.body)
      ? (value.body as Record<string, unknown>).scene
      : undefined;
    const decodedSceneId = typeof sceneId === "string" ? decodeSegment(sceneId) : undefined;
    if (decodedSceneId) return recognized("scene", decodedSceneId, parsed.path, "action", undefined);
    if (parsed.id === "0") return unsupportedPath(parsed.path, "Hue group 0 action is a Scene activation only when a Scene ID is present.");
  }
  if (parsed.kind !== "light" && parsed.kind !== "group" && parsed.kind !== "scene") {
    return unsupportedPath(parsed.path, "Dimmer Rule actions may target Lights, Groups, or Scenes only.");
  }
  if ((parsed.kind === "light" && parsed.endpoint !== "state") || (parsed.kind === "group" && parsed.endpoint !== "action")) {
    return unsupportedPath(parsed.path, "The Rule action endpoint is not a supported light/group action.");
  }
  return parsed;
}

export interface ParsedRuleReferences {
  readonly conditions: readonly DimmerReference[];
  readonly actions: readonly DimmerReference[];
  readonly all: readonly DimmerReference[];
}

export function parseRuleReferences(rule: unknown): ParsedRuleReferences {
  const value = rule && typeof rule === "object" && !Array.isArray(rule) ? rule as Record<string, unknown> : {};
  const conditions = Array.isArray(value.conditions) ? value.conditions.map(parseRuleConditionReference) : [];
  const actions = Array.isArray(value.actions) ? value.actions.map(parseRuleActionReference) : [];
  return { conditions, actions, all: [...conditions, ...actions] };
}

/**
 * Keep the existing Rule shape available to characterized editors without
 * carrying an API credential or arbitrary sensitive field into the view
 * model. The small set of behavior-bearing Rule metadata is retained so a
 * characterized replacement can round-trip it as well as conditions/actions.
 */
export function safeRuleShape(rule: unknown): DimmerRuleShape {
  const value = rule && typeof rule === "object" && !Array.isArray(rule) ? rule as Record<string, unknown> : {};
  const conditions = Array.isArray(value.conditions)
    ? value.conditions.map((condition) => safeCondition(parseRuleCondition(condition)))
    : [];
  const actions = Array.isArray(value.actions)
    ? value.actions.map((action) => safeAction(parseRuleAction(action)))
    : [];
  return {
    ...(typeof value.name === "string" ? { name: value.name } : {}),
    ...(value.status === "enabled" || value.status === "disabled" ? { status: value.status } : {}),
    ...(typeof value.recycle === "boolean" ? { recycle: value.recycle } : {}),
    conditions,
    actions,
  };
}

function safeCondition(condition: HueRuleCondition): HueRuleCondition {
  return { ...condition, address: redactHueCredential(condition.address) };
}

function safeAction(action: HueRuleAction): HueRuleAction {
  return {
    ...action,
    address: redactHueCredential(action.address),
    ...(action.body ? { body: safeRuleValue(action.body, "body") as Record<string, unknown> } : {}),
  };
}

function safeRuleValue(value: unknown, key: string): unknown {
  if (/(authorization|credential|username|user(name)?|token|password|secret|owner|apikey|api_key)/i.test(key)) return "<redacted>";
  if (typeof value === "string") return redactHueCredential(value);
  if (Array.isArray(value)) return value.map((item) => safeRuleValue(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([childKey, child]) => [childKey, safeRuleValue(child, childKey)]));
  }
  return value;
}

export function parseScheduleCommandReference(command: unknown): DimmerReference {
  if (!command || typeof command !== "object" || Array.isArray(command)) {
    return malformedPath("<missing schedule command>", "The Schedule command is not a structured object.");
  }
  const value = command as Record<string, unknown>;
  if (typeof value.address === "string") {
    const parsed = parseHueResourceReference(value.address);
    if (parsed.status !== "recognized") return parsed;
    if (parsed.kind === "group" && parsed.id === "0" && parsed.endpoint === "action") {
      const body = value.body && typeof value.body === "object" && !Array.isArray(value.body) ? value.body as Record<string, unknown> : {};
      const decodedSceneId = typeof body.scene === "string" ? decodeSegment(body.scene) : undefined;
      if (!decodedSceneId) return unsupportedPath(parsed.path, "Hue group 0 Schedule action is not a complete Scene activation.");
      return recognized("scene", decodedSceneId, parsed.path, "action");
    }
    return parsed;
  }

  const kind = typeof value.resourceKind === "string" ? value.resourceKind.toLowerCase() : "";
  const id = typeof value.resourceId === "string" ? decodeSegment(value.resourceId) : undefined;
  const rawSubpath = typeof value.subpath === "string" ? value.subpath.split("/") : [];
  const subpath = rawSubpath.map(decodeSegment);
  if (!ROOT_KINDS.has(kind) || !id || rawSubpath.some((part) => part.length === 0) || subpath.some((part) => part === undefined) || subpath.length > 1) {
    return malformedPath("<structured schedule command>", "The Schedule command does not contain an exact supported resource reference.");
  }
  const decodedSubpath = subpath as string[];
  if (kind === "scene") {
    if (decodedSubpath[0] !== "action") return unsupportedPath(`/${kind}/${encodeURIComponent(id)}/${decodedSubpath.join("/")}`, "Scene Schedule commands must use the action form.");
    const body = value.body && typeof value.body === "object" && !Array.isArray(value.body) ? value.body as Record<string, unknown> : {};
    const bodySceneId = typeof body.scene === "string" ? decodeSegment(body.scene) : undefined;
    if (bodySceneId !== id) return unsupportedPath(`/scenes/${encodeURIComponent(id)}/action`, "Scene Schedule commands must activate the referenced Scene.");
    return recognized("scene", id, `/scenes/${encodeURIComponent(id)}/action`, "action");
  }
  const expectedEndpoint = kind === "light" ? "state" : kind === "group" ? "action" : kind === "sensor" ? "config" : undefined;
  if (!expectedEndpoint || decodedSubpath[0] !== expectedEndpoint) return unsupportedPath(`/<structured>/${kind}/${encodeURIComponent(id)}`, "The Schedule command endpoint is not a supported dimmer reference.");
  return recognized(kind as RecognizedDimmerReference["kind"], id, `/${kind}s/${encodeURIComponent(id)}/${expectedEndpoint}`, expectedEndpoint);
}

export function parseScheduleCommandReferences(command: unknown): readonly DimmerReference[] {
  return [parseScheduleCommandReference(command)];
}

export function parseResourceLinkReference(link: unknown): DimmerReference {
  const parsed = parseHueResourceReference(link);
  if (parsed.status !== "recognized") return parsed;
  if (parsed.endpoint) return unsupportedPath(parsed.path, "Resource Links must reference resource roots, not subresources.", parsed.ref);
  return parsed;
}

export function parseResourceLinkReferences(value: unknown): readonly DimmerReference[] {
  if (typeof value === "string") return [parseResourceLinkReference(value)];
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Array.isArray(record.links) ? record.links.map(parseResourceLinkReference) : [];
}

/**
 * Find exact Sensor references in Rules, Schedule commands, and Resource
 * Links. Text in names, bodies, or unrelated fields is never inspected.
 */
export function findSensorAutomationReferences(snapshot: HueSnapshot, sensorId: string): readonly SensorAutomationReference[] {
  const result: SensorAutomationReference[] = [];
  Object.entries(snapshot.rules).forEach(([id, value]) => {
    const parsed = parseRuleReferences(value);
    parsed.conditions.forEach((reference) => {
      if (reference.status === "recognized" && reference.kind === "sensor" && reference.id === sensorId) {
        result.push({ source: { kind: "rule", id }, reference });
      }
    });
  });
  Object.entries(snapshot.schedules).forEach(([id, value]) => {
    const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
    const reference = parseScheduleCommandReference(record.command);
    if (reference.status === "recognized" && reference.kind === "sensor" && reference.id === sensorId) {
      result.push({ source: { kind: "schedule", id }, reference });
    }
  });
  Object.entries(snapshot.resourcelinks).forEach(([id, value]) => {
    parseResourceLinkReferences(value).forEach((reference) => {
      if (reference.status === "recognized" && reference.kind === "sensor" && reference.id === sensorId) {
        result.push({ source: { kind: "resourcelink", id }, reference });
      }
    });
  });
  return result;
}

export function safeCreatorProvenance(owner: unknown): DimmerCreatorProvenance | undefined {
  if (typeof owner !== "string" || owner.trim() === "") return undefined;
  return { present: true, label: "Created by another Hue client (identifier redacted)" };
}

function recognized(
  kind: RecognizedDimmerReference["kind"],
  id: string,
  path: string,
  endpoint?: string,
  field?: string,
): RecognizedDimmerReference {
  return { status: "recognized", ref: { kind, id }, kind, id, path: redactHueCredential(path), ...(endpoint ? { endpoint } : {}), ...(field ? { field } : {}) };
}

function malformedPath(path: unknown, reason: string, ref?: ResourceRef): UnrecognizedDimmerReference {
  return { status: "malformed", path: redactHueCredential(typeof path === "string" ? path : "<missing path>"), reason, ...(ref ? { ref } : {}) };
}

function unsupportedPath(path: string, reason: string, ref?: ResourceRef): UnrecognizedDimmerReference {
  return { status: "unsupported", path: redactHueCredential(path), reason, ...(ref ? { ref } : {}) };
}

function decodeSegment(value: string): string | undefined {
  try {
    const decoded = decodeURIComponent(value);
    return decoded && !decoded.includes("/") ? decoded : undefined;
  } catch (_error) {
    return undefined;
  }
}
