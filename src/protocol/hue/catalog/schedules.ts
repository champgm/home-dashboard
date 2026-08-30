import { valuesEqual } from "../changedFields";

export const HUE_SCHEDULE_TIME_PATTERNS = [
  "at", "timer", "recurring", "recurring-weekly", "recurring-daily", "randomized",
] as const;

export type HueScheduleTimePatternKind = typeof HUE_SCHEDULE_TIME_PATTERNS[number];

export const HUE_WEEKDAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

export type HueScheduleWeekday = typeof HUE_WEEKDAYS[number];

// Hue V1 encodes Monday through Sunday as 64, 32, 16, 8, 4, 2, 1.
export const HUE_WEEKDAY_BITS: Readonly<Record<HueScheduleWeekday, number>> = {
  monday: 64,
  tuesday: 32,
  wednesday: 16,
  thursday: 8,
  friday: 4,
  saturday: 2,
  sunday: 1,
};

interface HueScheduleTimePatternBase {
  readonly kind: HueScheduleTimePatternKind;
  readonly time?: string;
  readonly date?: string;
  readonly localtime?: string;
  readonly recurring?: boolean;
  readonly weekdays?: readonly HueScheduleWeekday[];
  readonly randomSeconds?: number;
}

export interface HueAtTimePattern extends HueScheduleTimePatternBase {
  readonly kind: "at";
}

export interface HueTimerTimePattern extends HueScheduleTimePatternBase {
  readonly kind: "timer";
  readonly time: string;
}

export interface HueRecurringTimePattern extends HueScheduleTimePatternBase {
  readonly kind: "recurring";
  readonly localtime: string;
  readonly recurring: true;
}

export interface HueRecurringDailyTimePattern extends HueScheduleTimePatternBase {
  readonly kind: "recurring-daily";
  readonly localtime: string;
  readonly recurring: true;
}

export interface HueRecurringWeeklyTimePattern extends HueScheduleTimePatternBase {
  readonly kind: "recurring-weekly";
  readonly localtime: string;
  readonly recurring: true;
  readonly weekdays: readonly HueScheduleWeekday[];
}

export interface HueRandomizedTimePattern extends HueScheduleTimePatternBase {
  readonly kind: "randomized";
  readonly localtime: string;
  readonly weekdays: readonly HueScheduleWeekday[];
  readonly randomSeconds: number;
}

export type HueScheduleTimePattern =
  | HueAtTimePattern
  | HueTimerTimePattern
  | HueRecurringTimePattern
  | HueRecurringDailyTimePattern
  | HueRecurringWeeklyTimePattern
  | HueRandomizedTimePattern;

export type ScheduleTimePatternValidation = {
  readonly allowed: true;
} | {
  readonly allowed: false;
  readonly path: string;
  readonly reason: string;
};

export interface StructuredScheduleCommand {
  readonly method: "GET" | "PUT" | "POST" | "DELETE" | string;
  readonly resourceKind: "light" | "group" | "scene" | "sensor" | "rule" | "schedule" | "config" | string;
  readonly resourceId?: string;
  readonly subpath?: string;
  readonly body?: Record<string, unknown>;
  readonly authorizationCredential?: string;
  /** Present only when the bridge returned an address that could not be parsed safely. */
  readonly address?: string;
  readonly raw?: Record<string, unknown>;
}

const TIME_PATTERN_KEYS = new Set(["kind", "time", "date", "localtime", "recurring", "weekdays", "randomSeconds"]);
const CLOCK_TIME = /^T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
const SHORT_CLOCK_TIME = /^T(?:[01]\d|2[0-3]):[0-5]\d$/;
const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T([0-2]\d):([0-5]\d)(?::([0-5]\d))?(?:Z)?$/;
const DURATION = /^PT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

