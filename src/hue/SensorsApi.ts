import { dlete, get, post, put } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue";
import { create as SensorCreate, Sensor, Sensors } from "../models/Sensor";
import { createSubmittable as createSubmittableSensorState, SensorState } from "../models/SensorState";
import { triggerUpdate } from "../tabs/common/Alerter";

export class SensorsApi {

  async getAll(): Promise<Sensors> {
    const uri = `${bridgeUri}/sensors/`;
    let sensorsMap = await (await fetch(uri, get)).json();
    sensorsMap = this.attachId(sensorsMap);
    return sensorsMap;
  }

  async get(id: string): Promise<Sensor> {
    const uri = `${bridgeUri}/sensors/${id}`;
    const light = await (await fetch(uri, get)).json();
    light.id = id;
    return SensorCreate(light);
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

  // async put(light: Sensor): Promise<void> {
  //   const uri = `${bridgeUri}/sensors/${light.id}`;
  //   if (light.state) {
  //     await this.putState(light.id, light.state);
  //   }
  //   const submittableSensor = createSubmittableSensor(light);
  //   const parameters: RequestInit = {
  //     ...put,
  //     body: JSON.stringify(submittableSensor),
  //   };
  //   const response = await (await fetch(uri, parameters)).json();
  //   console.log(`put light response${JSON.stringify(response, null, 2)}`);
  //   triggerUpdate();
  // }

  attachId(sensorsMap: Sensors): Sensors {
    for (const id of Object.keys(sensorsMap)) {
      sensorsMap[id].id = id;
      try {
        sensorsMap[id] = SensorCreate(sensorsMap[id]);
      } catch (error) {
        console.log(`Error: ${error}`);
        console.log(`Could not create sensor: ${JSON.stringify(sensorsMap[id], null, 2)}`);
      }
    }
    return sensorsMap;
  }
}
