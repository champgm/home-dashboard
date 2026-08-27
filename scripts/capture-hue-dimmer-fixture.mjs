import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const COLLECTIONS = ["lights", "groups", "scenes", "sensors", "rules", "schedules", "resourcelinks"];
const RESOURCE_SEGMENTS = {
  lights: "light",
  groups: "group",
  scenes: "scene",
  sensors: "sensor",
  rules: "rule",
  schedules: "schedule",
  resourcelinks: "resourcelink",
};
const SENSITIVE_KEY = /(authorization|credential|username|user(name)?|token|password|secret|owner|apikey|api_key)/i;
const API_PATH = /\/api\/[^/\s"']+/gi;

/**
 * Select the small graph needed to characterize one physical Sensor. The
 * traversal is structural: it never searches serialized JSON or display text.
 */
export function selectDimmerCapture(snapshot, sensorId) {
  if (!snapshot || typeof snapshot !== "object" || !sensorId) throw new Error("A Hue snapshot and Sensor ID are required.");
  const selectedSensors = new Set([String(sensorId)]);
  const primary = snapshot.sensors?.[sensorId];
  if (!primary || typeof primary !== "object") throw new Error(`Sensor ${sensorId} is not present in the supplied Hue snapshot.`);
  const uniqueid = primary && typeof primary === "object" ? primary.uniqueid : undefined;
  if (typeof uniqueid === "string" && uniqueid.trim()) {
    for (const [id, value] of Object.entries(snapshot.sensors || {})) {
      if (value && typeof value === "object" && value.uniqueid === uniqueid) selectedSensors.add(id);
    }
  }

  const ruleIds = new Set();
  const scheduleIds = new Set();
  const processedRuleIds = new Set();
  const processedScheduleIds = new Set();
  const resourceLinkIds = new Set();
  const processedResourceLinkIds = new Set();
  const targetRefs = new Map();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, value] of Object.entries(snapshot.rules || {})) {
      if (processedRuleIds.has(id)) continue;
      if (!ruleTouchesSensors(value, selectedSensors) && !resourceLinkPointsTo("rule", id, resourceLinkIds, snapshot)) continue;
      ruleIds.add(id);
      processedRuleIds.add(id);
      changed = true;
      for (const reference of ruleReferences(value)) {
        if (reference.kind === "sensor") selectedSensors.add(reference.id);
        if (reference.kind === "light" || reference.kind === "group" || reference.kind === "scene") targetRefs.set(`${reference.kind}:${reference.id}`, reference);
      }
    }
    for (const [id, value] of Object.entries(snapshot.schedules || {})) {
      if (processedScheduleIds.has(id)) continue;
      if (!scheduleTouchesSensors(value, selectedSensors) && !resourceLinkPointsTo("schedule", id, resourceLinkIds, snapshot)) continue;
      scheduleIds.add(id);
      processedScheduleIds.add(id);
      changed = true;
      for (const reference of scheduleReferences(value)) {
        if (reference.kind === "sensor") selectedSensors.add(reference.id);
        if (reference.kind === "light" || reference.kind === "group" || reference.kind === "scene") targetRefs.set(`${reference.kind}:${reference.id}`, reference);
      }
    }
    for (const [id, value] of Object.entries(snapshot.resourcelinks || {})) {
      const references = resourceLinkReferences(value);
      const alreadySelected = resourceLinkIds.has(id);
      if (!alreadySelected && !references.some((reference) => resourceLinkTouchesSelection(reference, selectedSensors, ruleIds, scheduleIds, resourceLinkIds))) continue;
      if (!alreadySelected) {
        resourceLinkIds.add(id);
        changed = true;
      }
      if (processedResourceLinkIds.has(id)) continue;
      processedResourceLinkIds.add(id);
      for (const reference of references) {
        if (reference.kind === "sensor") selectedSensors.add(reference.id);
        if (reference.kind === "rule") ruleIds.add(reference.id);
        if (reference.kind === "schedule") scheduleIds.add(reference.id);
        if (reference.kind === "light" || reference.kind === "group" || reference.kind === "scene") {
          targetRefs.set(`${reference.kind}:${reference.id}`, reference);
        }
        // Resource Links can point to other Resource Links. Keep traversing
        // those exact roots so linked helper resources are not dropped.
        if (reference.kind === "resourcelink" && !resourceLinkIds.has(reference.id)) {
          resourceLinkIds.add(reference.id);
          changed = true;
        }
      }
    }
  }

  const result = emptySnapshot();
  copySelected(result.sensors, snapshot.sensors, selectedSensors);
  copySelected(result.rules, snapshot.rules, ruleIds);
  copySelected(result.schedules, snapshot.schedules, scheduleIds);
  copySelected(result.resourcelinks, snapshot.resourcelinks, resourceLinkIds);
  for (const reference of targetRefs.values()) {
    const collection = result[`${reference.kind}s`];
    const source = snapshot[`${reference.kind}s`]?.[reference.id];
    if (source !== undefined) collection[reference.id] = source;
  }
  return result;
}

/** Sanitize after selection so credentials cannot survive in any retained field. */
export function sanitizeHueSnapshot(snapshot, sensorId) {
  const selected = selectDimmerCapture(snapshot, sensorId);
  return sanitizeValue(selected, "snapshot");
}

function emptySnapshot() {
  return { lights: {}, groups: {}, scenes: {}, sensors: {}, rules: {}, schedules: {}, resourcelinks: {} };
}

