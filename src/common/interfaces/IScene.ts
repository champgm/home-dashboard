import State from './IState';
import IMap from './IMap';
import IItem from './IItem';

export default interface IScene extends IItem {
  sceneId?: string;
  id?: string;
  version: number;
  lightStates?: IMap<State>;
  name: string;
  storelightstate?: boolean;
  lights?: string[];
}

