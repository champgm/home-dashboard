import * as bunyan from 'bunyan';
import * as path from 'path';
import { LoggerParent } from '../../logger/logger';
import CommonController from './CommonController';
import ISchedule from '../../../common/interfaces/ISchedule';
import IState from '../../../common/interfaces/IState';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const type: string = 'schedules';

export default class ScheduleController extends CommonController<ISchedule> {
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
