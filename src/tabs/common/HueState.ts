import { GroupsApi } from "../../hue/GroupsApi";
import { LightsApi } from "../../hue/LightsApi";
import { SensorsApi } from "../../hue/SensorsApi";
import { Groups } from "../../models/Group";
import { Lights } from "../../models/Light";
import { Sensors } from "../../models/Sensor";
import { triggerUpdate } from "./Alerter";

const lightsApi: LightsApi = new LightsApi();
const groupsApi: GroupsApi = new GroupsApi();
const sensorsApi: SensorsApi = new SensorsApi();
export let groups: Groups;
export let lights: Lights;
export let sensors: Sensors;

export async function poll() {
  console.log(`Polling Hue...`);
  await update();
  setTimeout(() => {
    poll();
  }, 5000);
}

export async function update() {
  const groupsPromise = groupsApi.getAll();
  const lightsPromise = lightsApi.getAll();
  const sensorsPromise = sensorsApi.getAll();
  groups = await groupsPromise;
  lights = await lightsPromise;
  sensors = await sensorsPromise;
  triggerUpdate();
}

poll();
