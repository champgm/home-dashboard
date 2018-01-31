import { LoggerParent } from '../../../logger/logger';
import * as bunyan from 'bunyan';
import * as core from 'express-serve-static-core';
import * as path from 'path';
import CommonController from '../../controllers/CommonController';
import GroupController from '../../controllers/GroupController';
import routeCommon from './RouteCommon';
import routeSelect from './RouteSelect';
import routeState from './RouteState';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const itemType: string = 'groups';

export default function routeGroups(controller: GroupController, application: core.Express): any {
  routeCommon(itemType, controller, application);
  routeSelect(itemType, controller, application);
  routeState(itemType, controller, application);

  return application;
}
