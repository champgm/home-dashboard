import { get } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue.json";
import { create as LightCreate, Light, Lights } from "../models/Light";

export class LightsApi {

  async getAll(): Promise<Lights> {
    const uri = `${bridgeUri}/lights/`;
    let lightsMap = await (await fetch(uri, get)).json();
    lightsMap = this.attachId(lightsMap);
    return lightsMap;
  }

  async getSome(ids: string[]): Promise<Lights> {
    const allLights = this.getAll();
    Object.keys(allLights).forEach((key) => {
      if (!ids.includes(key)) {
        delete allLights[key];
      }
    });
    return allLights;
  }

  attachId(lightsMap: Lights): Lights {
    for (const lightId of Object.keys(lightsMap)) {
      lightsMap[lightId].id = lightId;
      lightsMap[lightId] = LightCreate(lightsMap[lightId]);
    }
    return lightsMap;
  }
}
