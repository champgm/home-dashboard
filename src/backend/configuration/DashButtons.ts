import * as path from 'path';
import * as bunyan from 'bunyan';
import { LoggerParent } from '../logger/logger';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

// export class DashButtons {
//   macAddresses: {};
// }

export function getDashButtonMap(): {} {
  let dashButtonMap: {};
  if (process.env.DASH_BUTTON_MAC_MAP) {
    bunyanLogger.info('Found dash button map.');
    try {
      dashButtonMap = JSON.parse(process.env.DASH_BUTTON_MAC_MAP);
    } catch (exception) {
      bunyanLogger.error({ dashButtonMap: process.env.DASH_BUTTON_MAC_MAP },
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
