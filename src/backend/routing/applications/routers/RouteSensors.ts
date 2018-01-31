import * as path from 'path';
import * as core from 'express-serve-static-core';
import * as bunyan from 'bunyan';
import { LoggerParent } from '../../../logger/logger';
import routeCommon from './RouteCommon';
import SensorController from '../../controllers/SensorController';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const itemType: string = 'sensors';

export default function route(controller: SensorController, application: core.Express): core.Express {
  routeCommon(itemType, controller, application);

  return application;
}
