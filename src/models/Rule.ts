import { createArray, printLeftoverKeys, verifyType } from ".";
import { Item } from "./Item";
import { create as createRuleAction, RuleAction } from "./RuleAction";
import { create as createRuleCondition, RuleCondition } from "./RuleCondition";

export interface Rule extends Item {
  actions: RuleAction[];
  conditions: RuleCondition[];
  created: string;
  lasttriggered: string;
  name: string;
  owner: string;
  recycle: boolean;
  status: string;
  timestriggered: number;
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
    actions: createArray(payload.actions, "actions", createRuleAction),
    conditions: createArray(payload.conditions, "conditions", createRuleCondition),
    created: verifyType(payload.created, "created", "string"),
    id: verifyType(payload.id, "id", "string"),
    lasttriggered: verifyType(payload.lasttriggered, "lasttriggered", "string"),
    name: verifyType(payload.name, "name", "string"),
    owner: verifyType(payload.owner, "owner", "string"),
    recycle: verifyType(payload.recycle, "recycle", "boolean"),
    status: verifyType(payload.status, "status", "string"),
    timestriggered: verifyType(payload.timestriggered, "timestriggered", "number"),
  };
  printLeftoverKeys("Rule", payload, rule);
  return rule;
}

export function createSubmittable(payload: Rule): Rule {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("Rule not found");
  }
  const rule = {
    actions: createArray(payload.actions, "actions", createRuleAction),
    conditions: createArray(payload.conditions, "conditions", createRuleCondition),
    created: verifyType(payload.created, "created", "string"),
    id: verifyType(payload.id, "id", "string"),
    lasttriggered: verifyType(payload.lasttriggered, "lasttriggered", "string"),
    name: verifyType(payload.name, "name", "string"),
    owner: verifyType(payload.owner, "owner", "string"),
    recycle: verifyType(payload.recycle, "recycle", "boolean"),
    status: verifyType(payload.status, "status", "string"),
    timestriggered: verifyType(payload.timestriggered, "timestriggered", "number"),
  };
  printLeftoverKeys("Rule", payload, rule);
  return rule;
}

export function getEmpty(): Rule {
  return {
    actions: [],
    conditions: [],
    created: "created",
    id: "id",
    lasttriggered: "lasttriggered",
    name: "name",
    owner: "owner",
    recycle: false,
    status: "status",
    timestriggered: 0,
  };
}
