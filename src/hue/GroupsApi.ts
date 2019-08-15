import { get, put } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue.json";
import { create as GroupCreate, createSubmittable, Group, Groups } from "../models/Group";
import { GroupAction } from "../models/GroupAction";
import { triggerUpdate } from "../tabs/common/Alerter";

export class GroupsApi {
  async getAll(): Promise<Groups> {
    const uri = `${bridgeUri}/groups/`;
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

  async put(group: Group): Promise<void> {
    const uri = `${bridgeUri}/groups/${group.id}`;
    const submittableGroup = createSubmittable(group);
    const parameters: RequestInit = {
      ...put,
      body: JSON.stringify(submittableGroup),
    };
    const response = await (await fetch(uri, parameters)).json();
    triggerUpdate();
  }

  async putAction(id: string, groupAction: Partial<GroupAction>): Promise<void> {
    const uri = `${bridgeUri}/groups/${id}/action`;
    const parameters: RequestInit = {
      ...put,
      body: JSON.stringify(groupAction),
    };
    const response = await (await fetch(uri, parameters)).json();
    triggerUpdate();
  }

  attachId(map: Groups): Groups {
    for (const id of Object.keys(map)) {
      map[id].id = id;
      map[id] = GroupCreate(map[id]);
    }
    return map;
  }
}
