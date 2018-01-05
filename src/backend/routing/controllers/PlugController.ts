import { LoggerParent } from '../../logger/logger';
import * as bunyan from 'bunyan';
import * as Hs100Api from 'hs100-api';
import * as path from 'path';
import CommonController from '../../routing/controllers/CommonController';
import IMap from '../../../common/interfaces/IMap';
import IPlug from '../../../common/interfaces/IPlug';
import IState from '../../../common/interfaces/IState';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });

export default class PlugController extends CommonController<IPlug> {

  client: Hs100Api.Client;
  knownPlugs: IMap<IPlug> = {};
  knownPlugIps: any[];

  constructor(broadcastAddress: string) {
    super('', '', bunyanLogger);
    this.knownPlugIps = [];
    this.knownPlugs = {};
    this.client = new Hs100Api.Client({
      broadcast: broadcastAddress
    });

    const watchForNewPlugs: any = (plug: any): void => {
      plug.getInfo().then((info) => {
        bunyanLogger.info({ plugName: plug.name, host: plug.host }, 'New plug found.');
      });
      plug.setPowerState(true);
      this.knownPlugs[plug.host] = this.trimPlug(plug);
      if (!(plug.host in this.knownPlugs)) {
        plug.id = plug.host;
        this.knownPlugIps.push(plug.host);
      }
    };

    const watchForKnownPlugs: any = (plug: any): void => {
      plug.getInfo().then((info) => {
        bunyanLogger.info({ plugName: plug.name, host: plug.host }, 'Known plug found.');
        this.knownPlugs[plug.host] = this.trimPlug(plug);
        if (!(plug.host in this.knownPlugs)) {
          plug.id = plug.host;
          this.knownPlugIps.push(plug.host);
        }
      });
    };

    bunyanLogger.info('Starting plug discovery.');
    this.client.startDiscovery()
      .on('plug-new', watchForNewPlugs)
      .on('plug-online', watchForKnownPlugs);
    this.client.sendDiscovery();
  }

  async getAll(): Promise<IMap<IPlug>> {
    return this.knownPlugs;
  }

  async get(plugId: string): Promise<IPlug> {
    const plug: IPlug = await this.client.getPlug({ host: plugId });
    return plug;
  }

  async setState(plugId: string, state: IState): Promise<IState> {
    const plug: IPlug = await this.get(plugId);
    const setStateResult: boolean = await plug.setPowerState(state.on);
    return { on: state.on };
  }

  async select(plugId: string): Promise<IState> {
    const plug: IPlug = await this.get(plugId);
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

  trimPlug(originalPlug: IPlug): IPlug {
    const trimmedPlug: any = {};
    trimmedPlug.deviceId = originalPlug.deviceId;
    trimmedPlug.host = originalPlug.host;
    trimmedPlug.port = originalPlug.port;
    trimmedPlug.name = originalPlug.name;
    trimmedPlug.deviceName = originalPlug.deviceName;
    trimmedPlug.model = originalPlug.model;
    trimmedPlug.softwareVersion = originalPlug.softwareVersion;
    trimmedPlug.hardwareVersion = originalPlug.hardwareVersion;
    trimmedPlug.mac = originalPlug.mac;
    trimmedPlug.latitude = originalPlug.latitude;
    trimmedPlug.longitude = originalPlug.longitude;
    trimmedPlug.status = originalPlug.status;
    trimmedPlug.sysInfo = originalPlug.sysInfo;
    trimmedPlug.cloudInfo = originalPlug.cloudInfo;
    trimmedPlug.consumption = originalPlug.consumption;
    return trimmedPlug;
  }

  async getState(plugId: string): Promise<IState> {
    const plug: IPlug = await this.get(plugId);
    const currentPowerState: boolean = await plug.getPowerState();
    return { on: currentPowerState };
  }
}
