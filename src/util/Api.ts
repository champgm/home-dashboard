import requestPromise from 'request-promise-native';
import { ILight } from 'node-hue-api';
import cloneDeep from 'lodash.clonedeep';
import { IPlug } from './IPlug';

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
  public async editLight(light: ILight) {
    const options = { body: light, json: true };
    const url = `http://localhost:1981/lights`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }

  public async getPlugs() {
    const response = await requestPromise.get('http://localhost:1981/plugs', { json: true });
    return response.payload;
  }
  public async editPlug(plug: IPlug) {
    const options = { body: plug, json: true };
    const url = `http://localhost:1981/plugs`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }
  public async togglePlug(plug: IPlug) {
    const body = { on: !plug.state.on };
    const options = { body, json: true };
    const url = `http://localhost:1981/plugs/${plug.id}/state`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }

  public async getFavorites() {
    const response = await requestPromise.get('http://localhost:1981/favorites', { json: true });
    console.log(`Favorites from backend: ${JSON.stringify(response)}`);
    return response.payload;
  }

}
