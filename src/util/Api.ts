import requestPromise from 'request-promise-native';
import { ILight } from 'node-hue-api';
import cloneDeep from 'lodash.clonedeep';

export default class Api {
  public async getLights() {
    const response = await requestPromise.get('http://localhost:1981/lights', { json: true });
    return response.payload;
  }
  public async toggleLight(light: ILight) {
    const body = cloneDeep(light.state);
    body.on = !body.on;
    const options = { body, json: true };
    const url = `http://localhost:1981/lights/${light.id}/state`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }
}
