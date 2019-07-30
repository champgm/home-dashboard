import {Item} from "./Item";

export interface Map<T extends Item> {
 [index: string]: T;
}
