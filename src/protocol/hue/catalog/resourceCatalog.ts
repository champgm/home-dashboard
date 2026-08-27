import { valuesEqual } from "../changedFields";
import { redactHueCredential } from "../redaction";
import { HueRuleAction, HueRuleCondition, HUE_RULE_ACTION_METHODS, HUE_RULE_CONDITION_OPERATORS, serializeRuleAction, serializeRuleCondition } from "./rules";
import { HueScheduleTimePattern, scheduleCommandsEqual, StructuredScheduleCommand, serializeScheduleTimePattern, serializeStructuredScheduleCommand, validateScheduleTimePattern } from "./schedules";
import type { DimmerSceneTargetDetails } from "../dimmer/actions";

export type HueCatalogResourceKind = "light" | "group" | "scene" | "sensor" | "rule" | "schedule" | "resourcelink";
export type HueCatalogOperation = "create" | "update" | "action" | "status" | "config";
export type HueCatalogValueType = "string" | "number" | "boolean" | "string[]" | "number[]" | "object" | "enum";
export type HueCatalogEndpoint = "root" | "state" | "action" | "config" | "lightstate" | "status";

export interface HueCatalogField {
  readonly path: string;
  readonly type: HueCatalogValueType;
  readonly endpoint: HueCatalogEndpoint;
  readonly writable: boolean;
  readonly create: boolean;
  readonly update: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly enumValues?: readonly string[];
  readonly capability?: (resource: Record<string, unknown>) => boolean;
  readonly description: string;
}

export interface HueCatalogResource {
  readonly kind: HueCatalogResourceKind;
  readonly endpoint: string;
  readonly fields: readonly HueCatalogField[];
  readonly supportsCreate: boolean;
  readonly supportsDelete: boolean;
  readonly requiredCreateFields: readonly string[];
}

export type HueCatalogValidation =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string; readonly path?: string };

export const HUE_SENSOR_CONFIG_FIELDS_BY_TYPE: Readonly<Record<string, readonly string[]>> = {
  ZLLPresence: ["on", "duration", "usertest", "ledindication"],
  ZLLSwitch: ["on", "usertest", "ledindication"],
  ZLLTemperature: ["on", "usertest", "ledindication"],
  ZLLLightLevel: ["on", "tholddark", "tholdoffset"],
  Daylight: ["on", "sunriseoffset", "sunsetoffset"],
  ZLLGenericStatus: ["on"],
  ZLLGenericFlag: ["on"],
  CLIPGenericStatus: ["on"],
  CLIPGenericFlag: ["on"],
  CLIPPresence: ["on", "duration"],
  CLIPTemperature: ["on"],
  CLIPHumidity: ["on"],
};

export const HUE_SENSOR_TYPES: readonly string[] = Object.keys(HUE_SENSOR_CONFIG_FIELDS_BY_TYPE);

const STATE_FIELDS: readonly HueCatalogField[] = [
  field("state.on", "boolean", "state", true, true, true, "Power state"),
  field("state.bri", "number", "state", true, false, true, "Brightness", 1, 254),
  field("state.hue", "number", "state", true, false, true, "Hue color", 0, 65535),
  field("state.sat", "number", "state", true, false, true, "Saturation", 0, 254),
  field("state.xy", "number[]", "state", true, false, true, "CIE XY color"),
  field("state.ct", "number", "state", true, false, true, "Color temperature", 1, 65535),
  field("state.alert", "enum", "state", true, false, true, "Alert",  ["none", "select", "lselect"]),
  field("state.effect", "enum", "state", true, false, true, "Effect", ["none", "colorloop"]),
  field("state.transitiontime", "number", "state", true, false, true, "Transition time", 0, 65535),
  field("state.colormode", "string", "state", false, false, false, "Reported color mode"),
  field("state.reachable", "boolean", "state", false, false, false, "Reachability"),
].map((entry) => {
  const control = entry.path.slice("state.".length);
  return ["bri", "hue", "sat", "xy", "ct", "alert", "effect"].includes(control)
    ? { ...entry, capability: (resource: Record<string, unknown>) => supportsHueControl(resource, control) }
    : entry;
});

const RELATIVE_ACTION_FIELDS: readonly HueCatalogField[] = [
  field("action.bri_inc", "number", "action", true, false, true, "Brightness change while held", -254, 254),
];

const ACTION_FIELDS: readonly HueCatalogField[] = [
  ...STATE_FIELDS
    .filter((entry) => entry.path !== "state.reachable" && entry.path !== "state.colormode")
    .map((entry) => ({ ...entry, path: entry.path.replace("state.", "action."), endpoint: "action" as const, create: false })),
  ...RELATIVE_ACTION_FIELDS,
];

const LIGHT_ACTION_FIELDS: readonly HueCatalogField[] = [...STATE_FIELDS, ...RELATIVE_ACTION_FIELDS];

