import { printLeftoverKeys, verifyArray, verifyType } from ".";
import { Status } from "../tabs/editor/components/StatusToggle";
import { Alert, verify as verifyAlert } from "./Alert";
import { create as GroupActionCreate, GroupAction } from "./GroupAction";
import { GroupClass, verify as verifyGroupClass } from "./GroupClass";
import { create as GroupStateCreate, GroupState } from "./GroupState";
import { Item } from "./Item";

export interface Group extends Item {
  action: GroupAction;
  class?: GroupClass;
  lights: string[];
  recycle: boolean;
  sensors: any[];
  state: GroupState;
  type: string;
}
export interface Groups {
  [id: string]: Group;
}

export function create(payload: Group): Group {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("Group not found");
  }
  const group = {
    action: GroupActionCreate(payload.action),
    class: payload.class ? verifyGroupClass(payload.class) : payload.class,
    id: verifyType(payload.id, "id", "string"),
    lights: verifyArray(payload.lights, "lights", "string"),
    name: verifyType(payload.name, "name", "string"),
    recycle: verifyType(payload.recycle, "recycle", "boolean"),
    sensors: verifyArray(payload.sensors, "sensors", "string"),
    state: GroupStateCreate(payload.state),
    type: verifyType(payload.type, "type", "string"),
  };
  printLeftoverKeys("Group", payload, group);
  return group;
}

export function createSubmittable(payload: Group): Partial<Group> {
  if (!payload) {
    console.log(`${JSON.stringify(payload, null, 2)}`);
    throw new Error("Group not found");
  }
  const group = {
    lights: verifyArray(payload.lights, "lights", "string", false),
    name: verifyType(payload.name, "name", "string", false),
  };
  return group;
}

export function getStatus(group: Group): Status {
  if (!group.state.any_on) { return Status.OFF; }
  if (group.state.all_on) { return Status.ON; }
  if (group.state.any_on) { return Status.INDETERMINATE; }
}

export function getBlinking(group: Group): Status {
  if (group.action.alert === Alert.NONE) { return Status.OFF; }
  if (group.action.alert === Alert.LSELECT) { return Status.ON; }
}
