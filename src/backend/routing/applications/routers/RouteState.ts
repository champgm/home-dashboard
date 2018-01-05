import { LoggerParent } from '../../../logger/logger';
import * as bunyan from 'bunyan';
import * as core from 'express-serve-static-core';
import * as path from 'path';
import CommonController from 'routing/controllers/CommonController';
import IItem from '../../../../common/interfaces/IItem';
import IState from '../../../../common/interfaces/IState';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export default function route(itemType: string, controller: CommonController<IItem>, application: core.Express): core.Express {

  application.get(`/${itemType}/:itemId/state`, async (request: any, response, next) => {
    const itemId: string = request.itemId;
    bunyanLogger.info({ itemId }, `get ${itemType} state called`);
    const state: IState = await controller.getState(itemId);
    response.json(state);
    bunyanLogger.info('Request handled.');
  });

  application.put(`/${itemType}/:itemId/state`, async (request: any, response, next) => {
    const itemId: string = request.itemId;
    bunyanLogger.info({ itemId }, `put ${itemType} called`);
    const state: IState = await controller.setState(itemId, request.body);
    response.json(state);
    bunyanLogger.info('Request handled.');
  });

  return application;
}
