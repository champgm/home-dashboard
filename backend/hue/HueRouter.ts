import core, { Router } from 'express';
import { HueApi, ILightsApiResponse, ILight, ILightGroup } from 'node-hue-api';
import { bridgeConfiguration } from '../../.env';
import bunyan from 'bunyan';
import { asyncHandler, notEmptyOrBlank } from '../common/Util';
import fs from 'fs';
const api = new HueApi(
  bridgeConfiguration.HUE_BRIDGE_IP,
  bridgeConfiguration.HUE_BRIDGE_TOKEN,
  undefined,
  bridgeConfiguration.HUE_BRIDGE_PORT);

function getByNameSorter(deviceType: string) {
  const byName = (a, b) => {
    a.deviceType = deviceType;
    b.deviceType = deviceType;
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  };
  return byName;
}

export async function getLights() {
  const lightResponse: ILightsApiResponse = await api.getLights();
  const sorted = lightResponse.lights.sort(getByNameSorter('light'));
  return sorted;
}

export async function getGroups() {
  const groupsResponse: ILightGroup[] = await api.getGroups();
  groupsResponse.splice(0, 1);
  const sorted = groupsResponse.sort(getByNameSorter('group'));
  return sorted;
}

export function routeEndpoints(router: Router, logger: bunyan) {

  router.get('/config', asyncHandler(async (request, response) => {
    const payload = await api.getConfig();
    return { code: 200, payload };
  }));

  router.get('/lights', asyncHandler(async (request, response) => {
    return { code: 200, payload: await getLights() };
  }));
  router.put('/lights', asyncHandler(async (request, response) => {
    const light: ILight = request.body;
    const currentLight = await api.getLightStatus(light.id);
    console.log(`Editing light: ${JSON.stringify(light, null, 2)}`);
    if (currentLight.name !== light.name) {
      await api.setLightName(light.id, light.name);
    }
    if ((currentLight.state.on || light.state.on) &&
      (currentLight.state !== light.state)) {
      const stateChange = {};
      Object.keys(light.state).forEach((stateKey) => {
        if (currentLight.state[stateKey] !== light.state[stateKey]) {
          stateChange[stateKey] = light.state[stateKey];
        }
      });
      if (notEmptyOrBlank(stateChange)) {
        console.log(`Will write state change: ${JSON.stringify(stateChange)}`);
        await api.setLightState(light.id, stateChange);
      }
    }
    return { code: 200, payload: await getLights() };
  }));
  router.put('/lights/:id/state', asyncHandler(async (request, response) => {
    const lightId = request.params.id;
    console.log(`Setting state: ${JSON.stringify(request.body, null, 2)}`);
    await api.setLightState(lightId, request.body);
    return { code: 200, payload: await getLights() };
  }));

  router.get('/groups', asyncHandler(async (request, response) => {
    return { code: 200, payload: await getGroups() };
  }));
  router.put('/groups', asyncHandler(async (request, response) => {
    const group: ILightGroup = request.body;
    const currentGroup = await api.getGroup(group.id);
    console.log(`Editing group: ${JSON.stringify(group, null, 2)}`);
    if (currentGroup.name !== group.name) {
      await api.updateGroup(group.id, group.name, currentGroup.lights);
    }
    if (notEmptyOrBlank(currentGroup.action) &&
      (currentGroup.action.on || group.action.on) &&
      (currentGroup.action !== group.action)) {
      const actionChange = {};
      Object.keys(group.action).forEach((stateKey) => {
        if (currentGroup.action[stateKey] !== group.action[stateKey]) {
          actionChange[stateKey] = group.action[stateKey];
        }
      });
      if (notEmptyOrBlank(actionChange)) {
        console.log(`Will write action change: ${JSON.stringify(actionChange)}`);
        await api.setGroupLightState(group.id, actionChange);
      }
    }
    return { code: 200, payload: await getGroups() };
  }));
  router.put('/groups/:id/action', asyncHandler(async (request, response) => {
    const groupId = request.params.id;
    console.log(`Setting state: ${JSON.stringify(request.body, null, 2)}`);
    await api.setGroupLightState(groupId, request.body);
    return { code: 200, payload: await getGroups() };
  }));
}
