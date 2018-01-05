import * as bunyan from 'bunyan';
import * as path from 'path';
import { LoggerParent } from '../../logger/logger';
import CommonController from './CommonController';
import IRule from '../../../common/interfaces/IRule';
import IState from '../../../common/interfaces/IState';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const type: string = 'rules';

export default class RuleController extends CommonController<IRule> {
  constructor(bridgeUri: string) {
    super(type, bridgeUri, bunyanLogger);
  }

  setState(itemId: string, state: IState): Promise<IState> {
    throw new Error('Method not implemented.');
  }
  getState(itemId: string): Promise<IState> {
    throw new Error('Method not implemented.');
  }
  select(itemId: string): Promise<IState> {
    throw new Error('Method not implemented.');
  }
}