function copySelected(target, source, ids) {
  for (const id of ids) if (source?.[id] !== undefined) target[id] = source[id];
}

function ruleTouchesSensors(value, sensorIds) {
  return Array.isArray(value?.conditions) && value.conditions.some((condition) => {
    const reference = rootReference(condition?.address);
    return reference?.kind === "sensor" && sensorIds.has(reference.id);
  });
}

function scheduleTouchesSensors(value, sensorIds) {
  return scheduleReferences(value).some((reference) => reference.kind === "sensor" && sensorIds.has(reference.id));
}

function resourceLinkPointsTo(kind, id, linkIds, snapshot) {
  return [...linkIds].some((linkId) => {
    const links = snapshot.resourcelinks?.[linkId]?.links;
    return Array.isArray(links) && links.some((link) => {
      const reference = rootReference(link);
      return reference?.kind === kind && reference.id === id;
    });
  });
}

function resourceLinkReferences(value) {
  const links = Array.isArray(value?.links) ? value.links : [];
  return links.map(rootReference).filter(Boolean);
}

function resourceLinkTouchesSelection(reference, selectedSensors, ruleIds, scheduleIds, resourceLinkIds) {
  if (reference.kind === "sensor") return selectedSensors.has(reference.id);
  if (reference.kind === "rule") return ruleIds.has(reference.id);
  if (reference.kind === "schedule") return scheduleIds.has(reference.id);
  return reference.kind === "resourcelink" && resourceLinkIds.has(reference.id);
}

function ruleReferences(value) {
  const result = [];
  for (const condition of Array.isArray(value?.conditions) ? value.conditions : []) {
    const reference = rootReference(condition?.address);
    if (reference) result.push(reference);
  }
  for (const action of Array.isArray(value?.actions) ? value.actions : []) {
    const reference = rootReference(action?.address);
    if (reference) result.push(reference);
    if (reference?.kind === "group" && reference.id === "0" && action?.body?.scene !== undefined) {
      result.push({ kind: "scene", id: String(action.body.scene) });
    }
  }
  return result;
}

function scheduleReferences(value) {
  const command = value?.command;
  const result = [];
  const direct = rootReference(command?.address);
  if (direct) result.push(direct);
  if (typeof command?.resourceKind === "string" && command.resourceId !== undefined) {
    result.push({ kind: command.resourceKind === "resourcelinks" ? "resourcelink" : command.resourceKind, id: String(command.resourceId) });
    if (command.resourceKind === "scene" && command.body?.scene !== undefined) result.push({ kind: "scene", id: String(command.body.scene) });
  }
  return result.filter((reference) => RESOURCE_SEGMENTS[`${reference.kind}s`] || reference.kind === "resourcelink");
}

function rootReference(path) {
  if (typeof path !== "string" || !path.startsWith("/") || /[?#]/.test(path)) return undefined;
  const pieces = path.slice(1).split("/");
  if (pieces.some((piece) => piece.length === 0)) return undefined;
  const offset = pieces[0]?.toLowerCase() === "api" ? 2 : 0;
  const kind = RESOURCE_SEGMENTS[pieces[offset]?.toLowerCase()];
  const id = pieces[offset + 1];
  if (!kind || !id || id.includes("?") || id.includes("#")) return undefined;
  try {
    const decoded = decodeURIComponent(id);
    return decoded && !decoded.includes("/") ? { kind, id: decoded } : undefined;
  } catch (_error) {
    return undefined;
  }
}

function sanitizeValue(value, key) {
  if (SENSITIVE_KEY.test(key)) return "<redacted>";
  if (typeof value === "string") return value.replace(API_PATH, "/api/<redacted>");
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, sanitizeValue(child, childKey)]));
  }
  return value;
}

async function readSnapshotFromBridge(baseUrl, credential) {
  const collections = {};
  for (const collection of COLLECTIONS) {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/${encodeURIComponent(credential)}/${collection}`);
    if (!response.ok) throw new Error(`Hue read failed for ${collection} (${response.status}).`);
    collections[collection] = await response.json();
  }
  return collections;
}

function parseArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--input" || argument === "--output" || argument === "--sensor" || argument === "--bridge") {
      result[argument.slice(2)] = argv[index + 1];
      index += 1;
    }
  }
  return result;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const sensorId = args.sensor || process.env.HUE_DIMMER_SENSOR_ID;
  if (!sensorId) throw new Error("Provide --sensor <id> (or HUE_DIMMER_SENSOR_ID).");
  let snapshot;
  if (args.input) snapshot = JSON.parse(await readFile(args.input, "utf8"));
  else if (process.env.HUE_SNAPSHOT_INPUT) snapshot = JSON.parse(await readFile(process.env.HUE_SNAPSHOT_INPUT, "utf8"));
  else {
    const baseUrl = args.bridge || process.env.HUE_BRIDGE_URL;
    const credential = process.env.HUE_CREDENTIAL;
    if (!baseUrl || !credential) throw new Error("Provide --input <snapshot.json>, or HUE_BRIDGE_URL and HUE_CREDENTIAL for a read-only capture.");
    snapshot = await readSnapshotFromBridge(baseUrl, credential);
  }
  const output = JSON.stringify(sanitizeHueSnapshot(snapshot, String(sensorId)), null, 2) + "\n";
  if (args.output) await writeFile(args.output, output, "utf8");
  else process.stdout.write(output);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Hue capture failed.");
    process.exitCode = 1;
  });
}
