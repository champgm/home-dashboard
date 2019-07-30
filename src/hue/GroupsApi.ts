import { get } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue.json";
import { Group, Groups } from "../models/Group";

export class GroupsApi {
  async getAll(): Promise<Groups> {
    const uri = `${bridgeUri}/groups/`;
    let groups = await (await fetch(uri, get)).json();
    groups = this.attachId(groups);
    return groups;
  }

  attachId(lightsMap: Groups): Groups {
    for (const lightId of Object.keys(lightsMap)) {
      lightsMap[lightId].id = lightId;
      lightsMap[lightId] = Group.create(lightsMap[lightId]);
    }
    return lightsMap;
  }
}
