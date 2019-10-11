import { printLeftoverKeys, verifyType } from ".";

export interface RuleActionBody {
  scene?: string;
  localtime?: string;
  status?: number|string;
  transitiontime: number;
  bri_inc: number;
  on: boolean;
}

export interface RuleActionBodies {
  [id: string]: RuleActionBody;
}

export function create(payload: RuleActionBody): RuleActionBody {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("RuleActionBody not found");
  }
  const ruleAction = {
    scene: verifyType(payload.scene, "scene", "string", false),
    on: verifyType(payload.on, "on", "boolean", false),
    localtime: verifyType(payload.localtime, "localtime", "string", false),
    status: payload.status,
    transitiontime: verifyType(payload.transitiontime, "transitiontime", "number", false),
    bri_inc: verifyType(payload.bri_inc, "bri_inc", "number", false),
  };
  printLeftoverKeys("RuleActionBody", payload, ruleAction);
  return ruleAction;
}
