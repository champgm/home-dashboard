import * as path from 'path';
import * as bunyan from 'bunyan';
import { LoggerParent } from '../logger/logger';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export class BridgeDetails {
  bridgeIp: string;
  bridgeToken: string;
  bridgePort: number;
}

export function getBridgeDetails(): BridgeDetails {
  // This is the IP on which the bridge resides
  if (!process.env.HUE_BRIDGE_IP) {
    throw new Error('Bridge IP not set.');
  } else {
    bunyanLogger.info('Bridge IP set.');
  }
  bunyanLogger.info({ bridgeIp: process.env.HUE_BRIDGE_IP }, 'Bridge IP configured.');

  // This is the API key that will authenticate you to the bridge.
  // More info here: https://developers.meethue.com/documentation/getting-started
  // ctrl+f for "please create a new resource"
  if (!process.env.HUE_BRIDGE_TOKEN) {
    throw new Error('Bridge token not set.');
  } else {
    bunyanLogger.info('Bridge token configured.');
  }

  // This is the port on which the bridge listens
  let bridgePort: number;
  if (process.env.HUE_BRIDGE_PORT) {
    bunyanLogger.info('Bridge port set.');
    bridgePort = process.env.HUE_BRIDGE_PORT;
  } else {
    bunyanLogger.info('Bridge port not set.');
    bridgePort = 80;
  }
  bunyanLogger.info({ bridgePort }, 'Bridge port configured.');

  return {
    bridgeIp: process.env.HUE_BRIDGE_IP,
    bridgeToken: process.env.HUE_BRIDGE_TOKEN,
    bridgePort
  };
}
