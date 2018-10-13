import * as path from 'path';
import * as bunyan from 'bunyan';
import { LoggerParent } from '../logger/logger';
import { webConfiguration } from '../../../.env';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export class Ports {
  internalPort: number;
}

export function getPorts(): Ports {
  let internalPort: number;
  if (webConfiguration.WEB_PORT) {
    bunyanLogger.info('Internal Express port set.');
    internalPort = webConfiguration.WEB_PORT;
  } else {
    bunyanLogger.info('Internal Express port not set.');
    internalPort = 8888;
  }
  bunyanLogger.info({ internalPort }, 'Internal Express port configured.');

  return {
    internalPort
  };
}
