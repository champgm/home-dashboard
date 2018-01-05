import State from './IState';
import IItem from './IItem';

export default interface ILight extends IItem {
  state: State;
}
