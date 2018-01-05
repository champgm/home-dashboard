import { Controllers } from 'backend/routing/ApplicationRouter';
import { LoggerParent } from '../../logger/logger';
import * as bunyan from 'bunyan';
import * as core from 'express-serve-static-core';
import * as express from 'express';
import * as path from 'path';
import * as util from 'util';
import routeGroups from './routers/RouteGroups';
import routeLights from './routers/RouteLights';
import routePlugs from './routers/RoutePlugs';
import routeRules from './routers/RouteRules';
import routeScenes from './routers/RouteScenes';
import routeSchedules from './routers/RouteSchedules';
import routeSensors from './routers/RouteSensors';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export default class WebApplication {
  port: number;
  controllers: Controllers;
  application: core.Express;

  /**
 * The requests that come in from express have cyclic references, so
 * JSON.stringify() freaks out. Use this for debugging instead.
 *
 * @param {any} request - the express request
 * @returns undefined
 */
  static printRequest(request: any): void {
    bunyanLogger.info(`Request: ${JSON.stringify(util.inspect(request))}`);
  }

  constructor(controllers: Controllers, port: number) {
    this.application = express();
    this.controllers = controllers;
    this.port = port;
  }

  use(middleware: any): void {
    this.application.use(middleware);
  }

  start(): void {
    this.routeStaticEndpoints();

    // Set possible URL parameters
    this.application.param('itemId', (request: any, response: any, next: any, itemId: string) => {
      request.itemId = itemId;
      next();
    });

    this.application = routePlugs(this.controllers.plugController, this.application);
    this.application = routeRules(this.controllers.ruleController, this.application);
    this.application = routeLights(this.controllers.lightController, this.application);
    this.application = routeGroups(this.controllers.groupController, this.application);
    this.application = routeScenes(this.controllers.sceneController, this.application);
    this.application = routeSensors(this.controllers.sensorController, this.application);
    this.application = routeSchedules(this.controllers.scheduleController, this.application);

    // Start the local server
    bunyanLogger.info('Starting Hue application...');
    try {
      this.application.listen(this.port, () => {
        bunyanLogger.info({ port: this.port }, 'Hue Application listening.');
      });
    } catch (caughtError) {
      logger.error({ keys: Object.getOwnPropertyNames(caughtError) }, 'error keys');
      const error: any = {
        message: caughtError.message,
        type: caughtError.type,
        stack: caughtError.stack
      };
      logger.error({ error }, 'An unhandled error was caught.');
    }
  }

  routeStaticEndpoints(): void {
    // Add the webapp folder as static content. This contains the app UI.
    const webAppFolder: string = path.join(__dirname, '../../../../dist');
    bunyanLogger.info({ webAppFolder }, 'Static content will be read.');
    this.application.use('/', express.static(webAppFolder));

    // Add the documentation folder as static content. This contains the doc UI.
    const docFolder: string = path.join(__dirname, '../../documentation');
    bunyanLogger.info({ docFolder }, 'Documenation content will be read.');
    this.application.use('/documentation', express.static(docFolder));

    // It needs to access the node_modules.
    // I really haven't found a better way to do this.
    const nodeModulesFolder: string = path.join(__dirname, '../../../../node_modules');
    bunyanLogger.info({ nodeModulesFolder }, 'Node Modules content will be read.');
    this.application.use('/node_modules', express.static(nodeModulesFolder));
  }



}
