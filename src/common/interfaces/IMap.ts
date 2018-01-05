import IItem from './IItem';

export default interface IMap<T extends IItem> {
  [index: string]: T;
}