export function validateScheduleTimePattern(value: unknown): ScheduleTimePatternValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalid("timePattern", "Schedule time patterns must be structured objects.");
  }
  const pattern = value as Record<string, unknown>;
  const kind = pattern.kind;
  if (typeof kind !== "string" || !HUE_SCHEDULE_TIME_PATTERNS.includes(kind as HueScheduleTimePatternKind)) {
    return invalid("timePattern.kind", "Schedule time pattern kind is not supported.");
  }
  const unknownKey = Object.keys(pattern).find((key) => !TIME_PATTERN_KEYS.has(key));
  if (unknownKey) return invalid(`timePattern.${unknownKey}`, "The time pattern field is not supported.");
  for (const key of ["time", "date", "localtime"]) {
    if (pattern[key] !== undefined && typeof pattern[key] !== "string") {
      return invalid(`timePattern.${key}`, "Schedule time pattern values must be strings.");
    }
  }
  if (pattern.recurring !== undefined && typeof pattern.recurring !== "boolean") {
    return invalid("timePattern.recurring", "Schedule recurrence must be boolean.");
  }
  const weekdays = validateWeekdays(pattern.weekdays);
  if (!weekdays.allowed) return weekdays;
  if (pattern.randomSeconds !== undefined && (!Number.isInteger(pattern.randomSeconds) || (pattern.randomSeconds as number) < 1 || (pattern.randomSeconds as number) > 86399)) {
    return invalid("timePattern.randomSeconds", "Randomization must be a whole number of seconds from 1 through 86399.");
  }
  if (pattern.date !== undefined && !isDateTime(pattern.date as string)) {
    return invalid("timePattern.date", "The schedule start date must be an ISO local date-time.");
  }

  switch (kind as HueScheduleTimePatternKind) {
    case "at":
      if (!isAbsoluteTime(stringValue(pattern.localtime) || stringValue(pattern.time))) return invalid("timePattern.localtime", "An absolute schedule requires T##:##:## or an ISO date-time.");
      if (pattern.recurring === true || pattern.weekdays !== undefined || pattern.randomSeconds !== undefined || pattern.date !== undefined) {
        return invalid("timePattern", "An absolute schedule cannot include recurrence, weekdays, randomization, or a start date.");
      }
      break;
    case "timer":
      if (!stringValue(pattern.time) || !DURATION.test(pattern.time as string)) return invalid("timePattern.time", "Timer schedules require a PT##:##:## duration with a maximum of 23 hours.");
      if (pattern.localtime !== undefined || pattern.date !== undefined || pattern.weekdays !== undefined || pattern.randomSeconds !== undefined) {
        return invalid("timePattern", "A timer cannot include a local time, date, weekdays, or randomization.");
      }
      break;
    case "recurring":
      if (!isClock(stringValue(pattern.localtime) || stringValue(pattern.time))) return invalid("timePattern.localtime", "A recurring schedule requires a T##:##:## local time.");
      if (pattern.recurring !== true) return invalid("timePattern.recurring", "A recurring schedule must set recurring to true.");
      break;
    case "recurring-daily":
      if (!isClock(stringValue(pattern.localtime))) return invalid("timePattern.localtime", "A daily schedule requires a T##:##:## local time.");
      if (pattern.recurring !== true) return invalid("timePattern.recurring", "A daily schedule must set recurring to true.");
      if (pattern.weekdays !== undefined || pattern.randomSeconds !== undefined) return invalid("timePattern", "A daily schedule does not use a weekday subset or randomization.");
      break;
    case "recurring-weekly":
      if (!isClock(stringValue(pattern.localtime))) return invalid("timePattern.localtime", "A weekly schedule requires a T##:##:## local time.");
      if (pattern.recurring !== true) return invalid("timePattern.recurring", "A weekly schedule must set recurring to true.");
      if (!Array.isArray(pattern.weekdays) || pattern.weekdays.length === 0) return invalid("timePattern.weekdays", "A weekly schedule requires at least one weekday.");
      if (pattern.randomSeconds !== undefined) return invalid("timePattern.randomSeconds", "Weekly schedules do not use randomization.");
      break;
    case "randomized":
      if (!isClock(stringValue(pattern.localtime))) return invalid("timePattern.localtime", "A randomized schedule requires a T##:##:## local time.");
      if (!Array.isArray(pattern.weekdays) || pattern.weekdays.length === 0) return invalid("timePattern.weekdays", "A randomized schedule requires at least one weekday.");
      if (typeof pattern.randomSeconds !== "number") return invalid("timePattern.randomSeconds", "A randomized schedule requires a randomization window in seconds.");
      break;
  }
  return { allowed: true };
}

function invalid(path: string, reason: string): ScheduleTimePatternValidation {
  return { allowed: false, path, reason };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isClock(value: string | undefined): boolean {
  return Boolean(value && (CLOCK_TIME.test(value) || SHORT_CLOCK_TIME.test(value)));
}

function isDateTime(value: string): boolean {
  const match = value.match(DATE_TIME);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || "0");
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isAbsoluteTime(value: string | undefined): boolean {
  return Boolean(value && (isClock(value) || isDateTime(value)));
}

function validateWeekdays(value: unknown): ScheduleTimePatternValidation {
  if (value === undefined) return { allowed: true };
  if (!Array.isArray(value) || value.length === 0 || value.some((day) => typeof day !== "string" || !HUE_WEEKDAYS.includes(day as HueScheduleWeekday))) {
    return invalid("timePattern.weekdays", "Weekdays must be a non-empty list of supported weekday names.");
  }
  if (new Set(value).size !== value.length) return invalid("timePattern.weekdays", "Weekdays must not be duplicated.");
  return { allowed: true };
}

export function parseScheduleTimePattern(value: unknown): HueScheduleTimePattern {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid Hue Schedule time pattern.");
  }
  const record = value as Record<string, unknown>;
  const kind = typeof record.kind === "string" ? record.kind : "at";
  if (!HUE_SCHEDULE_TIME_PATTERNS.includes(kind as HueScheduleTimePatternKind)) {
    throw new Error("Unsupported Hue Schedule time pattern.");
  }
  const copy = { ...record, kind } as Record<string, unknown>;
  if (kind === "recurring-weekly" && !Array.isArray(copy.weekdays)) copy.weekdays = [...HUE_WEEKDAYS];
  if (kind === "randomized" && typeof copy.randomSeconds !== "number") copy.randomSeconds = 1;
  return copy as unknown as HueScheduleTimePattern;
}

