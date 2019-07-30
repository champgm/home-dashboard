import { Item } from "./Item";
import { State } from "./State";

export interface Group extends Item {
  id: string;
  action: State;
}
export interface Groups {
  [id: string]: Group;
}

export namespace Group {
  export function create(payload: Group): Group {
    if (!payload) { throw new Error("Group not found"); }
    return payload;
  }
}
