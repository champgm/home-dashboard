import { LoggerParent } from './logger';
import { environment } from '../../.env';
import bunyan from 'bunyan';
import path from 'path';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });


export function getPort(): number {
  let internalPort: number;
  if (environment.WEB_PORT) {
    bunyanLogger.info('Internal Express port set.');
    internalPort = environment.WEB_PORT;
  } else {
    bunyanLogger.info('Internal Express port not set.');
    internalPort = 8888;
  }
  bunyanLogger.info({ internalPort }, 'Internal Express port configured.');

  return internalPort;
}

export function getDashButtonMap(): {} {
  let dashButtonMap: {};
  if (environment.DASH_BUTTON_MAC_MAP) {
    bunyanLogger.info('Found dash button map.');
    try {
      dashButtonMap = environment.DASH_BUTTON_MAC_MAP;
    } catch (exception) {
      bunyanLogger.error({ dashButtonMap: environment.DASH_BUTTON_MAC_MAP },
        'Could not parse configured dash button map!');
      throw exception;
    }
  } else {
    bunyanLogger.info('No dash button map configured.');
    dashButtonMap = {};
  }
  bunyanLogger.info({ dashButtonMap }, 'Dash button map configured.');

  return dashButtonMap;
}


export function getBridgeDetails() {
  // This is the IP on which the bridge resides
  if (!environment.HUE_BRIDGE_IP) {
    throw new Error('Bridge IP not set.');
  } else {
    bunyanLogger.info('Bridge IP set.');
  }
  bunyanLogger.info({ bridgeIp: environment.HUE_BRIDGE_IP }, 'Bridge IP configured.');

  // This is the API key that will authenticate you to the bridge.
  // More info here: https://developers.meethue.com/documentation/getting-started
  // ctrl+f for "please create a new resource"
  if (!environment.HUE_BRIDGE_TOKEN) {
    throw new Error('Bridge token not set.');
  } else {
    bunyanLogger.info('Bridge token configured.');
  }

  // This is the port on which the bridge listens
  let bridgePort: number;
  if (environment.HUE_BRIDGE_PORT) {
    bunyanLogger.info('Bridge port set.');
    bridgePort = environment.HUE_BRIDGE_PORT;
  } else {
    bunyanLogger.info('Bridge port not set.');
    bridgePort = 80;
  }
  bunyanLogger.info({ bridgePort }, 'Bridge port configured.');

  return {
    bridgeIp: environment.HUE_BRIDGE_IP,
    bridgeToken: environment.HUE_BRIDGE_TOKEN,
    bridgePort,
  };
}


export function getBroadcastAddress(): string {
  // Just a logger to let you know if TP Link plugs are configured
  if (!environment.BROADCAST_ADDRESS) {
    bunyanLogger.error('No broadcast address configured.');
  } else {
    bunyanLogger.info({ address: environment.BROADCAST_ADDRESS }, 'Found broadcast address.');
  }
  return environment.BROADCAST_ADDRESS;
}
