import core from 'express';
import path from 'path';
import bunyan from 'bunyan';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import LoggerParent from './common/logger';
import { getPort } from './common/Configuration';
import { routeStaticEndpoints } from './static/Static';
import { routeEndpoints } from './hue/HueRouter';
import TpLinkRouter, { tpLinkRouter } from './tplink/TpLinkRouter';
import { routeFavoritesEndpoints } from './common/FavoritesRouter';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
process.on('unhandledRejection', (error) => {
  if (error.message !== "Cannot read property 'current' of undefined") {
    bunyanLogger.error(error, 'Unhandled promise rejection caught');
  }
});

const router = core.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const expressApp: core.Express = core();
expressApp.use(morgan('common'));
expressApp.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


tpLinkRouter.watch().routeEndpoints(router);
routeStaticEndpoints(expressApp);
routeEndpoints(router, bunyanLogger);
routeFavoritesEndpoints(router, bunyanLogger);
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
