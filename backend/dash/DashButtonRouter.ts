import nodeDashButton from 'node-dash-button';
import { getDashButtonMap } from '../common/Configuration';
import request from 'request-promise-native';
import { notEmptyOrBlank } from '../common/Util';
import bunyan from 'bunyan';

export default class DashButtonRouter {
  public dashButtonMap: any;

  constructor(private logger: bunyan) {
    this.dashButtonMap = getDashButtonMap();
  }

  public async watch(): Promise<boolean> {
    const dashWatcher: any = nodeDashButton(Object.keys(this.dashButtonMap), null, null, 'all');
    dashWatcher.on('detected', async (macAddress) => {
      const url: string = this.dashButtonMap[macAddress];
      if (notEmptyOrBlank(url)) {
        this.logger.info({ macAddress, url }, 'Found and mapped dash button');
        const options: any = {
          method: 'GET',
          uri: `${url}`,
          json: true,
        };
        await request(options);
      } else {
        this.logger.info({ macAddress }, 'Found unmapped dash button');
      }
    });
    this.logger.info('Watching for dash buttons');
    return true;
  }
}
