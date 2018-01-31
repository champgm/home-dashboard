import { LoggerParent } from '../../logger/logger';
import * as bunyan from 'bunyan';
import * as makeRequest from 'request-promise';
import * as path from 'path';
import CommonController from './CommonController';
import IGroup from '../../../common/interfaces/IGroup';
import IRequestOptions from '../../../common/interfaces/IRequestOptions';
import IState from '../../../common/interfaces/IState';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const type: string = 'groups';

export default class GroupController extends CommonController<IGroup> {

  constructor(bridgeUri: string) {
    super(type, bridgeUri, bunyanLogger);
  }

  async setState(itemId: string, state: IState): Promise<IState> {
    const options: IRequestOptions = this.requestOptionsUtil.putWithBody(`${this.type}/${itemId}/action`, state);
    console.log(`Will PUT with options: ${JSON.stringify(options)}`);
    await makeRequest(options);
    return this.getState(itemId);
  }

  async getState(itemId: string): Promise<IState> {
    const options: IRequestOptions = this.requestOptionsUtil.simpleGet(`${this.type}/${itemId}/action`);
    this.bunyanLogger.info({ options }, 'Will GET with options.');
    const item: IState = await makeRequest(options);
    return item;
  }

  async select(groupId: string): Promise<IState> {
    const group: IGroup = await this.get(groupId);
    const toggledAction: IState = { on: !(group.action.on) };
    return this.setState(groupId, toggledAction);
  }

}