const RESOURCE_CATALOG: Readonly<Record<HueCatalogResourceKind, HueCatalogResource>> = {
  light: resource("light", "lights", [
    field("name", "string", "root", true, false, true, "Display name"),
    field("type", "string", "root", false, false, false, "Light type"),
    field("manufacturername", "string", "root", false, false, false, "Manufacturer"),
    field("modelid", "string", "root", false, false, false, "Model identifier"),
    field("productname", "string", "root", false, false, false, "Product name"),
    field("uniqueid", "string", "root", false, false, false, "Unique identifier"),
    field("swversion", "string", "root", false, false, false, "Software version"),
    field("capabilities", "object", "root", false, false, false, "Advertised capabilities"),
    field("config", "object", "root", false, false, false, "Device configuration"),
    ...STATE_FIELDS,
  ], false, true, []),
  group: resource("group", "groups", [
    field("name", "string", "root", true, true, true, "Display name"),
    field("lights", "string[]", "root", true, true, true, "Light membership"),
    field("class", "enum", "root", true, true, true, "Room/class", [
      "Living room", "Kitchen", "Dining", "Bedroom", "Kids bedroom", "Bathroom", "Nursery", "Recreation", "Office", "Gym",
      "Hallway", "Garage", "Terrace", "Garden", "Driveway", "Carport", "Other", "Downstairs", "Upstairs", "Front door",
      "Top floor", "Attic", "Guest room", "Staircase", "Lounge", "Man cave", "Computer", "Studio", "Music", "TV", "Reading",
      "Closet", "Storage", "Laundry room", "Balcony", "Porch", "Barbecue", "Pool",
    ]),
    field("type", "string", "root", false, false, false, "Group type"),
    field("recycle", "boolean", "root", false, false, false, "Recycle flag"),
    field("sensors", "string[]", "root", false, false, false, "Associated sensors"),
    field("state", "object", "root", false, false, false, "Aggregate state"),
    field("state.all_on", "boolean", "root", false, false, false, "All lights on"),
    field("state.any_on", "boolean", "root", false, false, false, "Any light on"),
    ...ACTION_FIELDS,
  ], true, true, ["name", "lights"]),
  scene: resource("scene", "scenes", [
    field("name", "string", "root", true, true, true, "Display name"),
    field("type", "enum", "root", true, true, false, "Scene form", ["GroupScene", "LightScene"]),
    field("group", "string", "root", true, true, true, "Group membership"),
    field("lights", "string[]", "root", true, true, true, "Light membership"),
    field("recycle", "boolean", "root", true, true, true, "Recycle after use"),
    field("locked", "boolean", "root", false, false, false, "Locked flag"),
    field("appdata", "object", "root", true, true, true, "Application metadata"),
    field("picture", "string", "root", true, false, true, "Picture identifier"),
    field("owner", "string", "root", false, false, false, "Owner"),
    field("version", "number", "root", false, false, false, "Scene version"),
    field("lastupdated", "string", "root", false, false, false, "Last update"),
    field("lightstates", "object", "root", false, false, false, "Per-light state collection"),
    field("lightstates.*.on", "boolean", "lightstate", true, false, true, "Scene light power"),
    field("lightstates.*.bri", "number", "lightstate", true, false, true, "Scene brightness", 1, 254),
    field("lightstates.*.hue", "number", "lightstate", true, false, true, "Scene hue", 0, 65535),
  field("lightstates.*.sat", "number", "lightstate", true, false, true, "Scene saturation", 0, 254),
  field("lightstates.*.xy", "number[]", "lightstate", true, false, true, "Scene XY color"),
  field("lightstates.*.ct", "number", "lightstate", true, false, true, "Scene color temperature", 1, 65535),
    field("lightstates.*.alert", "enum", "lightstate", true, false, true, "Scene alert", ["none", "select", "lselect"]),
  field("lightstates.*.effect", "enum", "lightstate", true, false, true, "Scene effect", ["none", "colorloop"]),
    field("lightstates.*.transitiontime", "number", "lightstate", true, false, true, "Scene transition time", 0, 65535),
  ], true, true, ["name", "type"]),
  sensor: resource("sensor", "sensors", [
    field("name", "string", "root", true, true, true, "Display name"),
    field("type", "string", "root", true, true, false, "Sensor type"),
    field("manufacturername", "string", "root", true, true, false, "Manufacturer"),
    field("modelid", "string", "root", true, true, false, "Model identifier"),
    field("uniqueid", "string", "root", true, true, false, "Unique identifier"),
    field("swversion", "string", "root", true, true, false, "Software version"),
    field("recycle", "boolean", "root", true, true, true, "Recycle flag"),
    field("config", "object", "config", true, false, true, "Sensor configuration"),
    field("config.on", "boolean", "config", true, true, true, "Sensor enabled"),
    field("config.battery", "number", "config", false, false, false, "Battery percentage", 0, 100),
    field("config.reachable", "boolean", "config", false, false, false, "Sensor reachability"),
    field("config.configured", "boolean", "config", false, false, false, "Configuration state"),
    field("config.sunriseoffset", "number", "config", true, true, true, "Sunrise offset", -120, 120),
    field("config.sunsetoffset", "number", "config", true, true, true, "Sunset offset", -120, 120),
    field("config.duration", "number", "config", true, true, true, "Presence duration", 0, 65535),
    field("config.usertest", "boolean", "config", true, true, true, "User test mode"),
    field("config.ledindication", "boolean", "config", true, true, true, "LED indication"),
    field("config.offset", "number", "config", true, true, true, "Temperature offset"),
    field("config.tholddark", "number", "config", true, true, true, "Dark threshold"),
    field("config.tholdoffset", "number", "config", true, true, true, "Light-level threshold offset"),
    field("state", "object", "root", false, false, false, "Current sensor state"),
    field("capabilities", "object", "root", false, false, false, "Sensor capabilities"),
  ], true, true, ["name", "type", "manufacturername", "modelid", "config"]),
  rule: resource("rule", "rules", [
    field("name", "string", "root", true, true, true, "Display name"),
    field("conditions", "object", "root", true, true, true, "Structured conditions"),
    field("actions", "object", "root", true, true, true, "Structured actions"),
    field("status", "enum", "status", true, true, true, "Rule status", ["enabled", "disabled"]),
    field("owner", "string", "root", false, false, false, "Owner"),
    field("created", "string", "root", false, false, false, "Created time"),
    field("lasttriggered", "string", "root", false, false, false, "Last triggered"),
    field("timestriggered", "number", "root", false, false, false, "Trigger count", 0),
    field("recycle", "boolean", "root", false, false, false, "Recycle flag"),
  ], true, true, ["name", "conditions", "actions"]),
  schedule: resource("schedule", "schedules", [
    field("name", "string", "root", true, true, true, "Display name"),
    field("description", "string", "root", true, true, true, "Description"),
    field("status", "enum", "status", true, true, true, "Schedule status", ["enabled", "disabled"]),
    field("localtime", "string", "root", true, true, true, "Local execution time"),
    field("time", "string", "root", true, true, true, "Timer duration"),
    field("starttime", "string", "root", true, true, true, "Recurring start time"),
    field("recurring", "boolean", "root", true, true, true, "Recurring schedule"),
    field("autodelete", "boolean", "root", true, true, true, "Delete after execution"),
    field("timePattern", "object", "root", true, true, true, "Structured time pattern"),
    field("command", "object", "root", true, true, true, "Structured resource command"),
    field("created", "string", "root", false, false, false, "Created time"),
    field("lasttriggered", "string", "root", false, false, false, "Last triggered"),
    field("timestriggered", "number", "root", false, false, false, "Trigger count", 0),
  ], true, true, ["name", "description", "timePattern", "command"]),
  resourcelink: resource("resourcelink", "resourcelinks", [
    field("class", "string", "root", true, true, true, "Resource Link class"),
    field("description", "string", "root", true, true, true, "Description"),
    field("links", "string[]", "root", true, true, true, "Managed resource references"),
  ], true, true, ["class", "description", "links"]),
};

