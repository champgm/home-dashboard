import IState from 'common/interfaces/IState';

export default interface IItem {
  id?: string;
  name?: string;
  state?: IState;
}
