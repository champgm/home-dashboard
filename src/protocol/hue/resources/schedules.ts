import { changedFields } from "../changedFields";
import { parseScheduleTimePattern, parseStructuredScheduleCommand, serializeStructuredScheduleCommand, StructuredScheduleCommand, HueScheduleTimePattern } from "../catalog/schedules";

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
  readonly [key: string]: unknown;
}

export function parseSchedules(collection: Record<string, unknown>): Record<string, HueSchedule> {
  return Object.keys(collection).reduce((result, id) => {
    const raw = (collection[id] && typeof collection[id] === "object" ? collection[id] : {}) as Record<string, unknown>;
    const command = raw.command === undefined ? undefined : parseStructuredScheduleCommand(raw.command);
    result[id] = {
      ...raw,
      id,
      ...(command ? { command } : {}),
      ...(raw.timePattern ? { timePattern: parseScheduleTimePattern(raw.timePattern) } : {}),
    } as HueSchedule;
    return result;
  }, {} as Record<string, HueSchedule>);
}

export function buildScheduleUpdate(original: Partial<HueSchedule> | undefined, draft: Partial<HueSchedule>): Partial<Record<string, unknown>> {
  const result = changedFields(
    original as Record<string, unknown> | undefined,
    draft as Record<string, unknown>,
    ["name", "description", "status", "localtime", "time", "starttime", "recurring", "autodelete", "timePattern", "command"] as readonly (keyof HueSchedule)[],
  ) as Partial<Record<string, unknown>>;
  // The credential-bearing command address is emitted only when command is
  // intentionally changed. Ordinary saves therefore omit it completely.
  if (result.command) {
    result.command = serializeStructuredScheduleCommand(result.command as StructuredScheduleCommand);
  }
  return result;
}

export function scheduleIsEnabled(schedule: HueSchedule): boolean | undefined {
  if (schedule.status === "enabled") return true;
  if (schedule.status === "disabled") return false;
  return undefined;
}
