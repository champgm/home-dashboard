import { LoggerParent } from '../../../logger/logger';
import * as bunyan from 'bunyan';
import * as core from 'express-serve-static-core';
import * as path from 'path';
import KnownParameterNames from '../../controllers/utilities/KnownParameterNames';
import routeCommon from './RouteCommon';
import routeSelect from './RouteSelect';
import SceneController from 'routing/controllers/SceneController';
import IScene from '../../../../common/interfaces/IScene';
import IMap from '../../../../common/interfaces/IMap';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const itemType: string = 'scenes';

export default function route(controller: SceneController, application: core.Express): core.Express {

  application.get(`/${itemType}`, async (request, response, next) => {
    bunyanLogger.info(`get ${itemType} called`);
    bunyanLogger.info({ query: request.query, param: KnownParameterNames.getV2() }, 'request.query');
    const v2ScenesRequested: boolean =
      (KnownParameterNames.getV2() in request.query) &&
      (request.query[KnownParameterNames.getV2()] === 'true');

    const items: IMap<IScene> = await controller.getAll(v2ScenesRequested);
    response.send(items);
    bunyanLogger.info('Request handled.');
  });

  routeCommon(itemType, controller, application);
  routeSelect(itemType, controller, application);
  return application;
}
