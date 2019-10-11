import { createArray, printLeftoverKeys, verifyArray, verifyType } from ".";
import { Item } from "./Item";
import { create as createRuleAction, RuleAction } from "./RuleAction";
import { create as createRuleCondition, RuleCondition } from "./RuleCondition";

export interface Rule extends Item {
  name: string;
  owner: string;
  created: string;
  lasttriggered: string;
  timestriggered: number;
  status: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  recycle: boolean;
}

export interface Rules {
  [id: string]: Rule;
}

export function create(payload: Rule): Rule {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("Rule not found");
  }
  const rule = {
    id: verifyType(payload.id, "id", "string"),
    name: verifyType(payload.name, "name", "string"),
    owner: verifyType(payload.owner, "owner", "string"),
    created: verifyType(payload.created, "created", "string"),
    recycle: verifyType(payload.recycle, "recycle", "boolean"),
    lasttriggered: verifyType(payload.lasttriggered, "lasttriggered", "string"),
    timestriggered: verifyType(payload.timestriggered, "timestriggered", "number"),
    status: verifyType(payload.status, "status", "string"),
    conditions: createArray(payload.conditions, "conditions", createRuleCondition),
    actions: createArray(payload.actions, "actions", createRuleAction),
  };
  printLeftoverKeys("Rule", payload, rule);
  return rule;
}
