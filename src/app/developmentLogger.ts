import { redactDiagnosticMessage } from "../protocol/hue/redaction";

export type DevelopmentLogLevel = "debug" | "info" | "warn" | "error";

export type SanitizedDevelopmentValue =
  | null
  | boolean
  | number
  | string
  | SanitizedDevelopmentValue[]
  | { readonly [key: string]: SanitizedDevelopmentValue };

export interface DevelopmentLogRecord {
  readonly timestamp: string;
  readonly level: DevelopmentLogLevel;
  readonly event: string;
  readonly context?: SanitizedDevelopmentValue;
}

const PREFIX = "HOME_DASHBOARD ";
const MAX_STRING_LENGTH = 240;
const MAX_DEPTH = 4;
const MAX_ARRAY_ENTRIES = 20;
const MAX_OBJECT_KEYS = 30;
const TRUNCATED = "<truncated>";
const MAX_DEPTH_VALUE = "<max-depth>";
const CIRCULAR_VALUE = "<circular>";
const UNDEFINED_VALUE = "<undefined>";
const UNSUPPORTED_VALUE = "<unsupported>";

// Normalizing separators makes `apiKey`, `api-key`, and `api_key` equivalent.
const SENSITIVE_KEYS = new Set([
  "authorization",
  "credential",
  "username",
  "user",
  "token",
  "password",
  "secret",
  "apikey",
  "auth",
  "authtoken",
  "accesstoken",
  "refreshtoken",
  "clientsecret",
  "privatekey",
  "signingkey",
  "cookie",
  "session",
]);

const LOG_LEVELS: readonly DevelopmentLogLevel[] = ["debug", "info", "warn", "error"];

interface DevelopmentGlobal extends Record<string, unknown> {
  __DEV__?: unknown;
}

function isDevelopmentRuntime(): boolean {
  // React Native defines __DEV__ in every app build. Treat an absent flag as
  // development so the logger remains useful in Jest and other local hosts;
  // an explicit false is the production boundary.
  return (globalThis as DevelopmentGlobal).__DEV__ !== false;
}

function normalizeSensitiveKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(normalizeSensitiveKey(key));
}

function boundString(value: string): string {
  const redacted = redactDiagnosticMessage(value);
  return redacted.length > MAX_STRING_LENGTH
    ? `${redacted.slice(0, MAX_STRING_LENGTH - 1)}…`
    : redacted;
}

