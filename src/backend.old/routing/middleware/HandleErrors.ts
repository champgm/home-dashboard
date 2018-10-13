import * as path from 'path';
import * as bunyan from 'bunyan';
import { LoggerParent } from '../../logger/logger'; )
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export function errorHandler(caughtError: any, request: any, response: any, next: any): void {
  const error: any = {};
  Object.keys(caughtError).forEach((key) => {
    error[key] = caughtError[key];
  });
  bunyanLogger.info({ error }, 'An unhandled error was caught.');

  response.status(500).send('Something broke!');
}
