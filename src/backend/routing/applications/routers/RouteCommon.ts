import * as bunyan from 'bunyan';
import * as path from 'path';
import * as core from 'express-serve-static-core';
import { LoggerParent } from '../../../logger/logger';
import CommonController from '../../controllers/CommonController';
import IItem from '../../../../common/interfaces/IItem';
import IMap from '../../../../common/interfaces/IMap';
import * as CircularJSON from 'circular-json';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });



export default function routeCommon<T extends CommonController<IItem>>(itemType: string, controller: T, application: core.Express): any {

  application.get(`/${itemType}`, async (request, response, next) => {
    try {
      bunyanLogger.info(`get ${itemType} called`);
      const items: IMap<IItem> = await controller.getAll();
      response.json(CircularJSON.parse(CircularJSON.stringify(items)));
      bunyanLogger.info('Request handled.');
    } catch (caughtError) {
      bunyanLogger.error({ keys: Object.getOwnPropertyNames(caughtError) }, 'error keys');
      const error: any = {
        message: caughtError.message,
        type: caughtError.type,
        stack: caughtError.stack
      };
      bunyanLogger.error({ error }, 'An unhandled error was caught.');
    }
  });

  application.get(`/${itemType}/:itemId`, async (request: any, response: any, next: any) => {
    const itemId: string = request.itemId;
    bunyanLogger.info({ itemId }, `get ${itemType} called`);
    const item: IItem = await controller.get(itemId);
    response.json(CircularJSON.parse(CircularJSON.stringify(item)));
    bunyanLogger.info('Request handled.');
  });

  application.delete(`/${itemType}/:itemId`, async (request: any, response: any, next: any) => {
    const itemId: string = request.itemId;
    bunyanLogger.info({ itemId }, `delete ${itemType} called`);
    const item: IItem = await controller.delete(itemId);
    response.json(CircularJSON.parse(CircularJSON.stringify(item)));
    bunyanLogger.info('Request handled.');
  });

  application.put(`/${itemType}/:itemId`, async (request: any, response: any, next: any) => {
    const itemId: string = request.itemId;
    bunyanLogger.info({ itemId }, `put ${itemType} called`);
    const item: IItem = await controller.update(itemId, request.body);
    response.json(CircularJSON.parse(CircularJSON.stringify(item)));
    bunyanLogger.info('Request handled.');
  });

  application.post(`/${itemType}`, async (request: any, response: any, next: any) => {
    bunyanLogger.info(`post ${itemType} called`);
    const item: IItem = await controller.add(request.body);
    response.json(CircularJSON.parse(CircularJSON.stringify(item)));
    bunyanLogger.info('Request handled.');
  });

  return application;
}
