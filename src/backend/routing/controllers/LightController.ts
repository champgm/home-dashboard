import { LoggerParent } from '../../logger/logger';
import * as bunyan from 'bunyan';
import * as makeRequest from 'request-promise';
import * as path from 'path';
import CommonController from './CommonController';
import ILight from '../../../common/interfaces/ILight';
import IRequestOptions from '../../../common/interfaces/IRequestOptions';
import IState from '../../../common/interfaces/IState';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const type: string = 'lights';

export default class LightController extends CommonController<ILight> {

  constructor(bridgeUri: string) {
    super(type, bridgeUri, bunyanLogger);
  }

  async setState(itemId: string, state: IState): Promise<IState> {
    const options: IRequestOptions = this.requestOptionsUtil.putWithBody(`${this.type}/${itemId}/state`, state);
    console.log(`Will PUT with options: ${JSON.stringify(options)}`);
    await makeRequest(options);
    return (await this.get(itemId)).state;
  }

  async getState(itemId: string): Promise<IState> {
    const options: IRequestOptions = this.requestOptionsUtil.simpleGet(`${this.type}/${itemId}/state`);
    this.logger.info({ options }, 'Will GET with options.');
    const item: IState = await makeRequest(options);
    return item;
  }

  async select(itemId: string): Promise<IState> {
    bunyanLogger.info({ itemId }, `Select called for ${type}`);
    const item: ILight = await this.get(itemId);
    bunyanLogger.info({ item }, 'Item retrieved.');
    const toggledState: IState = { on: !(item.state.on) };
    return this.setState(itemId, toggledState);
  }

}
