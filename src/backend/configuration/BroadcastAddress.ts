import * as path from 'path';
import * as bunyan from 'bunyan';
import { LoggerParent } from '../logger/logger';
import { networkConfiguration } from '../../../.env';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export function getBroadcastAddress(): string {
  // Just a logger to let you know if TP Link plugs are configured
  if (!networkConfiguration.BROADCAST_ADDRESS) {
    bunyanLogger.error('No broadcast address configured.');
  } else {
    bunyanLogger.info({ address: networkConfiguration.BROADCAST_ADDRESS }, 'Found broadcast address.');
  }

  return networkConfiguration.BROADCAST_ADDRESS;
}
