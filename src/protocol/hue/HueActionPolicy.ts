import { HueRuleAction } from "./catalog/rules";
import { StructuredScheduleCommand } from "./catalog/schedules";
import { stripCredentialBearingPath } from "./redaction";

export type HueActionDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string };

const forbiddenPathFragments = [
  "/config",
  "/capabilities",
  "/users",
  "/update",
  "/reset",
  "/network",
  "/factory",
  "/reboot",
];

export function validateImmediateAction(method: string, path: string, body?: unknown): HueActionDecision {
  const normalizedMethod = method.toUpperCase();
  const normalizedPath = stripCredentialBearingPath(path).toLowerCase();
  if (normalizedMethod === "DELETE") {
    return { allowed: false, reason: "Automation actions may not delete resources." };
  }
  if (forbiddenPathFragments.some((fragment) => normalizedPath.includes(fragment))) {
    return { allowed: false, reason: "Automation actions may not administer the Hue bridge." };
  }
  if (!["/lights/", "/groups/", "/scenes/", "/sensors/", "/rules/", "/schedules/"].some((fragment) => normalizedPath.includes(fragment))) {
    return { allowed: false, reason: "The action target is not a supported Hue resource." };
  }
  if (body && typeof body === "object" && containsForbiddenOperation(body)) {
    return { allowed: false, reason: "The action body contains a prohibited bridge operation." };
  }
  if (!["GET", "PUT", "POST"].includes(normalizedMethod)) {
    return { allowed: false, reason: "The action method is not supported by the structured editor." };
  }
  return { allowed: true };
}

function containsForbiddenOperation(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsForbiddenOperation);
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => {
    const lowerKey = key.toLowerCase();
    if (["firmware", "reset", "factoryreset", "network", "username", "whitelist"].some((word) => lowerKey.includes(word))) {
      return true;
    }
    return typeof child === "string" && forbiddenPathFragments.some((fragment) => child.toLowerCase().includes(fragment));
  }) || Object.values(value as Record<string, unknown>).some(containsForbiddenOperation);
}

export function validateStructuredRuleAction(action: HueRuleAction): HueActionDecision {
  return validateImmediateAction(action.method, action.address, action.body);
}

export function validateStructuredScheduleCommand(command: StructuredScheduleCommand): HueActionDecision {
  const path = `/api/<redacted>/${command.resourceKind}${command.resourceId ? `/${command.resourceId}` : ""}${command.subpath ? `/${command.subpath}` : ""}`;
  return validateImmediateAction(command.method, path, command.body);
}

export function automationCanBeEnabled(actions: ReadonlyArray<HueRuleAction | StructuredScheduleCommand>): HueActionDecision {
  for (const action of actions) {
    const decision = "address" in action
      ? validateStructuredRuleAction(action as HueRuleAction)
      : validateStructuredScheduleCommand(action as StructuredScheduleCommand);
    if (!decision.allowed) {
      return decision;
    }
  }
  return { allowed: true };
}

export function validateRulePayload(payload: Record<string, unknown>): HueActionDecision {
  if (!Array.isArray(payload.actions)) return { allowed: true };
  for (const action of payload.actions) {
    if (!action || typeof action !== "object") return { allowed: false, reason: "Rule actions must use structured objects." };
    const value = action as Record<string, unknown>;
    if (typeof value.address !== "string" || typeof value.method !== "string") {
      return { allowed: false, reason: "Rule actions require a method and resource address." };
    }
    const decision = validateImmediateAction(value.method, value.address, value.body);
    if (!decision.allowed) return decision;
  }
  return { allowed: true };
}

export function validateSchedulePayload(payload: Record<string, unknown>): HueActionDecision {
  if (!Object.prototype.hasOwnProperty.call(payload, "command")) return { allowed: true };
  const command = payload.command;
  if (!command || typeof command !== "object") return { allowed: false, reason: "Schedule commands must use structured objects." };
  const value = command as Record<string, unknown>;
  if (typeof value.address === "string" && typeof value.method === "string") {
    return validateImmediateAction(value.method, value.address, value.body);
  }
  if (typeof value.resourceKind !== "string" || typeof value.method !== "string") {
    return { allowed: false, reason: "Schedule commands require a method and resource target." };
  }
  return validateStructuredScheduleCommand(value as unknown as StructuredScheduleCommand);
}
