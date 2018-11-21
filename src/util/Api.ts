import requestPromise from 'request-promise-native';
import { ILight, ILightGroup } from 'node-hue-api';
import cloneDeep from 'lodash.clonedeep';
import { IPlug, Favorites } from './Interfaces';

export default class Api {
  private baseUrl = window.location.origin;
  public async getLights() {
    const response = await requestPromise.get('/lights', { baseUrl: this.baseUrl, json: true });
    return response.payload;
  }
  public async toggleLight(light: ILight) {
    const body = cloneDeep(light.state);
    body.on = !body.on;
    const options = { baseUrl: this.baseUrl, body, json: true };
    const url = `/lights/${light.id}/state`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }
  public async editLight(light: ILight) {
    const options = { baseUrl: this.baseUrl, body: light, json: true };
    const url = `/lights`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }
  public async getGroups() {
    const response = await requestPromise.get('/groups', { baseUrl: this.baseUrl, json: true });
    return response.payload;
  }
  public async toggleGroup(group: ILightGroup) {
    const body = cloneDeep(group.action);
    body.on = !body.on;
    const options = { baseUrl: this.baseUrl, body, json: true };
    const url = `/groups/${group.id}/action`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }
  public async editGroup(group: ILightGroup) {
    const options = { baseUrl: this.baseUrl, body: group, json: true };
    const url = `/groups`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }

  public async getPlugs() {
    const response = await requestPromise.get('/plugs', { baseUrl: this.baseUrl, json: true });
    return response.payload;
  }
  public async editPlug(plug: IPlug) {
    const options = { baseUrl: this.baseUrl, body: plug, json: true };
    const url = `/plugs`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }
  public async togglePlug(plug: IPlug) {
    const body = { on: !plug.state.on };
    const options = { baseUrl: this.baseUrl, body, json: true };
    const url = `/plugs/${plug.id}/state`;
    const response = await requestPromise.put(url, options);
    return response.payload;
  }

  public async getFavorites() {
    const response = await requestPromise.get(
      '/favorites',
      { baseUrl: this.baseUrl, json: true });
    return response.payload;
  }

  public async toggleFavorite(item: any) {
    const favorites: Favorites = await this.getFavorites();
    const url = `/favorites/${item.deviceType}s/${item.id}`;
    const currentFavorites = favorites[`${item.deviceType}s`];
    // const method = currentFavorites.indexOf(item.id) > -1 ? 'delete' : 'put';
    if (currentFavorites.indexOf(item.id) > -1) {
      await requestPromise.delete(url, { baseUrl: this.baseUrl, json: true });
    } else {
      await requestPromise.put(url, { baseUrl: this.baseUrl, json: true });
    }
    return this.getFavorites();
  }
}
