import { Client } from "tplink-smarthome-api";
import { broadcastAddress } from "../configuration/Hue";
import {
  create as createPlug,
  createSubmittable as createSubmittablePlug,
  Plug,
  Plugs,
} from "../models/Plug";
import { triggerUpdate } from "../tabs/common/Alerter";

export class PlugsApi {
  client: any;
  knownPlugs: { [ip: string]: Plug };
  knownPlugIps: string[];

  constructor() {
    this.knownPlugIps = [];
    this.knownPlugs = {};
    this.client = new Client();
  }

  watch() {
    const watchForNewPlugs: any = async (plug: any): Promise<void> => {
      this.knownPlugs[plug.host] = await this.get(plug.host);
      console.log(`New plug found: ${JSON.stringify(this.knownPlugs[plug.host])}`);
      if (!(plug.host in this.knownPlugs)) {
        this.knownPlugIps.push(plug.host);
        triggerUpdate();
      }
    };

    const watchForKnownPlugs: any = (plug: any): void => {
      plug.getInfo().then(async (info) => {
        this.knownPlugs[plug.host] = await this.get(plug.host);
        if (!(plug.host in this.knownPlugs)) {
          this.knownPlugIps.push(plug.host);
          triggerUpdate();
        }
      });
    };

    const watchForOfflinePlugs: any = (plug: any): void => {
      plug.getInfo().then((info) => {
        console.log(`New plug found: ${JSON.stringify(plug, null, 2)}`);
        this.knownPlugIps.splice(this.knownPlugIps.indexOf(plug.host), 1);
        delete this.knownPlugs[plug.host];
        triggerUpdate();
      });
    };

    console.log(`Starting plug discovery`);
    this.client.startDiscovery({ broadcast: broadcastAddress })
      .on("plug-new", watchForNewPlugs)
      .on("plug-online", watchForKnownPlugs)
      .on("plug-offline", watchForOfflinePlugs);
    this.client.sendDiscovery();
    return this;
  }

  async getAll(): Promise<Plugs> {
    this.client.sendDiscovery();
    const allPlugData = await Promise.all(this.knownPlugIps.map((ip) => {
      return this.get(ip);
    }));
    allPlugData.forEach((plug) => {
      this.knownPlugs[plug.host] = plug;
    });
    return this.knownPlugs;
  }

  async get(id: string): Promise<Plug> {
    const rawData: any = await this.client.getDevice({ host: id });
    const plugDataPromise: Promise<any> = rawData.getSysInfo();
    const plugStatePromise: Promise<any> = rawData.getPowerState();
    const plugData: any = await plugDataPromise;
    plugData.id = id;
    plugData.name = plugData.alias;
    plugData.state = { on: await plugStatePromise };
    return plugData;
  }

  async searchForNew() {
    this.client.sendDiscovery();
  }

  async getSome(ids: string[]): Promise<Plugs> {
    const allPlugs = this.getAll();
    Object.keys(allPlugs).forEach((key) => {
      if (!ids.includes(key)) {
        delete allPlugs[key];
      }
    });
    return allPlugs;
  }

  // async put(plug: Plug): Promise<void> {
  //   const plugClient: any = await this.getPlugClient(plug.id);
  //   const setStateResult: boolean = await plugClient.setPowerState(plug.on);
  //   triggerUpdate();
  // }

  async setState(plugId: string, on: boolean): Promise<void> {
    const plugClient: any = await this.getPlugClient(plugId);
    const setStateResult: boolean = await plugClient.setPowerState(on);
    triggerUpdate();
  }

  attachId(plugsMap: Plugs): Plugs {
    for (const plugId of Object.keys(plugsMap)) {
      plugsMap[plugId].id = plugId;
      plugsMap[plugId] = createPlug(plugsMap[plugId]);
    }
    return plugsMap;
  }

  private async getPlugClient(plugId: string): Promise<any> {
    return this.client.getDevice({ host: plugId });
  }
}
