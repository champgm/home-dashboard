import {Item} from "./Item";

export interface RequestOptions extends Item {
 method: string;
 uri: string;
 json: boolean;
 body?: any;
}
