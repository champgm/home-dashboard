import { get } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue.json";
import { Light, Lights } from "../models/Light";

export class LightsApi {
  async getAll(): Promise<Lights> {
    const uri = `${bridgeUri}/lights/`;
    const lightsMap = await (await fetch(uri, get)).json();
    for (const lightId of Object.keys(lightsMap)) {
      lightsMap[lightId].id = lightId;
      lightsMap[lightId] = Light.create(lightsMap[lightId]);
    }
    return lightsMap;
  }
}