/**
 * The documented V1 field classes that the application promises to inspect
 * or manage. Keeping this list separate from the descriptors prevents the
 * completeness check from degenerating into “every list is non-empty.”
 */
export const HUE_DOCUMENTED_RESOURCE_FIELDS: Readonly<Record<HueCatalogResourceKind, readonly string[]>> = {
  light: [
    "name", "type", "manufacturername", "modelid", "productname", "uniqueid", "swversion", "capabilities", "config",
    "state.on", "state.bri", "state.hue", "state.sat", "state.xy", "state.ct", "state.alert", "state.effect", "state.transitiontime",
    "state.colormode", "state.reachable",
  ],
  group: [
    "name", "lights", "class", "type", "recycle", "sensors", "state.all_on", "state.any_on",
    "action.on", "action.bri", "action.hue", "action.sat", "action.xy", "action.ct", "action.alert", "action.effect", "action.transitiontime",
  ],
  scene: [
    "name", "type", "group", "lights", "recycle", "locked", "appdata", "picture", "owner", "version", "lastupdated", "lightstates",
    "lightstates.*.on", "lightstates.*.bri", "lightstates.*.hue", "lightstates.*.sat", "lightstates.*.xy", "lightstates.*.ct",
    "lightstates.*.alert", "lightstates.*.effect", "lightstates.*.transitiontime",
  ],
  sensor: [
    "name", "type", "manufacturername", "modelid", "uniqueid", "swversion", "recycle", "config", "config.on", "config.battery",
    "config.reachable", "config.configured", "config.sunriseoffset", "config.sunsetoffset", "config.duration", "config.usertest",
    "config.ledindication", "config.offset", "config.tholddark", "config.tholdoffset", "state", "capabilities",
  ],
  rule: ["name", "conditions", "actions", "status", "owner", "created", "lasttriggered", "timestriggered", "recycle"],
  schedule: ["name", "description", "status", "localtime", "time", "starttime", "recurring", "autodelete", "timePattern", "command", "created", "lasttriggered", "timestriggered"],
  resourcelink: ["class", "description", "links"],
};

function field(
  path: string,
  type: HueCatalogValueType,
  endpoint: HueCatalogEndpoint,
  writable: boolean,
  create: boolean,
  update: boolean,
  description: string,
  minOrEnums?: number | readonly string[],
  maxOrEnums?: number | readonly string[],
): HueCatalogField {
  return {
    path,
    type,
    endpoint,
    writable,
    create,
    update,
    ...(typeof minOrEnums === "number" ? { min: minOrEnums } : {}),
    ...(typeof maxOrEnums === "number" ? { max: maxOrEnums } : Array.isArray(minOrEnums) ? { enumValues: minOrEnums } : Array.isArray(maxOrEnums) ? { enumValues: maxOrEnums } : {}),
    description,
  };
}

function resource(
  kind: HueCatalogResourceKind,
  endpoint: string,
  fields: readonly HueCatalogField[],
  supportsCreate: boolean,
  supportsDelete: boolean,
  requiredCreateFields: readonly string[],
): HueCatalogResource {
  return { kind, endpoint, fields, supportsCreate, supportsDelete, requiredCreateFields };
}

function supportsHueControl(resource: Record<string, unknown>, control: string): boolean {
  const capabilities = resource.capabilities;
  if (!capabilities || typeof capabilities !== "object" || Array.isArray(capabilities)) return true;
  const controlRecord = (capabilities as Record<string, unknown>).control;
  if (!controlRecord || typeof controlRecord !== "object" || Array.isArray(controlRecord)) return true;
  const advertised = (controlRecord as Record<string, unknown>)[control];
  return advertised === undefined || Boolean(advertised);
}

export function getHueResourceCatalog(): Readonly<Record<HueCatalogResourceKind, HueCatalogResource>> {
  return RESOURCE_CATALOG;
}

export function getHueResourceDescriptor(kind: HueCatalogResourceKind): HueCatalogResource {
  return RESOURCE_CATALOG[kind];
}