export function inferScheduleTimePattern(raw: Record<string, unknown>): HueScheduleTimePattern {
  const candidate = typeof raw.localtime === "string" ? raw.localtime : typeof raw.time === "string" ? raw.time : undefined;
  const starttime = typeof raw.starttime === "string" ? raw.starttime : undefined;
  const recurring = raw.recurring === true;
  if (candidate) {
    const bridgePattern = parseBridgeTimePattern(candidate, starttime, recurring);
    if (bridgePattern) return bridgePattern;
    if (DURATION.test(candidate)) return { kind: "timer", time: candidate };
    if (recurring) return { kind: "recurring-daily", localtime: candidate, recurring: true };
    return { kind: "at", localtime: candidate };
  }
  return recurring
    ? { kind: "recurring-daily", localtime: "T00:00:00", recurring: true }
    : { kind: "at", localtime: "T00:00:00" };
}

function parseBridgeTimePattern(value: string, date: string | undefined, recurring: boolean): HueScheduleTimePattern | undefined {
  const randomized = value.match(/^W(\d{3})\/(T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d)A((?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d)$/);
  if (randomized) {
    return {
      kind: "randomized",
      localtime: randomized[2],
      weekdays: maskToWeekdays(Number(randomized[1])),
      randomSeconds: durationToSeconds(randomized[3]),
      ...(date ? { date } : {}),
      recurring,
    };
  }
  const repeated = value.match(/^W(\d{3})\/(T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d)$/);
  if (repeated) {
    const weekdays = maskToWeekdays(Number(repeated[1]));
    return repeated[1] === "127"
      ? { kind: "recurring-daily", localtime: repeated[2], recurring: true, ...(date ? { date } : {}) }
      : { kind: "recurring-weekly", localtime: repeated[2], weekdays, recurring: true, ...(date ? { date } : {}) };
  }
  const recurringTimer = value.match(/^R(?:\d+)?\/(PT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d)$/);
  if (recurringTimer) return { kind: "timer", time: recurringTimer[1], recurring: true };
  return undefined;
}

function durationToSeconds(value: string): number {
  const [hours, minutes, seconds] = value.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function maskToWeekdays(mask: number): HueScheduleWeekday[] {
  return HUE_WEEKDAYS.filter((day) => (mask & HUE_WEEKDAY_BITS[day]) !== 0);
}

function weekdaysToMask(weekdays: readonly HueScheduleWeekday[] | undefined): number {
  return (weekdays && weekdays.length > 0 ? weekdays : HUE_WEEKDAYS).reduce((mask, day) => mask + HUE_WEEKDAY_BITS[day], 0);
}

function clockValue(pattern: HueScheduleTimePattern): string {
  const value = pattern.localtime || pattern.time;
  if (!value || !isClock(value)) throw new Error("A recurring schedule requires a valid local clock time.");
  return value;
}

function durationFromSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function serializeScheduleTimePattern(pattern: HueScheduleTimePattern): Record<string, unknown> {
  const validation = validateScheduleTimePattern(pattern);
  if (!validation.allowed) throw new Error(validation.reason);
  switch (pattern.kind) {
    case "timer":
      return { time: pattern.recurring ? `R/${pattern.time}` : pattern.time, recurring: false };
    case "recurring":
      return { localtime: `W${String(weekdaysToMask(pattern.weekdays)).padStart(3, "0")}/${clockValue(pattern)}`, recurring: true, ...(pattern.date ? { starttime: pattern.date } : {}) };
    case "recurring-daily":
      return { localtime: `W127/${clockValue(pattern)}`, recurring: true, ...(pattern.date ? { starttime: pattern.date } : {}) };
    case "recurring-weekly":
      return { localtime: `W${String(weekdaysToMask(pattern.weekdays)).padStart(3, "0")}/${clockValue(pattern)}`, recurring: true, ...(pattern.date ? { starttime: pattern.date } : {}) };
    case "randomized":
      return { localtime: `W${String(weekdaysToMask(pattern.weekdays)).padStart(3, "0")}/${clockValue(pattern)}A${durationFromSeconds(pattern.randomSeconds)}`, recurring: pattern.recurring !== false, ...(pattern.date ? { starttime: pattern.date } : {}) };
    case "at":
      return { localtime: pattern.localtime || pattern.time, recurring: false };
  }
}

export function parseStructuredScheduleCommand(value: unknown): StructuredScheduleCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { method: "UNKNOWN", resourceKind: "unknown", raw: {} };
  }
  const record = value as Record<string, unknown>;
  const method = typeof record.method === "string" ? record.method : "UNKNOWN";
  if (typeof record.address !== "string") {
    if (typeof record.resourceKind === "string") {
      return {
        method,
        resourceKind: record.resourceKind,
        ...(typeof record.resourceId === "string" ? { resourceId: record.resourceId } : {}),
        ...(typeof record.subpath === "string" ? { subpath: record.subpath } : {}),
        ...(record.body && typeof record.body === "object" && !Array.isArray(record.body) ? { body: record.body as Record<string, unknown> } : {}),
        ...(typeof record.authorizationCredential === "string" ? { authorizationCredential: record.authorizationCredential } : {}),
        ...(record.raw && typeof record.raw === "object" && !Array.isArray(record.raw) ? { raw: record.raw as Record<string, unknown> } : {}),
      };
    }
    return {
      method,
      resourceKind: "unknown",
      ...(record.body && typeof record.body === "object" && !Array.isArray(record.body) ? { body: record.body as Record<string, unknown> } : {}),
      raw: { ...record },
    };
  }
  const parts = record.address.split("/").filter(Boolean);
  const apiIndex = parts.indexOf("api");
  const withoutApi = apiIndex >= 0 ? parts.slice(apiIndex + 2) : parts;
  const rawResourceKind = withoutApi[0] || "unknown";
  let resourceKind = (({ lights: "light", groups: "group", scenes: "scene", sensors: "sensor", rules: "rule", schedules: "schedule" } as Record<string, string>)[rawResourceKind] || rawResourceKind) as StructuredScheduleCommand["resourceKind"];
  let resourceId = withoutApi[1];
  if (resourceKind === "group" && resourceId === "0" && record.body && typeof record.body === "object" && typeof (record.body as Record<string, unknown>).scene === "string") {
    resourceKind = "scene";
    resourceId = (record.body as Record<string, unknown>).scene as string;
  }
  return {
    method: method as StructuredScheduleCommand["method"],
    resourceKind,
    resourceId,
    subpath: withoutApi.slice(2).join("/"),
    ...(record.body && typeof record.body === "object" ? { body: record.body as Record<string, unknown> } : {}),
    ...(apiIndex >= 0 && parts[apiIndex + 1] ? { authorizationCredential: parts[apiIndex + 1] } : {}),
  };
}

