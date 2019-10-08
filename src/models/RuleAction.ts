import { printLeftoverKeys, verifyType } from ".";

export interface RuleAction {
  address: string;
  method: string;
  body: string;
}

export interface RuleActions {
  [id: string]: RuleAction;
}

export function create(payload: RuleAction): RuleAction {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("RuleAction not found");
  }
  const ruleAction = {
    address: verifyType(payload.address, "address", "string"),
    method: verifyType(payload.method, "method", "string"),
    body: verifyType(payload.body, "body", "string"),
  };
  printLeftoverKeys("RuleAction", payload, ruleAction);
  return ruleAction;
}
