import { GroupsApi } from "../hue/GroupsApi";
import { LightsApi } from "../hue/LightsApi";
// import { RulesApi } from "../../hue/RulesApi";
// import { SensorsApi } from "../../hue/SensorsApi";
import { Groups } from "../models/Group";
import { Lights } from "../models/Light";
// import { Rules } from "../../models/Rule";
// import { Sensors } from "../../models/Sensor";

const lightsApi: LightsApi = new LightsApi();
const groupsApi: GroupsApi = new GroupsApi();
// const sensorsApi: SensorsApi = new SensorsApi();
// const rulesApi: RulesApi = new RulesApi();
export let groups: Groups;
export let lights: Lights;
// export let sensors: Sensors;
// export let rules: Rules;

export async function poll() {
  console.log(`Polling Hue...`);
  await update();
  setTimeout(() => {
    poll();
  }, 5000);
}

export async function update() {
//   const sensorsPromise = sensorsApi.getAll();
//   const rulesPromise = rulesApi.getAll();
  try {
    groups = await groupsApi.getAll();;
    lights = await lightsApi.getAll();
  } catch (err) {
    alert(err)
  }
//   sensors = await sensorsPromise;
//   rules = await rulesPromise;
}

poll();