export function catalogField(kind: HueCatalogResourceKind, path: string): HueCatalogField | undefined {
  return RESOURCE_CATALOG[kind].fields.find((entry) => entry.path === path || entry.path === path.replace(/\.[^./]+(?=\.)/, ".*") || entry.path.endsWith(".*"));
}

export function getHueSensorConfigFields(sensorType: string | undefined): readonly HueCatalogField[] {
  return (HUE_SENSOR_CONFIG_FIELDS_BY_TYPE[sensorType || ""] || [])
    .map((key) => catalogField("sensor", `config.${key}`))
    .filter((field): field is HueCatalogField => Boolean(field && field.writable));
}

export function getHueActionFields(kind: "light" | "group"): readonly HueCatalogField[] {
  const prefix = kind === "light" ? "state." : "action.";
  const fields = kind === "light" ? LIGHT_ACTION_FIELDS : ACTION_FIELDS;
  return fields.filter((entry) => (entry.path.startsWith(prefix) || entry.path.startsWith("action.")) && entry.writable && entry.update);
}

export function validateHueCatalogPayload(
  kind: HueCatalogResourceKind,
  operation: HueCatalogOperation,
  payload: unknown,
): HueCatalogValidation {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { allowed: false, reason: "Hue writes require a structured object." };
  }
  const record = payload as Record<string, unknown>;
  const descriptor = RESOURCE_CATALOG[kind];
  if (operation === "create") {
    if (!descriptor.supportsCreate) return { allowed: false, reason: `${kind} resources are discovered by the bridge and cannot be created here.` };
    const contract = validateCreateContract(kind, descriptor.requiredCreateFields, record);
    if (!contract.allowed) return contract;
  }
  if (operation === "action") {
    return validateActionFields(kind, record);
  }
  if (operation === "config" && kind !== "sensor") {
    return { allowed: false, reason: "Only Sensor configuration has a separate writable endpoint." };
  }
  for (const [key, value] of Object.entries(record)) {
    const result = validateCatalogEntry(kind, operation, key, value);
    if (!result.allowed) return result;
  }
  if (kind === "rule") {
    const conditions = record.conditions;
    if (conditions !== undefined) {
      const result = validateRuleConditions(conditions, operation !== "create");
      if (!result.allowed) return result;
    }
    const actions = record.actions;
    if (actions !== undefined) {
      const result = validateRuleActions(actions, operation !== "create");
      if (!result.allowed) return result;
    }
  }
  if (kind === "schedule" && record.command !== undefined) {
    const result = validateScheduleCommand(record.command);
    if (!result.allowed) return result;
  }
  if (kind === "schedule" && record.timePattern !== undefined) {
    const result = validateScheduleTimePattern(record.timePattern);
    if (!result.allowed) return result;
  }
  if (kind === "scene" && record.type !== undefined && record.type !== "GroupScene" && record.type !== "LightScene") {
    return { allowed: false, path: "type", reason: "Scene type must be GroupScene or LightScene." };
  }
  if (kind === "sensor" && operation === "create" && typeof record.type === "string" && record.config && typeof record.config === "object" && !Array.isArray(record.config)) {
    const supported = HUE_SENSOR_CONFIG_FIELDS_BY_TYPE[record.type];
    if (supported) {
      const unsupported = Object.keys(record.config as Record<string, unknown>).find((key) => !supported.includes(key));
      if (unsupported) return { allowed: false, path: `config.${unsupported}`, reason: `The selected Sensor type does not declare '${unsupported}' configuration.` };
    }
  }
  if (kind === "resourcelink" && record.links !== undefined) {
    if (!Array.isArray(record.links) || record.links.some((value) => typeof value !== "string" || !isManagedHuePath(value))) {
      return { allowed: false, path: "links", reason: "Resource Links may reference only supported Hue resources." };
    }
  }
  return { allowed: true };
}

function validateActionFields(kind: HueCatalogResourceKind, record: Record<string, unknown>): HueCatalogValidation {
  const allowed = kind === "light" ? LIGHT_ACTION_FIELDS : kind === "group" ? ACTION_FIELDS : [];
  if (allowed.length === 0) return { allowed: false, reason: `${kind} has no generic action endpoint.` };
  if (!record || typeof record !== "object" || Array.isArray(record)) return { allowed: false, reason: "Action fields must be a structured object." };
  for (const [key, value] of Object.entries(record)) {
    const prefix = kind === "light" ? "state" : "action";
    const descriptor = allowed.find((entry) => entry.path === `${prefix}.${key}` || entry.path === `action.${key}`);
    if (!descriptor) return { allowed: false, path: key, reason: `Action field '${key}' is not declared by the Hue catalog.` };
    const result = validateValue(descriptor, value);
    if (!result.allowed) return { ...result, path: key };
  }
  return { allowed: true };
}

function validateCreateContract(
  kind: HueCatalogResourceKind,
  requiredFields: readonly string[],
  record: Record<string, unknown>,
): HueCatalogValidation {
  for (const key of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      return { allowed: false, path: key, reason: `Creating a ${kind} requires '${key}'.` };
    }
    const value = record[key];
    if (typeof value === "string" && value.trim() === "") {
      return { allowed: false, path: key, reason: `Creating a ${kind} requires a non-empty '${key}'.` };
    }
    if ((key === "lights" || key === "links" || key === "conditions" || key === "actions") && (!Array.isArray(value) || value.length === 0)) {
      return { allowed: false, path: key, reason: `Creating a ${kind} requires at least one ${key.slice(0, -1)}.` };
    }
    if ((key === "config" || key === "timePattern" || key === "command") && (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value as Record<string, unknown>).length === 0)) {
      return { allowed: false, path: key, reason: `Creating a ${kind} requires a non-empty '${key}' object.` };
    }
  }
  if (kind === "scene") {
    if (record.type === "GroupScene" && (typeof record.group !== "string" || record.group.trim() === "")) {
      return { allowed: false, path: "group", reason: "A GroupScene requires a Group ID." };
    }
    if (record.type === "LightScene" && (!Array.isArray(record.lights) || record.lights.length === 0)) {
      return { allowed: false, path: "lights", reason: "A LightScene requires at least one Light ID." };
    }
  }
  if (kind === "sensor") {
    if (typeof record.type !== "string" || !HUE_SENSOR_CONFIG_FIELDS_BY_TYPE[record.type]) {
      return { allowed: false, path: "type", reason: "The selected Sensor type is not represented by the Hue catalog." };
    }
  }
  return { allowed: true };
}

