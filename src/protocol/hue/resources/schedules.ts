import { changedFields } from "../changedFields";
import { inferScheduleTimePattern, parseScheduleTimePattern, parseStructuredScheduleCommand, scheduleCommandsEqual, serializeScheduleTimePattern, serializeStructuredScheduleCommand, StructuredScheduleCommand, HueScheduleTimePattern } from "../catalog/schedules";
import { redactHueCredential } from "../redaction";

export interface HueSchedule {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly status?: "enabled" | "disabled" | string;
  readonly localtime?: string;
  readonly time?: string;
  readonly starttime?: string;
  readonly recurring?: boolean;
  readonly autodelete?: boolean;
  readonly command?: StructuredScheduleCommand;
  readonly timePattern?: HueScheduleTimePattern;
  /** Retained when the bridge supplied an unsupported pattern so the record remains inspectable. */
  readonly timePatternRaw?: unknown;
  readonly [key: string]: unknown;
}

export function parseSchedules(collection: Record<string, unknown>): Record<string, HueSchedule> {
  return Object.keys(collection).reduce((result, id) => {
    const raw = (collection[id] && typeof collection[id] === "object" ? collection[id] : {}) as Record<string, unknown>;
    const command = raw.command === undefined ? undefined : parseStructuredScheduleCommand(raw.command);
    const timePattern = parseTimePatternSafely(raw);
    result[id] = {
      ...raw,
      id,
      ...(command ? { command } : {}),
      timePattern: timePattern.value,
      ...(timePattern.raw === undefined ? {} : { timePatternRaw: timePattern.raw }),
    } as HueSchedule;
    return result;
  }, {} as Record<string, HueSchedule>);
}

export function buildScheduleUpdate(original: Partial<HueSchedule> | undefined, draft: Partial<HueSchedule>): Partial<Record<string, unknown>> {
  const result = changedFields(
    original as Record<string, unknown> | undefined,
    draft as Record<string, unknown>,
    ["name", "description", "status", "localtime", "time", "starttime", "recurring", "autodelete", "timePattern"] as readonly (keyof HueSchedule)[],
  ) as Partial<Record<string, unknown>>;
  if (Object.prototype.hasOwnProperty.call(draft, "command") && !scheduleCommandsEqual(original?.command, draft.command)) {
    const command = draft.command as StructuredScheduleCommand;
    result.command = typeof command.address === "string"
      ? { address: redactHueCredential(command.address), method: command.method, ...(command.body === undefined ? {} : { body: command.body }) }
      : serializeStructuredScheduleCommand(command);
  }
  if (result.timePattern) {
    const patternFields = serializeScheduleTimePattern(result.timePattern as HueScheduleTimePattern);
    delete result.timePattern;
    Object.assign(result, patternFields);
  }
  return result;
}

function parseTimePatternSafely(raw: Record<string, unknown>): { readonly value: HueScheduleTimePattern; readonly raw?: unknown } {
  if (raw.timePattern === undefined || raw.timePattern === null) return { value: inferScheduleTimePattern(raw) };
  try {
    return { value: parseScheduleTimePattern(raw.timePattern) };
  } catch (_error) {
    return { value: inferScheduleTimePattern(raw), raw: raw.timePattern };
  }
}

export function scheduleIsEnabled(schedule: HueSchedule): boolean | undefined {
  if (schedule.status === "enabled") return true;
  if (schedule.status === "disabled") return false;
  return undefined;
}
