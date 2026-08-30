import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const COLLECTIONS = ["lights", "groups", "scenes", "sensors", "rules", "schedules", "resourcelinks"];
const SENSITIVE_KEY = /(authorization|credential|username|user(name)?|token|password|secret|owner|apikey|api_key|whitelist)/i;
const API_PATH = /\/api\/[^/\s"']+/gi;
const DEFAULT_BRIDGE_FILE = "hue_bridge_ip";
const DEFAULT_CREDENTIAL_FILE = "hue_bridge_token";
const DEFAULT_OUTPUT = ".local/hue-snapshot.json";

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

/**
 * Keep only the Hue snapshot collections used by the application and sanitize
 * credential-bearing fields before the aggregate can be written to disk.
 */
export function sanitizeHueAggregate(aggregate) {
  if (!aggregate || typeof aggregate !== "object" || Array.isArray(aggregate)) {
    throw new Error("Hue returned a malformed aggregate snapshot.");
  }
  for (const collection of COLLECTIONS) {
    if (!aggregate[collection] || typeof aggregate[collection] !== "object" || Array.isArray(aggregate[collection])) {
      throw new Error(`Hue aggregate snapshot is missing the ${collection} collection.`);
    }
  }
  const snapshot = Object.fromEntries(COLLECTIONS.map((collection) => [collection, record(aggregate[collection])]));
  if (aggregate.config !== undefined) snapshot.config = record(aggregate.config);
  if (aggregate.capabilities !== undefined) snapshot.capabilities = record(aggregate.capabilities);
  return sanitizeValue(snapshot, "snapshot");
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

export function sensorInventory(snapshot) {
  return Object.entries(record(snapshot?.sensors))
    .map(([id, raw]) => {
      const sensor = record(raw);
      const state = record(sensor.state);
      return {
        id,
        name: text(sensor.name) || text(sensor.productname) || "(unnamed)",
        type: text(sensor.type) || "-",
        manufacturer: text(sensor.manufacturername) || "-",
        model: text(sensor.modelid) || "-",
        buttonEvent: Number.isInteger(state.buttonevent) ? String(state.buttonevent) : "-",
      };
    })
    .sort((left, right) => compareIds(left.id, right.id));
}

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function compareIds(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isInteger(leftNumber) && Number.isInteger(rightNumber)) return leftNumber - rightNumber;
  return left.localeCompare(right);
}

export function formatSensorInventory(snapshot) {
  const rows = sensorInventory(snapshot);
  if (rows.length === 0) return "No Sensors were returned by the bridge.\n";
  const headings = { id: "ID", name: "Name", type: "Type", manufacturer: "Manufacturer", model: "Model", buttonEvent: "Button event" };
  const keys = Object.keys(headings);
  const widths = Object.fromEntries(keys.map((key) => [key, Math.max(headings[key].length, ...rows.map((row) => row[key].length))]));
  const line = (row) => keys.map((key) => row[key].padEnd(widths[key])).join("  ").trimEnd();
  return `${line(headings)}\n${rows.map(line).join("\n")}\n`;
}

export function normalizeBridgeUrl(value) {
  const trimmed = text(value);
  if (!trimmed) throw new Error("The Hue bridge address is empty.");
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch (_error) {
    throw new Error("The Hue bridge address is invalid.");
  }
  if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || !parsed.hostname) {
    throw new Error("The Hue bridge address must be an HTTP(S) URL without embedded credentials.");
  }
  parsed.pathname = parsed.pathname.replace(/\/$/, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

export async function readHueAggregate(baseUrl, credential, request = globalThis.fetch) {
  const normalizedUrl = normalizeBridgeUrl(baseUrl);
  const normalizedCredential = text(credential);
  if (!normalizedCredential) throw new Error("The Hue bridge credential is empty.");
  let response;
  try {
    response = await request(`${normalizedUrl}/api/${encodeURIComponent(normalizedCredential)}`, { method: "GET" });
  } catch (error) {
    const code = error?.cause?.code;
    const safeCode = typeof code === "string" && /^[A-Z0-9_]+$/.test(code) ? ` (${code})` : "";
    throw new Error(`Hue snapshot read failed before a response was received${safeCode}.`);
  }
  if (!response?.ok) throw new Error(`Hue snapshot read failed (${response?.status || "no status"}).`);
  let aggregate;
  try {
    aggregate = await response.json();
  } catch (_error) {
    throw new Error("Hue returned a non-JSON snapshot response.");
  }
  return sanitizeHueAggregate(aggregate);
}

export async function writeSnapshot(outputPath, snapshot, force = false) {
  const output = text(outputPath);
  if (!output) throw new Error("The snapshot output path is empty.");
  await mkdir(dirname(output), { recursive: true });
  try {
    await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, { encoding: "utf8", flag: force ? "w" : "wx", mode: 0o600 });
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error(`Snapshot output already exists: ${output}. Use --force to replace it.`);
    throw error;
  }
}

function parseArguments(argv) {
  const result = { force: false, listSensors: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--bridge", "--bridge-file", "--credential-file", "--output"].includes(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
      result[argument.slice(2).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase())] = value;
      index += 1;
    } else if (argument === "--force") result.force = true;
    else if (argument === "--list-sensors") result.listSensors = true;
    else if (argument === "--help") result.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return result;
}

function usage() {
  return [
    "Usage: node scripts/capture-hue-snapshot.mjs [options]",
    "",
    "Options:",
    `  --output <path>           Sanitized output (default: ${DEFAULT_OUTPUT})`,
    "  --bridge <url-or-ip>      Bridge address; otherwise HUE_BRIDGE_URL or hue_bridge_ip",
    "  --bridge-file <path>      File containing the bridge address",
    "  --credential-file <path>  Credential file (default: hue_bridge_token)",
    "  --list-sensors            Print a Sensor inventory after capture",
    "  --force                   Replace an existing output file",
    "  --help                    Show this help",
    "",
    "HUE_CREDENTIAL may supply the credential without a file.",
  ].join("\n");
}

async function readTrimmed(path, description) {
  try {
    return (await readFile(path, "utf8")).trim();
  } catch (_error) {
    throw new Error(`Could not read the ${description} file: ${path}.`);
  }
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const bridge = args.bridge || process.env.HUE_BRIDGE_URL
    || await readTrimmed(args.bridgeFile || DEFAULT_BRIDGE_FILE, "Hue bridge address");
  const credential = process.env.HUE_CREDENTIAL
    || await readTrimmed(args.credentialFile || DEFAULT_CREDENTIAL_FILE, "Hue credential");
  const snapshot = await readHueAggregate(bridge, credential);
  const output = args.output || DEFAULT_OUTPUT;
  await writeSnapshot(output, snapshot, args.force);
  process.stdout.write(`Sanitized Hue snapshot written to ${output}.\n`);
  if (args.listSensors) process.stdout.write(formatSensorInventory(snapshot));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Hue snapshot capture failed.");
    process.exitCode = 1;
  });
}
