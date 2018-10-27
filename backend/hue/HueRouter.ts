import core, { Router } from 'express';
import { HueApi } from 'node-hue-api';
import { environment } from '../../.env';
import bunyan from 'bunyan';

// This is a wrapper for all route handlers
// We need to take special care to handle asynchronous errors. Lambda has a tendency to eat them
export function asyncHandler(
  handler: (request: any, response: any) => Promise<any>,
): (request: any, response: any, next: () => void) => void {
  return (request: any, response: any, next: (error: any) => void): void => {
    // Call the handler
    handler(request, response)
      // Log and return the response
      .then((responseObject) => {
        response.status(responseObject.code).json(responseObject);
      })
      .catch((error) => {
        // Pass it on to the global handler
        next(error);
      })
      .then(() => {
        console.log(`All done`);
      });
  };
}

export function routeHueEndpoints(router: Router, logger: bunyan) {
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
    const payload = await api.getLights();
    return { code: 200, payload };
  }));
}
