import { LoggerParent } from '../../logger/logger';
import * as bunyan from 'bunyan';
import { Client } from 'tplink-smarthome-api';
import * as path from 'path';
import CommonController from '../../routing/controllers/CommonController';
import IMap from '../../../common/interfaces/IMap';
import IPlug from '../../../common/interfaces/IPlug';
import IState from '../../../common/interfaces/IState';
import * as CircularJSON from 'circular-json';
import * as _ from 'lodash';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export default class PlugController extends CommonController<IPlug> {

  client: Client;
  knownPlugs: IMap<IPlug> = {};
  knownPlugIps: any[];
  broadcastAddress: string;

  constructor(broadcastAddress: string) {
    super('', '', bunyanLogger);
    this.broadcastAddress = broadcastAddress;
    this.knownPlugIps = [];
    this.knownPlugs = {};
    this.client = new Client();
    // this.client = new Hs100Api.Client({
    //   broadcast: broadcastAddress
    // });

    const watchForNewPlugs: any = async (plug: any): Promise<void> => {
      plug.state = { on: plug.getPowerState() };
      this.knownPlugs[plug.host] = await this.get(plug.host);
      bunyanLogger.info({ plug: this.knownPlugs[plug.host] }, 'New plug found.');
      if (!(plug.host in this.knownPlugs)) {
        this.knownPlugIps.push(plug.host);
      }
    };

    const watchForKnownPlugs: any = (plug: any): void => {
      plug.getInfo().then(async (info) => {
        plug.state = { on: plug.getPowerState() };
        this.knownPlugs[plug.host] = await this.get(plug.host);
        bunyanLogger.info({ plug: plug.host }, 'Known plug found.');
        if (!(plug.host in this.knownPlugs)) {
          this.knownPlugIps.push(plug.host);
        }
      });
    };

    const watchForOfflinePlugs: any = (plug: any): void => {
      plug.getInfo().then((info) => {
        bunyanLogger.info({ plug }, 'Plug not found.');
        this.knownPlugIps.splice(this.knownPlugIps.indexOf(plug.host), 1);
        delete this.knownPlugs[plug.host];
      });
    };

    bunyanLogger.info('Starting plug discovery.');
    this.client.startDiscovery({ broadcast: this.broadcastAddress })
      .on('plug-new', watchForNewPlugs)
      .on('plug-online', watchForKnownPlugs)
      .on('plug-offline', watchForOfflinePlugs);
    this.client.sendDiscovery();
  }

  async getAll(): Promise<IMap<IPlug>> {
    return this.knownPlugs;
  }

  async get(plugId: string): Promise<any> {
    const rawData: any = await this.client.getDevice({ host: plugId });
    const plugDataPromise: Promise<any> = rawData.getSysInfo();
    const plugStatePromise: Promise<any> = rawData.getPowerState();
    const plugData: any = await plugDataPromise;
    plugData.id = plugId;
    plugData.name = plugData.alias;
    plugData.state = { on: await plugStatePromise };
    return plugData;
  }

  async getPlugClient(plugId: string): Promise<IPlug> {
    return await this.client.getDevice({ host: plugId });
  }

  async setState(plugId: string, state: IState): Promise<IState> {
    const plug: IPlug = await this.getPlugClient(plugId);
    const setStateResult: boolean = await plug.setPowerState(state.on);
    return { on: await plug.getPowerState() };
  }

  async select(plugId: string): Promise<IState> {
    const plug: IPlug = await this.getPlugClient(plugId);
    const currentPowerState: boolean = await plug.getPowerState();
    return this.setState(plugId, { on: !currentPowerState });
  }

  async turnOff(plugId: string): Promise<IState> {
    return await this.setState(plugId, { on: false });
  }

  async turnOn(plugId: string): Promise<IState> {
    return await this.setState(plugId, { on: true });
  }

  async update(itemId: string, json: IPlug): Promise<IPlug> {
    await this.setState(itemId, { on: json.on });
    return this.get(itemId);
  }

  async getState(plugId: string): Promise<IState> {
    const plug: IPlug = await this.getPlugClient(plugId);
    const currentPowerState: boolean = await plug.getPowerState();
    return { on: currentPowerState };
  }
}
