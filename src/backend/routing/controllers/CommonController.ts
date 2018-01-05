import * as bunyan from 'bunyan';
import * as makeRequest from 'request-promise';
import RequestOptionsUtil from './utilities/RequestOptionsUtil';
import IState from '../../../common/interfaces/IState';
import IMap from '../../../common/interfaces/IMap';
import IItem from '../../../common/interfaces/IItem';

export default abstract class CommonController<ItemType extends IItem> {
  type: string;
  logger: bunyan;
  requestOptionsUtil: RequestOptionsUtil;

  constructor(type: string, bridgeUri: string, logger: bunyan) {
    this.type = type;
    this.logger = logger;
    this.requestOptionsUtil = new RequestOptionsUtil(bridgeUri);
  }

  async getAll(): Promise<IMap<ItemType>> {
    const options: any = this.requestOptionsUtil.simpleGet(this.type);
    this.logger.info({ options }, 'Will GET with options.');
    const items: any[] = await makeRequest(options);

    const itemMap: IMap<ItemType> = {};
    for (const id in items) {
      if (Object.prototype.hasOwnProperty.call(items, id)) {
        const item: any = items[id];
        item.id = id;
        itemMap[id] = item;
      }
    }

    return itemMap;
  }

  async get(id: string): Promise<ItemType> {
    const options: any = this.requestOptionsUtil.simpleGet(`${this.type}/${id}`);
    this.logger.info({ options }, 'Will GET with options.');
    const item: any = await makeRequest(options);
    return item;
  }

  async update(itemId: string, json: ItemType): Promise<ItemType> {
    const uri: string = `${this.type}/${itemId}`;
    const putOptions: any = this.requestOptionsUtil.putWithBody(uri, json);
    const response: any = await makeRequest(putOptions);
    return response;
  }

  async turnOff(itemId: string): Promise<IState> {
    const offState: any = { on: false };
    return this.setState(itemId, offState);
  }

  async turnOn(itemId: string): Promise<IState> {
    const onState: any = { on: true };
    return this.setState(itemId, onState);
  }

  abstract async setState(itemId: string, state: IState): Promise<IState>;
  abstract async getState(itemId: string): Promise<IState>;
  abstract async select(itemId: string): Promise<IState>;

}
