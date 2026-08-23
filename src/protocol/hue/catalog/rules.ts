export const HUE_RULE_CONDITION_OPERATORS = [
  "eq", "neq", "gt", "lt", "dx", "stable", "ddx", "in", "not in",
] as const;

export type HueRuleConditionOperator = typeof HUE_RULE_CONDITION_OPERATORS[number];

export interface HueRuleCondition {
  readonly address: string;
  readonly operator: HueRuleConditionOperator | string;
  readonly value?: string;
}

export interface HueRuleAction {
  readonly address: string;
  readonly method: "GET" | "PUT" | "POST" | "DELETE" | string;
  readonly body?: Record<string, unknown>;
}

export const HUE_RULE_ACTION_METHODS = ["GET", "PUT", "POST"] as const;

export function parseRuleCondition(value: unknown): HueRuleCondition {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid Hue Rule condition.");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.address !== "string" || typeof record.operator !== "string") {
    throw new Error("Hue Rule condition requires address and operator.");
  }
  return {
    address: record.address,
    operator: record.operator,
    ...(typeof record.value === "string" ? { value: record.value } : {}),
  };
}

export function parseRuleAction(value: unknown): HueRuleAction {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid Hue Rule action.");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.address !== "string" || typeof record.method !== "string") {
    throw new Error("Hue Rule action requires address and method.");
  }
  return {
    address: record.address,
    method: record.method,
    ...(record.body && typeof record.body === "object" ? { body: record.body as Record<string, unknown> } : {}),
  };
}

export function serializeRuleCondition(condition: HueRuleCondition): Record<string, unknown> {
  return { address: condition.address, operator: condition.operator, ...(condition.value === undefined ? {} : { value: condition.value }) };
}

export function serializeRuleAction(action: HueRuleAction): Record<string, unknown> {
  return { address: action.address, method: action.method, ...(action.body === undefined ? {} : { body: action.body }) };
}
