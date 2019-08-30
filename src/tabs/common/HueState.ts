import { GroupsApi } from "../../hue/GroupsApi";
import { LightsApi } from "../../hue/LightsApi";
import { Groups } from "../../models/Group";
import { Lights } from "../../models/Light";
import { triggerUpdate } from "./Alerter";

const lightsApi: LightsApi = new LightsApi();
const groupsApi: GroupsApi = new GroupsApi();
export let groups: Groups;
export let lights: Lights;

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
  groups = await groupsPromise;
  lights = await lightsPromise;
  triggerUpdate();
}

poll();
