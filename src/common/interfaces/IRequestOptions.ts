import IItem from './IItem';

export default interface IRequestOptions extends IItem {
  method: string;
  uri: string;
  json: boolean;
  body?: any;
}