function validateCatalogEntry(kind: HueCatalogResourceKind, operation: HueCatalogOperation, key: string, value: unknown): HueCatalogValidation {
  const descriptor = RESOURCE_CATALOG[kind].fields.find((entry) => entry.path === key);
  const prefix = RESOURCE_CATALOG[kind].fields.some((entry) => entry.path.startsWith(`${key}.`) || entry.path.startsWith(`${key}.*.`));
  if (!descriptor && !prefix) {
    return { allowed: false, path: key, reason: `Hue field '${key}' is not declared by the ${kind} catalog.` };
  }
  if (descriptor) {
    if (key === "lightstates") {
      return operation === "create"
        ? { allowed: false, path: key, reason: "Scene per-light state must be written through the lightstates subresource after creation." }
        : validateSceneLightStates(value);
    }
    if ((key === "config" || key === "state" || key === "action") && descriptor.writable) {
      if (!value || typeof value !== "object" || Array.isArray(value)) return { allowed: false, path: key, reason: `Hue field '${key}' requires a structured object.` };
      return validateNested(kind, operation, key, value as Record<string, unknown>);
    }
    if (operation === "create" && !descriptor.create) return { allowed: false, path: key, reason: `Hue field '${key}' is read-only for creation.` };
    if (operation !== "create" && operation !== "config" && operation !== "status" && !descriptor.update) return { allowed: false, path: key, reason: `Hue field '${key}' is read-only.` };
    if (operation === "config" && descriptor.endpoint !== "config") return { allowed: false, path: key, reason: `Hue field '${key}' is not a Sensor configuration field.` };
    if (operation === "status" && key !== "status") return { allowed: false, path: key, reason: `Only status is writable through the status operation.` };
    if (key === "conditions" || key === "actions" || key === "command" || key === "timePattern" || key === "appdata") return { allowed: true };
    return validateValue(descriptor, value);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { allowed: false, path: key, reason: `Hue field '${key}' requires a structured object.` };
  return validateNested(kind, operation, key, value as Record<string, unknown>);
}

function validateNested(kind: HueCatalogResourceKind, operation: HueCatalogOperation, prefix: string, value: Record<string, unknown>): HueCatalogValidation {
  for (const [key, child] of Object.entries(value)) {
    const path = `${prefix}.${key}`;
    const descriptor = RESOURCE_CATALOG[kind].fields.find((entry) => entry.path === path || entry.path === `${prefix}.*.${key}`);
    if (!descriptor) return { allowed: false, path, reason: `Hue field '${path}' is not declared by the ${kind} catalog.` };
    if (!descriptor.writable || (operation === "create" && !descriptor.create) || (operation !== "create" && operation !== "config" && !descriptor.update)) {
      return { allowed: false, path, reason: `Hue field '${path}' is read-only or unavailable for this operation.` };
    }
    const result = validateValue(descriptor, child);
    if (!result.allowed) return { ...result, path };
  }
  return { allowed: true };
}

function validateValue(descriptor: HueCatalogField, value: unknown): HueCatalogValidation {
  const validType = descriptor.type === "string" ? typeof value === "string"
    : descriptor.type === "number" ? typeof value === "number" && Number.isFinite(value)
      : descriptor.type === "boolean" ? typeof value === "boolean"
        : descriptor.type === "string[]" ? Array.isArray(value) && value.every((item) => typeof item === "string")
          : descriptor.type === "number[]" ? Array.isArray(value) && value.every((item) => typeof item === "number" && Number.isFinite(item))
            : descriptor.type === "object" ? Boolean(value && typeof value === "object" && !Array.isArray(value))
              : typeof value === "string";
  if (!validType) return { allowed: false, reason: `${descriptor.path} has the wrong value type.` };
  if (descriptor.min !== undefined && typeof value === "number" && value < descriptor.min) return { allowed: false, reason: `${descriptor.path} is below its supported range.` };
  if (descriptor.max !== undefined && typeof value === "number" && value > descriptor.max) return { allowed: false, reason: `${descriptor.path} is above its supported range.` };
  if (descriptor.type === "number[]" && descriptor.path.endsWith("xy") && ((value as unknown[]).length !== 2 || (value as unknown[]).some((item) => typeof item !== "number" || item < 0 || item > 1))) return { allowed: false, reason: `${descriptor.path} must contain exactly two values between 0 and 1.` };
  if (descriptor.enumValues && typeof value === "string" && !descriptor.enumValues.includes(value)) return { allowed: false, reason: `${descriptor.path} has an unsupported value.` };
  return { allowed: true };
}

function validateRuleConditions(value: unknown, allowEmpty = false): HueCatalogValidation {
  if (!Array.isArray(value)) return { allowed: false, path: "conditions", reason: "Rule conditions must be a structured list." };
  if (value.length === 0 && !allowEmpty) return { allowed: false, path: "conditions", reason: "A Hue Rule needs at least one structured condition." };
  for (const condition of value) {
    if (!condition || typeof condition !== "object") return { allowed: false, path: "conditions", reason: "Rule conditions must be structured objects." };
    const item = condition as Record<string, unknown>;
    if (typeof item.address !== "string" || !isSupportedRuleConditionAddress(item.address) || typeof item.operator !== "string" || !HUE_RULE_CONDITION_OPERATORS.includes(item.operator as never)) {
      return { allowed: false, path: "conditions", reason: "Rule conditions must use a supported Hue resource address and operator." };
    }
    if (item.value !== undefined && typeof item.value !== "string") return { allowed: false, path: "conditions", reason: "Rule condition values must be strings." };
  }
  return { allowed: true };
}

function validateSceneLightStates(value: unknown): HueCatalogValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { allowed: false, path: "lightstates", reason: "Scene light states must be a structured collection." };
  for (const [lightId, state] of Object.entries(value as Record<string, unknown>)) {
    if (!/^\d+$/.test(lightId) || !state || typeof state !== "object" || Array.isArray(state)) return { allowed: false, path: `lightstates.${lightId}`, reason: "Scene light states require numeric light IDs and structured state." };
    for (const [key, child] of Object.entries(state as Record<string, unknown>)) {
      const descriptor = RESOURCE_CATALOG.scene.fields.find((entry) => entry.path === `lightstates.*.${key}`);
      if (!descriptor) return { allowed: false, path: `lightstates.${lightId}.${key}`, reason: "The Scene light-state field is not declared by the catalog." };
      const result = validateValue(descriptor, child);
      if (!result.allowed) return { ...result, path: `lightstates.${lightId}.${key}` };
    }
  }
  return { allowed: true };
}

