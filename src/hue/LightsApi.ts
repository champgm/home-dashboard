import { get } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue.json";
import { Light, Lights } from "../models/Light";

export class LightsApi {
  async getAll(): Promise<Lights> {
    const uri = `${bridgeUri}/lights/`;
    let lightsMap = await (await fetch(uri, get)).json();
    lightsMap = this.attachId(lightsMap);
    return lightsMap;
  }

  attachId(lightsMap: Lights): Lights {
    for (const lightId of Object.keys(lightsMap)) {
      lightsMap[lightId].id = lightId;
      lightsMap[lightId] = Light.create(lightsMap[lightId]);
    }
    return lightsMap;
  }
}
