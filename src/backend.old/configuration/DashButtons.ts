import * as path from 'path';
import * as bunyan from 'bunyan';
import { LoggerParent } from '../logger/logger';
import { dashButtonConfiguration } from '../../../.env';
const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export function getDashButtonMap(): {} {
  let dashButtonMap: {};
  if (dashButtonConfiguration.DASH_BUTTON_MAC_MAP) {
    bunyanLogger.info('Found dash button map.');
    try {
      dashButtonMap = dashButtonConfiguration.DASH_BUTTON_MAC_MAP;
    } catch (exception) {
      bunyanLogger.error({ dashButtonMap: dashButtonConfiguration.DASH_BUTTON_MAC_MAP },
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
