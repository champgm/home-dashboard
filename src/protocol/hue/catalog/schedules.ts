export const HUE_SCHEDULE_TIME_PATTERNS = [
  "at", "timer", "recurring", "recurring-weekly", "recurring-daily", "randomized",
] as const;

export interface HueScheduleTimePattern {
  readonly kind: string;
  readonly time?: string;
  readonly date?: string;
  readonly localtime?: string;
  readonly recurring?: boolean;
  readonly [key: string]: unknown;
}

export interface StructuredScheduleCommand {
  readonly method: "GET" | "PUT" | "POST" | "DELETE" | string;
  readonly resourceKind: "light" | "group" | "scene" | "sensor" | "rule" | "schedule" | "config" | string;
  readonly resourceId?: string;
  readonly subpath?: string;
  readonly body?: Record<string, unknown>;
  readonly authorizationCredential?: string;
}

export function parseScheduleTimePattern(value: unknown): HueScheduleTimePattern {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid Hue Schedule time pattern.");
  }
  const record = value as Record<string, unknown>;
  const kind = typeof record.kind === "string" ? record.kind : "at";
  return { ...record, kind };
}

export function parseStructuredScheduleCommand(value: unknown): StructuredScheduleCommand {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid Hue Schedule command.");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.method !== "string" || typeof record.address !== "string") {
    throw new Error("A Hue Schedule command requires method and address.");
  }
  const parts = record.address.split("/").filter(Boolean);
  const apiIndex = parts.indexOf("api");
  const withoutApi = apiIndex >= 0 ? parts.slice(apiIndex + 2) : parts;
  const resourceKind = (withoutApi[0] || "unknown") as StructuredScheduleCommand["resourceKind"];
  const resourceId = withoutApi[1];
  return {
    method: record.method as StructuredScheduleCommand["method"],
    resourceKind,
    resourceId,
    subpath: withoutApi.slice(2).join("/"),
    ...(record.body && typeof record.body === "object" ? { body: record.body as Record<string, unknown> } : {}),
    ...(apiIndex >= 0 && parts[apiIndex + 1] ? { authorizationCredential: parts[apiIndex + 1] } : {}),
  };
}

export function serializeStructuredScheduleCommand(
  command: StructuredScheduleCommand,
  credential?: string,
): Record<string, unknown> {
  // Parsed authorization is retained only as an internal marker for policy
  // and rebuild decisions. Never copy it into an ordinary serialization;
  // callers must explicitly supply the current credential.
  const authorization = credential || "<redacted>";
  const address = `/api/${authorization}/${command.resourceKind}${command.resourceId ? `/${command.resourceId}` : ""}${command.subpath ? `/${command.subpath}` : ""}`;
  return {
    address,
    method: command.method,
    ...(command.body === undefined ? {} : { body: command.body }),
  };
}

export function rebuildScheduleCommandAuthorization(command: StructuredScheduleCommand, credential: string): Record<string, unknown> {
  if (!credential) {
    throw new Error("A current Hue credential is required.");
  }
  return serializeStructuredScheduleCommand({ ...command, authorizationCredential: credential }, credential);
}
