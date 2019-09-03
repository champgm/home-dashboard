import { dlete, get, put, post } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue";
import { create as LightCreate, createSubmittable as createSubmittableLight, Light, Sensors } from "../models/Light";
import { createSubmittable as createSubmittableLightState, LightState } from "../models/LightState";
import { triggerUpdate } from "../tabs/common/Alerter";

export class SensorsApi {

  async getAll(): Promise<Sensors> {
    const uri = `${bridgeUri}/sensors/`;
    let sensorsMap = await (await fetch(uri, get)).json();
    sensorsMap = this.attachId(sensorsMap);
    return sensorsMap;
  }

  async get(id: string): Promise<Light> {
    const uri = `${bridgeUri}/sensors/${id}`;
    const light = await (await fetch(uri, get)).json();
    light.id = id;
    return LightCreate(light);
  }

  async delete(id: string) {
    const uri = `${bridgeUri}/sensors/${id}`;
    await (await fetch(uri, dlete)).json();
    triggerUpdate();
  }

  async searchForNew() {
    const uri = `${bridgeUri}/sensors`;
    await (await fetch(uri, post)).json();
    triggerUpdate();
  }

  async getSome(ids: string[]): Promise<Sensors> {
    const allSensors = this.getAll();
    Object.keys(allSensors).forEach((key) => {
      if (!ids.includes(key)) {
        delete allSensors[key];
      }
    });
    return allSensors;
  }

  async put(light: Light): Promise<void> {
    const uri = `${bridgeUri}/sensors/${light.id}`;
    if (light.state) {
      await this.putState(light.id, light.state);
    }
    const submittableLight = createSubmittableLight(light);
    const parameters: RequestInit = {
      ...put,
      body: JSON.stringify(submittableLight),
    };
    const response = await (await fetch(uri, parameters)).json();
    console.log(`put light response${JSON.stringify(response, null, 2)}`);
    triggerUpdate();
  }

  async putState(id: string, lightState: Partial<LightState>): Promise<void> {
    const uri = `${bridgeUri}/sensors/${id}/state`;
    const submittableLightState = createSubmittableLightState(lightState);
    const parameters: RequestInit = {
      ...put,
      body: JSON.stringify(submittableLightState),
    };
    console.log(`putting light state${JSON.stringify({ uri, parameters }, null, 2)}`);
    const response = await (await fetch(uri, parameters)).json();
    console.log(`put light state response${JSON.stringify(response, null, 2)}`);
    triggerUpdate();
  }

  attachId(sensorsMap: Sensors): Sensors {
    for (const lightId of Object.keys(sensorsMap)) {
      sensorsMap[lightId].id = lightId;
      sensorsMap[lightId] = LightCreate(sensorsMap[lightId]);
    }
    return sensorsMap;
  }
}
