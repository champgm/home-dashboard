import * as path from 'path';
import * as core from 'express-serve-static-core';
import * as bunyan from 'bunyan';
import { LoggerParent } from '../../../logger/logger';
import PlugController from '../../controllers/PlugController';
import routeCommon from './RouteCommon';
import routeSelect from './RouteSelect';
import IState from '../../../../common/interfaces/IState';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const itemType: string = 'plugs';

export default function route(controller: PlugController, application: core.Express): core.Express {
  routeCommon(itemType, controller, application);
  routeSelect(itemType, controller, application);

  application.get(`/${itemType}/:itemId/select`, async (request: any, response, next) => {
    bunyanLogger.info(`select ${itemType} called`);
    const itemId: string = request.itemId;
    bunyanLogger.info(`Plugid from request: ${itemId}`);
    const item: IState = await controller.select(itemId);
    response.send(item);
    bunyanLogger.info('Request handled.');
  });

  return application;
}