function validateRuleActions(value: unknown, allowEmpty = false): HueCatalogValidation {
  if (!Array.isArray(value)) return { allowed: false, path: "actions", reason: "Rule actions must be a structured list." };
  if (value.length === 0 && !allowEmpty) return { allowed: false, path: "actions", reason: "A Hue Rule needs at least one structured action." };
  for (const action of value) {
    if (!action || typeof action !== "object") return { allowed: false, path: "actions", reason: "Rule actions must be structured objects." };
    const item = action as Record<string, unknown>;
    if (typeof item.address !== "string" || typeof item.method !== "string" || !HUE_RULE_ACTION_METHODS.includes(item.method as never) || !isSupportedRuleActionAddress(item.address, item.body)) {
      return { allowed: false, path: "actions", reason: "Rule actions must use a supported resource target and method." };
    }
    if (item.body !== undefined && (!item.body || typeof item.body !== "object" || Array.isArray(item.body))) return { allowed: false, path: "actions", reason: "Rule action bodies must be structured objects." };
  }
  return { allowed: true };
}

function validateScheduleCommand(value: unknown): HueCatalogValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { allowed: false, path: "command", reason: "Schedule commands must be structured objects." };
  const command = value as Record<string, unknown>;
  if (typeof command.method !== "string" || !["GET", "PUT", "POST"].includes(command.method)) return { allowed: false, path: "command", reason: "Schedule command method is not supported." };
  if (typeof command.address === "string") return isSupportedScheduleAddress(command.method, command.address, command.body) ? { allowed: true } : { allowed: false, path: "command", reason: "Schedule command target is not a supported Hue resource operation." };
  if (typeof command.resourceKind !== "string" || !["light", "group", "scene", "sensor"].includes(command.resourceKind)) return { allowed: false, path: "command", reason: "Schedule command target is not a supported resource." };
  if (typeof command.resourceId !== "string" || command.resourceId.trim() === "") return { allowed: false, path: "command.resourceId", reason: "Schedule command requires a resource ID." };
  if (command.resourceKind !== "scene" && !/^\d+$/.test(command.resourceId)) return { allowed: false, path: "command.resourceId", reason: "Schedule command resource IDs must be numeric." };
  if (command.subpath !== undefined && typeof command.subpath !== "string") return { allowed: false, path: "command", reason: "Schedule command subpath must be structured." };
  if (!isSupportedStructuredScheduleTarget(command.method, command)) return { allowed: false, path: "command", reason: "Schedule command target is not a supported Hue resource operation." };
  return { allowed: true };
}

function normalizedHuePath(value: string): string {
  return value.replace(/^\/api\/[^/]+/i, "");
}

function isSupportedRuleConditionAddress(value: string): boolean {
  return /^\/sensors\/\d+\/(?:state\/(?:buttonevent|presence|temperature|lightlevel)|config\/on)$/i.test(normalizedHuePath(value));
}

function isSupportedRuleActionAddress(value: string, body: unknown): boolean {
  const path = normalizedHuePath(value);
  if (/^\/groups\/\d+\/action$/i.test(path) && body && typeof body === "object" && !Array.isArray(body)
    && typeof (body as Record<string, unknown>).scene === "string") {
    const scene = body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).scene
      : undefined;
    return Object.keys(body as Record<string, unknown>).length === 1
      && typeof scene === "string" && scene.trim() !== "" && !/[/?#]/.test(scene);
  }
  if (/^\/lights\/\d+\/state$/i.test(path)) return body === undefined || Boolean(body && typeof body === "object" && !Array.isArray(body) && validateActionFields("light", body as Record<string, unknown>).allowed);
  if (/^\/groups\/\d+\/action$/i.test(path)) return body === undefined || Boolean(body && typeof body === "object" && !Array.isArray(body) && validateActionFields("group", body as Record<string, unknown>).allowed);
  return false;
}

