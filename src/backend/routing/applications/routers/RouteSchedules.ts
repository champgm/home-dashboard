import { LoggerParent } from '../../../logger/logger';
import * as bunyan from 'bunyan';
import * as core from 'express-serve-static-core';
import * as path from 'path';
import routeCommon from './RouteCommon';
import ScheduleController from '../../controllers/ScheduleController';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const itemType: string = 'schedules';

export default function route(controller: ScheduleController, application: core.Express): core.Express {
  routeCommon(itemType, controller, application);

  return application;
}
