import { LoggerParent } from '../../../logger/logger';
import * as bunyan from 'bunyan';
import * as core from 'express-serve-static-core';
import * as path from 'path';
import CommonController from '../../controllers/CommonController';
import IItem from '../../../../common/interfaces/IItem';
import IState from '../../../../common/interfaces/IState';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export default function route(itemType: string, controller: CommonController<IItem>, application: core.Express): core.Express {

  application.get(`/${itemType}/:itemId/select`, async (request: any, response, next) => {
    const itemId: string = request.itemId;
    bunyanLogger.info({ itemId }, `select ${itemType} called`);
    const item: IState = await controller.select(itemId);
    response.json(item);
    bunyanLogger.info('Request handled.');
  });

  return application;
}