function isSupportedScheduleAddress(method: string, value: string, body: unknown): boolean {
  const path = normalizedHuePath(value);
  if (/^\/lights\/\d+\/state$/i.test(path)) return validateScheduleTargetMethod(method, body, "light");
  if (/^\/groups\/0\/action$/i.test(path)) return method === "PUT" && isSceneScheduleBody(body);
  if (/^\/groups\/\d+\/action$/i.test(path)) return validateScheduleTargetMethod(method, body, "group");
  if (/^\/sensors\/\d+\/config$/i.test(path)) return validateScheduleTargetMethod(method, body, "sensor");
  return false;
}

function isSupportedStructuredScheduleTarget(method: string, command: Record<string, unknown>): boolean {
  const kind = command.resourceKind;
  const subpath = command.subpath || "";
  if (kind === "light") return subpath === "state" && validateScheduleTargetMethod(method, command.body, "light");
  if (kind === "group") return subpath === "action" && validateScheduleTargetMethod(method, command.body, "group");
  if (kind === "scene") return subpath === "action" && method === "PUT" && isSceneScheduleBody(command.body, command.resourceId);
  if (kind === "sensor") return subpath === "config" && validateScheduleTargetMethod(method, command.body, "sensor");
  return false;
}

function validateScheduleTargetMethod(method: string, body: unknown, kind: "light" | "group" | "sensor"): boolean {
  if (method === "GET") return body === undefined;
  if (method !== "PUT" || !body || typeof body !== "object" || Array.isArray(body)) return false;
  if (kind === "sensor") return Object.keys(body as Record<string, unknown>).length > 0
    && validateHueCatalogPayload("sensor", "config", { config: body }).allowed;
  return Object.keys(body as Record<string, unknown>).length > 0
    && validateActionFields(kind, body as Record<string, unknown>).allowed;
}

function isSceneScheduleBody(body: unknown, resourceId?: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const scene = (body as Record<string, unknown>).scene;
  return typeof scene === "string" && scene.trim() !== "" && !/[/?#]/.test(scene)
    && (resourceId === undefined || scene === resourceId);
}

export function isManagedHuePath(value: string): boolean {
  const normalized = value.replace(/^\/api\/[^/]+/i, "");
  return /^\/(lights|groups|scenes|sensors|rules|schedules)(\/[^/?#]+)?(\/(state|action|config)(\/[^/?#]+)?)?$/i.test(normalized);
}

function nestedChanged(original: unknown, draft: unknown, allowedKeys: readonly string[]): Record<string, unknown> {
  const oldRecord = original && typeof original === "object" && !Array.isArray(original) ? original as Record<string, unknown> : {};
  const draftRecord = draft && typeof draft === "object" && !Array.isArray(draft) ? draft as Record<string, unknown> : {};
  return allowedKeys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(draftRecord, key) && !valuesEqual(oldRecord[key], draftRecord[key])) result[key] = draftRecord[key];
    return result;
  }, {} as Record<string, unknown>);
}

function topLevelChanged(original: Record<string, unknown> | undefined, draft: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  return keys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(draft, key) && !valuesEqual(original?.[key], draft[key])) result[key] = draft[key];
    return result;
  }, {} as Record<string, unknown>);
}

