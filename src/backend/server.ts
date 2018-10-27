import DashButtonRouter from './dash/DashButtonRouter';
import core from 'express';
import path from 'path';
import bunyan from 'bunyan';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import LoggerParent from './common/logger';
import { getPort } from './common/Configuration';
import { routeStaticEndpoints } from './static/Static';
import { routeHueEndpoints } from './hue/HueRouter';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
process.on('unhandledRejection', (error) => {
  bunyanLogger.error(error);
});

new DashButtonRouter(bunyanLogger).watch();


const router = core.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const expressApp: core.Express = core();
expressApp.use(morgan('common'));
routeStaticEndpoints(expressApp);
routeHueEndpoints(router, bunyanLogger);
expressApp.use(router);


// Start the local server
bunyanLogger.info('Starting Hue application...');
try {
  const port = getPort();
  expressApp.listen(port, () => {
    bunyanLogger.info({ port }, 'API listening.');
  });
} catch (caughtError) {
  bunyanLogger.error({ keys: Object.getOwnPropertyNames(caughtError) }, 'error keys');
  const error: any = {
    message: caughtError.message,
    type: caughtError.type,
    stack: caughtError.stack,
  };
  bunyanLogger.error({ error }, 'An unhandled error was caught.');
}
