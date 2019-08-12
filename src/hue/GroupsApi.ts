import { get } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue.json";
import { create as GroupCreate, Group, Groups } from "../models/Group";

export class GroupsApi {
  async getAll(): Promise<Groups> {
    const uri = `${bridgeUri}/groups/`;
    console.log(`Get groups from uri: ${uri}`);
    let groups = await (await fetch(uri, get)).json();
    groups = this.attachId(groups);
    return groups;
  }

  async get(id: string): Promise<Group> {
    const uri = `${bridgeUri}/groups/${id}`;
    const group = await (await fetch(uri, get)).json();
    group.id = id;
    return GroupCreate(group);
  }

  attachId(map: Groups): Groups {
    for (const id of Object.keys(map)) {
      map[id].id = id;
      map[id] = GroupCreate(map[id]);
    }
    return map;
  }
}