export function prepareHueMutationPayload(
  kind: HueCatalogResourceKind,
  operation: HueCatalogOperation,
  original: Record<string, unknown> | undefined,
  draft: Record<string, unknown>,
): { readonly allowed: true; readonly payload: Record<string, unknown> } | { readonly allowed: false; readonly reason: string; readonly path?: string } {
  if (operation === "update" && !original) {
    return { allowed: false, reason: "Changed-field-only updates require a known original Hue resource." };
  }
  const validation = validateHueCatalogPayload(kind, operation, draft);
  if (!validation.allowed) return validation;
  if (operation === "create" || operation === "action" || operation === "status" || operation === "config") return { allowed: true, payload: cloneRecord(draft) };
  const result = topLevelChanged(original, draft, RESOURCE_CATALOG[kind].fields.filter((entry) => !entry.path.includes(".") && entry.path !== "command" && entry.update).map((entry) => entry.path));
  if (kind === "light" && draft.state !== undefined) {
    const state = nestedChanged((original?.state), draft.state, STATE_FIELDS.filter((entry) => entry.path.startsWith("state.") && entry.writable).map((entry) => entry.path.slice("state.".length)));
    if (Object.keys(state).length > 0) result.state = state;
  }
  if (kind === "group" && draft.action !== undefined) {
    const action = nestedChanged(original?.action, draft.action, ACTION_FIELDS.map((entry) => entry.path.slice("action.".length)));
    if (Object.keys(action).length > 0) result.action = action;
  }
  if (kind === "sensor" && draft.config !== undefined) {
    const config = nestedChanged(original?.config, draft.config, RESOURCE_CATALOG.sensor.fields.filter((entry) => entry.path.startsWith("config.") && entry.writable).map((entry) => entry.path.slice("config.".length)));
    if (Object.keys(config).length > 0) result.config = config;
  }
  if (kind === "rule") {
    if (draft.conditions !== undefined && !valuesEqual(original?.conditions, draft.conditions)) result.conditions = (draft.conditions as HueRuleCondition[]).map(serializeRuleCondition);
    if (draft.actions !== undefined && !valuesEqual(original?.actions, draft.actions)) result.actions = (draft.actions as HueRuleAction[]).map(serializeRuleAction);
  }
  if (kind === "schedule" && draft.command !== undefined && !scheduleCommandsEqual(original?.command, draft.command)) {
    const command = draft.command as StructuredScheduleCommand & { readonly address?: string };
    result.command = typeof command.address === "string"
      ? { ...command, address: redactHueCredential(command.address) }
      : serializeStructuredScheduleCommand(command);
  }
  if (kind === "schedule" && draft.timePattern !== undefined && !valuesEqual(original?.timePattern, draft.timePattern)) {
    delete result.timePattern;
    Object.assign(result, serializeScheduleTimePattern(draft.timePattern as HueScheduleTimePattern));
  }
  if (kind === "scene" && draft.lightstates !== undefined) delete result.lightstates;
  return { allowed: true, payload: result };
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function buildRuleConditionFromSensor(sensorId: string, event: string, operator: HueRuleCondition["operator"], value?: string): HueRuleCondition {
  if (!/^\d+$/.test(sensorId) || !/^([a-z][a-z0-9_]*\.)?[a-z][a-z0-9_]*$/i.test(event) || !["state.buttonevent", "state.presence", "state.temperature", "state.lightlevel", "config.on"].includes(event) || !HUE_RULE_CONDITION_OPERATORS.includes(operator as never)) {
    throw new Error("The selected Sensor event is not supported.");
  }
  return { address: `/sensors/${encodeURIComponent(sensorId)}/${event.replace(".", "/")}`, operator, ...(value === undefined ? {} : { value }) };
}

export function buildRuleActionFromTarget(
  kind: "light" | "group" | "scene",
  id: string,
  operation: "on" | "off" | "set" | "brighten" | "dim" | "activate",
  body?: Record<string, unknown>,
  sceneDetails?: DimmerSceneTargetDetails,
): HueRuleAction {
  if (kind === "scene") {
    if (!isSceneIdentifier(id)) throw new Error("A Scene ID is required.");
    if (operation !== "activate") throw new Error("Scenes support activation only.");
    if (sceneDetails?.type === "GroupScene" && !sceneDetails.group) {
      throw new Error("A GroupScene must identify its owning Group.");
    }
    const groupId = sceneDetails?.type === "LightScene" ? "0" : sceneDetails?.group || "0";
    if (!/^\d+$/.test(groupId)) throw new Error("A GroupScene must identify a numeric Group target.");
    return { address: `/groups/${groupId}/action`, method: "PUT", body: { scene: id } };
  }
  if (!/^\d+$/.test(id)) throw new Error("Hue resource IDs must be numeric.");
  const actionBody = operation === "brighten" || operation === "dim"
    ? relativeActionBody(operation, body)
    : operation === "on" || operation === "off"
      ? { on: operation === "on" }
      : { ...(body || {}) };
  if (Object.keys(actionBody).length === 0) throw new Error("A structured Rule action requires at least one state field.");
  const validation = validateHueCatalogPayload(kind, "action", actionBody);
  if (!validation.allowed) throw new Error(validation.reason);
  return { address: kind === "light" ? `/lights/${id}/state` : `/groups/${id}/action`, method: "PUT", body: actionBody };
}

function relativeActionBody(operation: "brighten" | "dim", body?: Record<string, unknown>): Record<string, unknown> {
  const supplied = body?.bri_inc;
  const magnitude = typeof supplied === "number" && Number.isFinite(supplied) && Math.abs(supplied) > 0
    ? Math.min(254, Math.max(1, Math.round(Math.abs(supplied))))
    : 25;
  const result: Record<string, unknown> = { bri_inc: operation === "brighten" ? magnitude : -magnitude };
  if (typeof body?.transitiontime === "number") result.transitiontime = body.transitiontime;
  return result;
}

export function buildScheduleCommandFromTarget(
  kind: "light" | "group" | "scene" | "sensor",
  id: string,
  operation: "on" | "off" | "set" | "activate" | "read",
  body?: Record<string, unknown>,
): StructuredScheduleCommand {
  if (kind === "scene") {
    if (!isSceneIdentifier(id)) throw new Error("A Scene ID is required.");
    if (operation !== "activate") throw new Error("Scenes support activation only.");
    return { method: "PUT", resourceKind: "scene", resourceId: id, subpath: "action", body: { scene: id } };
  }
  if (!/^\d+$/.test(id)) throw new Error("Hue resource IDs must be numeric.");
  if (operation === "activate") throw new Error(`${kind} targets do not support scene activation.`);
  const method = operation === "read" ? "GET" : "PUT";
  const command: StructuredScheduleCommand = {
    method,
    resourceKind: kind,
    resourceId: id,
    subpath: kind === "group" ? "action" : kind === "sensor" ? "config" : "state",
    ...(method === "GET" ? {} : {
      body: operation === "set"
        ? { ...(body || {}) }
        : { ...(body || {}), on: operation === "on" },
    }),
  };
  const validation = validateHueCatalogPayload("schedule", "update", { command });
  if (!validation.allowed) throw new Error(validation.reason);
  return command;
}

function isSceneIdentifier(value: string): boolean {
  return typeof value === "string" && value.trim() !== "" && !/[/?#]/.test(value);
}

export function isHueCatalogComplete(): boolean {
  const kinds = Object.keys(RESOURCE_CATALOG) as HueCatalogResourceKind[];
  return kinds.length === Object.keys(HUE_DOCUMENTED_RESOURCE_FIELDS).length
    && kinds.every((kind) => {
      const entry = RESOURCE_CATALOG[kind];
      const paths = new Set(entry.fields.map((field) => field.path));
      return entry.fields.length > 0
        && paths.size === entry.fields.length
        && entry.fields.every((field) => Boolean(field.description) && Boolean(field.endpoint))
        && entry.requiredCreateFields.every((path) => paths.has(path))
        && HUE_DOCUMENTED_RESOURCE_FIELDS[kind].every((path) => paths.has(path));
    });
}

export function scheduleTimePatternToFields(pattern: HueScheduleTimePattern): Record<string, unknown> {
  return serializeScheduleTimePattern(pattern);
}
