import * as path from 'path';
import * as bunyan from 'bunyan';
import { LoggerParent } from '../logger/logger';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export function getBroadcastAddress(): string {
  // Just a logger to let you know if TP Link plugs are configured
  if (!process.env.BROADCAST_ADDRESS) {
    bunyanLogger.error('No broadcast address configured.');
  } else {
    bunyanLogger.info({ address: process.env.BROADCAST_ADDRESS }, 'Found broadcast address.');
  }

  return process.env.BROADCAST_ADDRESS;
}
