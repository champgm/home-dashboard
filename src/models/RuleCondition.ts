import { printLeftoverKeys, verifyType } from ".";
import { RuleConditionOperator } from "./RuleConditionOperator";

export interface RuleCondition {
  address: string;
  operator: RuleConditionOperator;
  value: string;
}

export interface RuleConditions {
  [id: string]: RuleCondition;
}

export function create(payload: RuleCondition): RuleCondition {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("RuleCondition not found");
  }
  const ruleCondition = {
    address: verifyType(payload.address, "address", "string"),
    operator: verifyRuleConditionOperator(payload.operator),
    value: verifyType(payload.value, "value", "string"),
  };
  printLeftoverKeys("RuleCondition", payload, ruleCondition);
  return ruleCondition;
}

export function verifyRuleConditionOperator(ruleConditionOperator: RuleConditionOperator): RuleConditionOperator {
  if (!Object.values(RuleConditionOperator).includes(ruleConditionOperator)) {
    throw new Error(`RuleConditionOperator, '${ruleConditionOperator}' ` +
      "is not a supported RuleConditionOperator. " +
      `Supported RuleConditionOperators: ${JSON.stringify(RuleConditionOperator)}`);
  }
  return ruleConditionOperator;
}
