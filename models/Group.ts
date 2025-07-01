import { printLeftoverKeys, verifyArray, verifyType } from ".";
import { Alert, verify as verifyAlert } from "./Alert";
import { create as GroupActionCreate, GroupAction } from "./GroupAction";
import { GroupClass, verify as verifyGroupClass } from "./GroupClass";
import { create as GroupStateCreate, GroupState } from "./GroupState";
import { Item } from "./Item";

export enum Status { ON, OFF, INDETERMINATE }

export interface Group extends Item {
  action: GroupAction;
  class?: GroupClass;
  lights: any[];
  recycle: boolean;
  sensors: any[];
  state: GroupState;
  type: string;
}
export interface Groups {
  [id: string]: Group;
}

export function create(payload: any): Group {
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

export function getStatus(allOn: boolean, anyOn: boolean): Status {
  if (!anyOn) { return Status.OFF; }
  if (allOn) { return Status.ON; }
  if (anyOn) { return Status.INDETERMINATE; }
  throw new Error(`Unable to generate status value from group state - allOn: ${JSON.stringify(allOn)}, anyOn: ${JSON.stringify(anyOn)}`);
}

export function getBlinking(alert: Alert): Status {
  switch (alert) {
    case Alert.NONE: return Status.OFF;
    case Alert.LSELECT: return Status.ON;
    case Alert.SELECT: return Status.ON;
    default: throw new Error(`Unknown Alert value: ${alert}`);
  }
}

export function getEmpty() {
  return create({
    state: GroupStateCreate({
      all_on: false,
      any_on: false,
    }),
    type: "Room",
    id: "-1",
    name: "Group Name",
    action: GroupActionCreate({
      alert: Alert.NONE,
      bri: 254,
      on: true,
    }),
    lights: [],
    recycle: false,
    sensors: [],
  });
}