import * as nodeDashButton from 'node-dash-button';
import { getDashButtonMap } from '../configuration/DashButtons';
import { Ports } from '../configuration/Ports';
import * as makeRequest from 'request-promise';
import { networkConfiguration } from '../../../.env';

export default class DashButtonRouter {
  expressPorts: Ports;
  dashButtonMap: any;

  constructor(expressPorts: Ports) {
    this.expressPorts = expressPorts;
    this.dashButtonMap = getDashButtonMap();
  }

  async watch(): Promise<boolean> {
    const dashWatcher: any = nodeDashButton(
      Object.keys(this.dashButtonMap),
      networkConfiguration.INTERFACE_NAME,
      null,
      'all');
    dashWatcher.on('detected', (macAddress) => {
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
