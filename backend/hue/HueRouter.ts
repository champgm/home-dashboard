import core, { Router } from 'express';
import { HueApi, ILightsApiResponse, ILight } from 'node-hue-api';
import { environment } from '../../.env';
import bunyan from 'bunyan';
import { asyncHandler, notEmptyOrBlank } from '../common/Util';

function byName(a, b) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

export function routeEndpoints(router: Router, logger: bunyan) {
  const api = new HueApi(
    environment.HUE_BRIDGE_IP,
    environment.HUE_BRIDGE_TOKEN,
    undefined,
    environment.HUE_BRIDGE_PORT);
  router.get('/config', asyncHandler(async (request, response) => {
    const payload = await api.getConfig();
    return { code: 200, payload };
  }));
  router.get('/lights', asyncHandler(async (request, response) => {
    const lightResponse: ILightsApiResponse = await api.getLights();
    const sorted = lightResponse.lights.sort(byName);
    return { code: 200, payload: sorted };
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
    const lightResponse: ILightsApiResponse = await api.getLights();
    const sorted = lightResponse.lights.sort(byName);
    return { code: 200, payload: sorted };
  }));
  router.put('/lights/:id/state', asyncHandler(async (request, response) => {
    const lightId = request.params.id;
    console.log(`Setting state: ${JSON.stringify(request.body, null, 2)}`);
    await api.setLightState(lightId, request.body);
    const lightResponse: ILightsApiResponse = await api.getLights();
    const sorted = lightResponse.lights.sort(byName);
    return { code: 200, payload: sorted };
  }));
}
