import { printLeftoverKeys, verifyArray, verifyType } from ".";

export interface GroupState {
  all_on: boolean;
  any_on: boolean;
}

// export namespace GroupState {
export function create(payload: GroupState): GroupState {
    if (!payload) { throw new Error("GroupState not found"); }
    const action = {
      all_on: verifyType(payload.all_on, "all_on", "boolean"),
      any_on: verifyType(payload.any_on, "any_on", "boolean"),
    };
    printLeftoverKeys("GroupState", payload, action);
    return action;
  }
// }
