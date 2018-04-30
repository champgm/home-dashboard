import State from './IState';
import IItem from './IItem';

export default interface IGroup extends IItem {
  id?: string;
  action?: State;
  type?: string;
  class?: string;
}
