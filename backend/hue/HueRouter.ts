import core, { Router } from 'express';
import { HueApi, ILightsApiResponse } from 'node-hue-api';
import { environment } from '../../.env';
import bunyan from 'bunyan';
import { asyncHandler } from '../common/Util';



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
    return { code: 200, payload: lightResponse.lights };
  }));
  router.put('/lights/:id/state', asyncHandler(async (request, response) => {
    const lightId = request.params.id;
    console.log(`Setting state: ${JSON.stringify(request.body, null, 2)}`);
    await api.setLightState(lightId, request.body);
    const lightResponse: ILightsApiResponse = await api.getLights();
    return { code: 200, payload: lightResponse.lights };
  }));
}
