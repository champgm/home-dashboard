import core from 'express';
import bunyan from 'bunyan';
import LoggerParent from '../common/logger';
import path from 'path';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export function routeStaticEndpoints(application: core.Express): void {
  // Add the webapp folder as static content. This contains the app UI.
  const webAppFolder: string = path.join(__dirname, '../../../dist');
  bunyanLogger.info({ webAppFolder }, 'Static content will be read.');
  application.use('/', core.static(webAppFolder));

  const indexFile: string = path.join(__dirname, '../../../dist/index.html');
  bunyanLogger.info({ indexFile }, 'Fallback content will be read.');
  application.use('/*', core.static(webAppFolder));
}
