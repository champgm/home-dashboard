import { get, put } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue.json";
import { create as LightCreate, Light, Lights } from "../models/Light";
import { LightState } from "../models/LightState";
import { triggerUpdate } from "../tabs/common/Alerter";

export class LightsApi {

  async getAll(): Promise<Lights> {
    const uri = `${bridgeUri}/lights/`;
    let lightsMap = await (await fetch(uri, get)).json();
    lightsMap = this.attachId(lightsMap);
    return lightsMap;
  }

  async get(id: string): Promise<Light> {
    const uri = `${bridgeUri}/lights/${id}`;
    const light = await (await fetch(uri, get)).json();
    light.id = id;
    return LightCreate(light);
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

  async put(light: Light): Promise<void> {
    const uri = `${bridgeUri}/lights/${light.id}`;
    const submittableLight = LightCreate(light);
    const parameters: RequestInit = {
      ...put,
      body: JSON.stringify(submittableLight),
    };
    const response = await (await fetch(uri, parameters)).json();
    triggerUpdate();
  }

  async putState(id: string, lightState: Partial<LightState>): Promise<void> {
    const uri = `${bridgeUri}/lights/${id}/state`;
    const parameters: RequestInit = {
      ...put,
      body: JSON.stringify(lightState),
    };
    const response = await (await fetch(uri, parameters)).json();
    triggerUpdate();
  }

  attachId(lightsMap: Lights): Lights {
    for (const lightId of Object.keys(lightsMap)) {
      lightsMap[lightId].id = lightId;
      lightsMap[lightId] = LightCreate(lightsMap[lightId]);
    }
    return lightsMap;
  }
}
