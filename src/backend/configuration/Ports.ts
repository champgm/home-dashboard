import * as path from 'path';
import * as bunyan from 'bunyan';
import { LoggerParent } from '../logger/logger';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export class Ports {
  externalPort: number;
  internalPort: number;
}

export function getPorts(): Ports {
  // This is the port on which the normal hue-stuff will start
  let internalPort: number;
  if (process.env.HUE_WEB_PORT) {
    bunyanLogger.info('Internal Express port set.');
    internalPort = process.env.HUE_WEB_PORT;
  } else {
    bunyanLogger.info('Internal Express port not set.');
    internalPort = 8888;
  }
  bunyanLogger.info({ internalPort }, 'Internal Express port configured.');

  // This is the port on which the echo endpoints will start
  let externalPort: number;
  if (process.env.EXTERNAL_WEB_PORT) {
    bunyanLogger.info('External Express port set.');
    externalPort = process.env.EXTERNAL_WEB_PORT;
  } else {
    bunyanLogger.info('External Express port not set.');
    externalPort = 8889;
  }
  bunyanLogger.info({ externalPort }, 'External Express port configured.');

  return {
    externalPort,
    internalPort,
  };
}
