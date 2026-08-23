import { changedFields } from "../changedFields";
import { HueRuleAction, HueRuleCondition, parseRuleAction, parseRuleCondition, serializeRuleAction, serializeRuleCondition } from "../catalog/rules";

export interface HueRule {
  readonly id: string;
  readonly name?: string;
  readonly conditions?: readonly HueRuleCondition[];
  readonly actions?: readonly HueRuleAction[];
  readonly status?: "enabled" | "disabled" | string;
  readonly owner?: string;
  readonly created?: string;
  readonly lasttriggered?: string;
  readonly timestriggered?: number;
  readonly recycle?: boolean;
  readonly [key: string]: unknown;
}

export function parseRules(collection: Record<string, unknown>): Record<string, HueRule> {
  return Object.keys(collection).reduce((result, id) => {
    const raw = (collection[id] && typeof collection[id] === "object" ? collection[id] : {}) as Record<string, unknown>;
    result[id] = {
      ...raw,
      id,
      conditions: Array.isArray(raw.conditions) ? raw.conditions.map(parseRuleCondition) : [],
      actions: Array.isArray(raw.actions) ? raw.actions.map(parseRuleAction) : [],
    } as HueRule;
    return result;
  }, {} as Record<string, HueRule>);
}

export function buildRuleUpdate(original: Partial<HueRule> | undefined, draft: Partial<HueRule>): Partial<Record<string, unknown>> {
  const result = changedFields(
    original as Record<string, unknown> | undefined,
    draft as Record<string, unknown>,
    ["name", "conditions", "actions", "status"] as readonly (keyof HueRule)[],
  ) as Partial<Record<string, unknown>>;
  if (result.conditions) {
    result.conditions = (result.conditions as HueRuleCondition[]).map(serializeRuleCondition);
  }
  if (result.actions) {
    result.actions = (result.actions as HueRuleAction[]).map(serializeRuleAction);
  }
  return result;
}

export function ruleIsEnabled(rule: HueRule): boolean | undefined {
  if (rule.status === "enabled") return true;
  if (rule.status === "disabled") return false;
  return undefined;
}
