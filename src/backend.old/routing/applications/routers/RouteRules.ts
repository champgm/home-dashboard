import { LoggerParent } from '../../../logger/logger';
import * as bunyan from 'bunyan';
import * as core from 'express-serve-static-core';
import * as path from 'path';
import routeCommon from './RouteCommon';
import RuleController from '../../controllers/RuleController';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const itemType: string = 'rules';

export default function route(controller: RuleController, application: core.Express): core.Express {
  routeCommon(itemType, controller, application);

  return application;
}
