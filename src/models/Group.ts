import { Item } from "./Item";
import { State } from "./State";

export interface Group extends Item {
  id: string;
  action: State;
}

export namespace Group {
  export function create(group: Group) {
    return group;
  }
}
