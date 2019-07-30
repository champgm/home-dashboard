import {Item} from "./Item";
import {Map} from "./Map";
import {State} from "./State";

export interface IScene extends Item {
 sceneId?: string;
 id?: string;
 version?: number;
 lightStates?: Map<State>;
 name: string;
 storelightstate?: boolean;
 lights?: string[];
 transitiontime?: number;
 recycle: boolean;
}
