import { LoggerParent } from '../../../logger/logger';
import * as bunyan from 'bunyan';
import * as core from 'express-serve-static-core';
import * as path from 'path';
import LightController from 'routing/controllers/LightController';
import routeCommon from './RouteCommon';
import routeSelect from './RouteSelect';
import routeState from './RouteState';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const itemType: string = 'lights';

export default function route(controller: LightController, application: core.Express): core.Express {
  routeCommon(itemType, controller, application);
  routeSelect(itemType, controller, application);
  routeState(itemType, controller, application);

  return application;
}