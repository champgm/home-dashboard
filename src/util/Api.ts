import requestPromise from 'request-promise-native';
import { ILight, ILightGroup } from 'node-hue-api';
import cloneDeep from 'lodash.clonedeep';
import { IPlug } from './Interfaces';
import { Favorites } from './Interfaces';

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
  public async getGroups() {
    const response = await requestPromise.get('http://localhost:1981/groups', { json: true });
    return response.payload;
  }
  public async toggleGroup(group: ILightGroup) {
    const body = cloneDeep(group.action);
    body.on = !body.on;
    const options = { body, json: true };
    const url = `http://localhost:1981/groups/${group.id}/action`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }
  public async editGroup(group: ILightGroup) {
    const options = { body: group, json: true };
    const url = `http://localhost:1981/groups`;
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
    return response.payload;
  }

  public async toggleFavorite(item: any) {
    const favorites: Favorites = await this.getFavorites();
    const url = `http://localhost:1981/favorites/${item.deviceType}s/${item.id}`;
    const currentFavorites = favorites[`${item.deviceType}s`];
    const method = currentFavorites.indexOf(item.id) > -1 ? 'delete' : 'put';
    await requestPromise[method](url, { json: true });
    return this.getFavorites();
  }

}
