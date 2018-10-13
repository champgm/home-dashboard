import * as nodeDashButton from 'node-dash-button';
import { getDashButtonMap } from './DashButtons';
import * as makeRequest from 'request-promise';

export default class DashButtonRouter {
  dashButtonMap: any;

  constructor() {
    this.dashButtonMap = getDashButtonMap();
  }

  async watch(): Promise<boolean> {
    const dashWatcher: any = nodeDashButton(Object.keys(this.dashButtonMap), null, null, 'all');
    dashWatcher.on('detected', macAddress => {
      const url: string = this.dashButtonMap[macAddress];
      console.log(`Found a dash button: ${macAddress} mapped to url: ${url}`);

      const options: any = {
        method: 'GET',
        uri: `${url}`,
        json: true
      };
      makeRequest(options);
    });

    return true;
  }
}