/**
 * Authorization credentials are parser metadata, not part of the command
 * semantics. Comparing them would make an ordinary editor save look like an
 * explicit command rebuild.
 */
export function scheduleCommandsEqual(left: unknown, right: unknown): boolean {
  return valuesEqual(withoutAuthorizationMetadata(left), withoutAuthorizationMetadata(right));
}

function withoutAuthorizationMetadata(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const { authorizationCredential: _authorizationCredential, ...command } = value as Record<string, unknown>;
  return command;
}

export function serializeStructuredScheduleCommand(
  command: StructuredScheduleCommand,
  credential?: string,
): Record<string, unknown> {
  // Parsed authorization is retained only as an internal marker for policy
  // and rebuild decisions. Never copy it into an ordinary serialization;
  // callers must explicitly supply the current credential.
  const authorization = credential || "<redacted>";
  const resourceKind = command.resourceKind === "scene"
    ? "groups"
    : ({ light: "lights", group: "groups", sensor: "sensors", rule: "rules", schedule: "schedules" } as Record<string, string>)[command.resourceKind] || command.resourceKind;
  const resourceId = command.resourceKind === "scene" ? "0" : command.resourceId;
  const subpath = command.resourceKind === "scene" ? "action" : command.subpath;
  const body = command.resourceKind === "scene" ? (command.body || { scene: command.resourceId }) : command.body;
  const address = `/api/${authorization}/${resourceKind}${resourceId ? `/${resourceId}` : ""}${subpath ? `/${subpath}` : ""}`;
  return {
    address,
    method: command.method,
    ...(body === undefined ? {} : { body }),
  };
}

export function rebuildScheduleCommandAuthorization(command: StructuredScheduleCommand, credential: string): Record<string, unknown> {
  if (!credential) {
    throw new Error("A current Hue credential is required.");
  }
  return serializeStructuredScheduleCommand({ ...command, authorizationCredential: credential }, credential);
}
