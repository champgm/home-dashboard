import { Client } from 'tplink-smarthome-api';
import { environment } from '../../.env';
import { Router } from 'express';
import { asyncHandler } from '../common/Util';
import { IPlug } from '../../src/util/IPlug';

export default class TpLinkRouter {
  private client: Client;
  private knownPlugs: { [key: string]: any } = {};
  private knownPlugIps: string[];
  private broadcastAddress: string;
  constructor() {
    this.broadcastAddress = environment.BROADCAST_ADDRESS;
    this.knownPlugIps = [];
    this.knownPlugs = {};
    this.client = new Client();
  }

  public routeEndpoints(router: Router) {
    router.get('/plugs', asyncHandler(async (request, response) => {
      return { code: 200, payload: this.knownPlugs };
    }));
    router.put('/plugs', asyncHandler(async (request, response) => {
      const plugChanges: IPlug = request.body;
      console.log(`got plug update: ${JSON.stringify(plugChanges, null, 2)}`);
      const plug = await this.get(plugChanges.id);
      console.log(`Got current plug: ${JSON.stringify(plug)}`);
      if (plugChanges.name !== plug.name) {
        const plugClient = await this.getPlugClient(plugChanges.id);
        console.log(`Got plug client`);
        console.log(`Setting plug alias: ${plugChanges.name}`);
        await plugClient.setAlias(plugChanges.name);
      }
      this.knownPlugs[plug.id] = await this.get(plugChanges.id);
      return { code: 200, payload: this.knownPlugs };
    }));
    router.put('/plugs/:id/state', asyncHandler(async (request, response) => {
      const id = request.params.id;
      console.log(`Setting state: ${JSON.stringify(request.body, null, 2)}`);
      await this.setState(id, request.body);
      const plug = await this.get(id);
      this.knownPlugs[plug.id] = plug;
      return { code: 200, payload: this.knownPlugs };
    }));
  }

  public watch() {
    const watchForNewPlugs: any = async (plug: any): Promise<void> => {
      plug.state = { on: plug.getPowerState() };
      this.knownPlugs[plug.host] = await this.get(plug.host);
      console.log(`New plug found: ${JSON.stringify(this.knownPlugs[plug.host])}`);
      if (!(plug.host in this.knownPlugs)) {
        this.knownPlugIps.push(plug.host);
      }
    };

    const watchForKnownPlugs: any = (plug: any): void => {
      plug.getInfo().then(async (info) => {
        plug.state = { on: plug.getPowerState() };
        this.knownPlugs[plug.host] = await this.get(plug.host);
        if (!(plug.host in this.knownPlugs)) {
          this.knownPlugIps.push(plug.host);
        }
      });
    };

    const watchForOfflinePlugs: any = (plug: any): void => {
      plug.getInfo().then((info) => {
        console.log(`New plug found: ${JSON.stringify(plug, null, 2)}`);
        this.knownPlugIps.splice(this.knownPlugIps.indexOf(plug.host), 1);
        delete this.knownPlugs[plug.host];
      });
    };

    console.log(`Starting plug discovery`);
    this.client.startDiscovery({ broadcast: this.broadcastAddress })
      .on('plug-new', watchForNewPlugs)
      .on('plug-online', watchForKnownPlugs)
      .on('plug-offline', watchForOfflinePlugs);
    this.client.sendDiscovery();
    return this;
  }

  private async getAll(): Promise<{}> {
    return this.knownPlugs;
  }

  private async get(plugId: string): Promise<any> {
    const rawData: any = await this.client.getDevice({ host: plugId });
    const plugDataPromise: Promise<any> = rawData.getSysInfo();
    const plugStatePromise: Promise<any> = rawData.getPowerState();
    const plugData: any = await plugDataPromise;
    plugData.id = plugId;
    plugData.name = plugData.alias;
    plugData.state = { on: await plugStatePromise };
    return plugData;
  }

  private async getPlugClient(plugId: string): Promise<any> {
    return await this.client.getDevice({ host: plugId });
  }

  private async setState(plugId: string, state: any): Promise<any> {
    const plug: any = await this.getPlugClient(plugId);
    const setStateResult: boolean = await plug.setPowerState(state.on);
    return { on: await plug.getPowerState() };
  }

  private async select(plugId: string): Promise<any> {
    const plug: any = await this.getPlugClient(plugId);
    const currentPowerState: boolean = await plug.getPowerState();
    return this.setState(plugId, { on: !currentPowerState });
  }

  private async turnOff(plugId: string): Promise<any> {
    return await this.setState(plugId, { on: false });
  }

  private async turnOn(plugId: string): Promise<any> {
    return await this.setState(plugId, { on: true });
  }

  private async update(itemId: string, json: any): Promise<any> {
    await this.setState(itemId, { on: json.on });
    return this.get(itemId);
  }

  private async getState(plugId: string): Promise<any> {
    const plug: any = await this.getPlugClient(plugId);
    const currentPowerState: boolean = await plug.getPowerState();
    return { on: currentPowerState };
  }
}
