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
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    address: typeof record.address === "string" ? record.address : "",
    operator: typeof record.operator === "string" ? record.operator : "unknown",
    ...(typeof record.value === "string" ? { value: record.value } : {}),
  };
}

export function parseRuleAction(value: unknown): HueRuleAction {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    address: typeof record.address === "string" ? record.address : "",
    method: typeof record.method === "string" ? record.method : "UNKNOWN",
    ...(record.body && typeof record.body === "object" && !Array.isArray(record.body) ? { body: record.body as Record<string, unknown> } : {}),
  };
}

export function serializeRuleCondition(condition: HueRuleCondition): Record<string, unknown> {
  return { address: condition.address, operator: condition.operator, ...(condition.value === undefined ? {} : { value: condition.value }) };
}

export function serializeRuleAction(action: HueRuleAction): Record<string, unknown> {
  return { address: action.address, method: action.method, ...(action.body === undefined ? {} : { body: action.body }) };
}