function safeProperty(value: object, key: string): unknown {
  try {
    return (value as Record<string, unknown>)[key];
  } catch (_error) {
    return UNSUPPORTED_VALUE;
  }
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function serializeError(value: object, depth: number, seen: Set<object>): SanitizedDevelopmentValue {
  if (seen.has(value)) return CIRCULAR_VALUE;
  seen.add(value);

  const result: Record<string, SanitizedDevelopmentValue> = {};
  const name = safeProperty(value, "name");
  const message = safeProperty(value, "message");
  const code = safeProperty(value, "code");
  const category = safeProperty(value, "category");

  if (typeof name === "string") result.name = boundString(name);
  if (typeof message === "string") result.message = boundString(message);
  if (typeof code === "string") result.code = boundString(code);
  else if (typeof code === "number" && isFiniteNumber(code)) result.code = code;
  if (typeof category === "string") result.category = boundString(category);

  // `depth` is intentionally consumed here even though Error fields are
  // scalar-only. Keeping the parameter makes recursive behavior explicit and
  // prevents a future allowlisted field from bypassing the depth contract.
  if (depth > MAX_DEPTH) return MAX_DEPTH_VALUE;
  return result;
}

function sanitizeValue(value: unknown, depth: number, seen: Set<object>): SanitizedDevelopmentValue {
  if (value === null) return null;
  if (value === undefined) return UNDEFINED_VALUE;

  switch (typeof value) {
    case "string":
      return boundString(value);
    case "boolean":
      return value;
    case "number":
      return isFiniteNumber(value) ? value : "<non-finite-number>";
    case "bigint":
      return "<bigint>";
    case "function":
    case "symbol":
      return UNSUPPORTED_VALUE;
    default:
      break;
  }

  if (value instanceof Date) {
    try {
      return boundString(value.toISOString());
    } catch (_error) {
      return "<invalid-date>";
    }
  }

  if (value instanceof Error) return serializeError(value, depth, seen);
  if (typeof value !== "object") return UNSUPPORTED_VALUE;
  if (seen.has(value)) return CIRCULAR_VALUE;
  if (depth > MAX_DEPTH) return MAX_DEPTH_VALUE;
  seen.add(value);

  if (Array.isArray(value)) {
    const result = value.slice(0, MAX_ARRAY_ENTRIES).map((entry) => sanitizeValue(entry, depth + 1, seen));
    if (value.length > MAX_ARRAY_ENTRIES) result.push(TRUNCATED);
    seen.delete(value);
    return result;
  }

  let keys: string[];
  try {
    keys = Object.keys(value).sort();
  } catch (_error) {
    seen.delete(value);
    return UNSUPPORTED_VALUE;
  }

  const result: Record<string, SanitizedDevelopmentValue> = {};
  keys.slice(0, MAX_OBJECT_KEYS).forEach((key) => {
    const safeKey = boundString(key);
    result[safeKey] = isSensitiveKey(key)
      ? "<redacted>"
      : sanitizeValue(safeProperty(value, key), depth + 1, seen);
  });
  if (keys.length > MAX_OBJECT_KEYS) result.__truncated = true;
  seen.delete(value);
  return result;
}

export function sanitizeDevelopmentMetadata(value: unknown): SanitizedDevelopmentValue {
  return sanitizeValue(value, 0, new Set<object>());
}

export function normalizeDevelopmentEventName(event: string): string {
  const normalized = String(event)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/-{2,}/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");
  return normalized || "invalid.event";
}

function normalizeLevel(level: DevelopmentLogLevel): DevelopmentLogLevel {
  return LOG_LEVELS.includes(level) ? level : "info";
}

function timestamp(): string {
  try {
    return new Date().toISOString();
  } catch (_error) {
    return "1970-01-01T00:00:00.000Z";
  }
}

export function formatDevelopmentLog(
  level: DevelopmentLogLevel,
  event: string,
  context?: unknown,
  at: string = timestamp(),
): string {
  const record: DevelopmentLogRecord = {
    timestamp: boundString(at),
    level: normalizeLevel(level),
    event: normalizeDevelopmentEventName(event),
    ...(context === undefined ? {} : { context: sanitizeDevelopmentMetadata(context) }),
  };
  return `${PREFIX}${JSON.stringify(record)}`;
}

/**
 * Emit one bounded, sanitized development event. This is intentionally the
 * only structured-event console boundary used by the active application.
 */
export function emitDevelopmentEvent(
  level: DevelopmentLogLevel,
  event: string,
  context?: unknown,
): void {
  if (!isDevelopmentRuntime()) return;

  try {
    const line = formatDevelopmentLog(level, event, context);
    const writer = (console as unknown as Record<string, (value: string) => void>)[level] || console.log;
    writer.call(console, line);
  } catch (_error) {
    // Diagnostics must never change application control flow, including when
    // a host console implementation is unavailable or throws.
  }
}

export function logDevelopmentEvent(
  level: DevelopmentLogLevel,
  event: string,
  context?: unknown,
): void {
  emitDevelopmentEvent(level, event, context);
}

export const developmentLogger = Object.freeze({
  debug: (event: string, context?: unknown): void => emitDevelopmentEvent("debug", event, context),
  info: (event: string, context?: unknown): void => emitDevelopmentEvent("info", event, context),
  warn: (event: string, context?: unknown): void => emitDevelopmentEvent("warn", event, context),
  error: (event: string, context?: unknown): void => emitDevelopmentEvent("error", event, context),
});

export const DEVELOPMENT_LOG_PREFIX = PREFIX;
