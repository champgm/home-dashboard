import { printLeftoverKeys, verifyArray, verifyType } from ".";
import { create as GroupActionCreate, GroupAction } from "./GroupAction";
import { create as GroupStateCreate, GroupState } from "./GroupState";
import { Item } from "./Item";

export interface Group extends Item {
  action: GroupAction;
  lights: string[];
  recycle: boolean;
  state: GroupState;
  type: string;
}
export interface Groups {
  [id: string]: Group;
}

// export namespace Group {
export function create(payload: Group): Group {
  if (!payload) { throw new Error("Group not found"); }
  const group = {
    action: GroupActionCreate(payload.action),
    id: verifyType(payload.id, "id", "string"),
    lights: verifyArray(payload.lights, "lights", "string"),
    name: verifyType(payload.name, "name", "string"),
    recycle: verifyType(payload.recycle, "recycle", "boolean"),
    state: GroupStateCreate(payload.state),
    type: verifyType(payload.type, "type", "string"),
  };
  printLeftoverKeys("Group", payload, group);
  return group;
}
// }
