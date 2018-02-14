import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import IMap from 'common/interfaces/IMap';
import IItem from 'common/interfaces/IItem';
import { createLogger } from 'browser-bunyan';
import * as traverse from 'traverse';
import ObjectUtil from 'common/util/ObjectUtil';
import ItemUtil from 'common/util/ItemUtil';
import IState from 'common/interfaces/IState';
import emptyScene from './emptyItems/EmptyScene';
import * as CircularJSON from 'circular-json';
import IScene from 'common/interfaces/IScene';
import IGroup from '../../../common/interfaces/IGroup';

@Injectable()
export class ItemService {
  bunyanLogger: any;

  constructor(private http: Http) {
    this.bunyanLogger = createLogger({ name: 'Item Service' });
  }

  async httpGet(uri: string): Promise<any> {
    return this.http.get(uri).toPromise();
  }

  async getItem(itemType: string, parameters: string): Promise<any> {
    const items: IMap<IItem> = await this.httpGet(`/${itemType}/${parameters}`)
      .then(response => {
        const json: IMap<IItem> = response.json();
        return json;
      });
    this.bunyanLogger.info({ items }, 'Get item result');
    return items;
  }

  async putState(itemType: string, state: any, originalItemId: string): Promise<{ errors: any[], successes: any[], singleResult: any }> {
    const editableFieldsOnly: any = this.removeUneditableFields(state);
    return await this.doPut(`${itemType}/${originalItemId}/state`, editableFieldsOnly);
  }

  async putAction(itemType: string, action: any, originalItemId: string): Promise<{ errors: any[], successes: any[], singleResult: any }> {
    const editableFieldsOnly: any = this.removeUneditableFields(action);
    return await this.doPut(`${itemType}/${originalItemId}/action`, editableFieldsOnly);
  }

  async putItem(itemType: string, item: IItem): Promise<{ errors: any[], successes: any[], singleResult: any }> {
    const editableFieldsOnly: IItem = this.removeUneditableFields(item);
    return await this.doPut(`${itemType}/${item.id}`, editableFieldsOnly);
  }

  async doPut(url: string, item: any): Promise<any> {
    this.bunyanLogger.info({ item }, 'Putting item');
    const response: Response = await this.http.put(url, item).toPromise();
    return this.parseResponse(response);
  }

  async selectItem(itemType: string, itemId: string): Promise<Response> {
    const response: Response = await this.httpGet(`/${itemType}/${itemId}/select`);
    const unsortedResult: any[] = JSON.parse(response['_body']);
    this.bunyanLogger.info({ unsortedResult }, 'Unsorted select result');
    return response;
  }

  async deleteItem(itemType: string, itemId: string): Promise<{ errors: any[], successes: any[], singleResult: any }> {
    const response: Response = await this.http.delete(`/${itemType}/${itemId}`).toPromise();
    const unsortedResult: any[] = JSON.parse(response['_body']);
    this.bunyanLogger.info({ unsortedResult }, 'Unsorted delete result');
    return this.parseResponse(response);
  }

  parseResponse(response: Response): { errors: any[], successes: any[], singleResult: any } {
    const unsortedResult: any[] = JSON.parse(response['_body']);
    this.bunyanLogger.info({ unsortedResult }, 'Unsorted result');
    const sortedResults: any = { errors: [], successes: [], singleResult: {} };
    if (Array.isArray(unsortedResult)) {
      for (const result of unsortedResult) {
        if (result.error) {
          sortedResults.errors = sortedResults.errors.concat(result.error);
        }
        if (result.success) {
          sortedResults.successes = sortedResults.successes.concat(result.success);
        }
      }
    } else {
      sortedResults.singleResult = unsortedResult;
    }
    this.bunyanLogger.info({ sortedResults }, 'Sorted result');
    return sortedResults;
  }

  getEmptyItem(itemType: string): any {
    switch (itemType) {
      case 'scenes':
        return CircularJSON.parse(CircularJSON.stringify(emptyScene));
      default:
        break;
    }
  }

  // Type-centric stuff
  async addLights(deviceIds: string[]): Promise<{ errors: any[], successes: any[], singleResult: any }> {
    const response: Response = await this.http.post('lights', { deviceid: deviceIds }).toPromise();
    return this.parseResponse(response);
  }

  async addScene(newScene: IScene): Promise<{ errors: any[], successes: any[], singleResult: any }> {
    this.bunyanLogger.info({ newScene }, 'newScene');
    const response: Response = await this.http.post('scenes', newScene).toPromise();
    return this.parseResponse(response);
  }

  async addGroup(newGroup: IGroup): Promise<{ errors: any[], successes: any[], singleResult: any }> {
    this.bunyanLogger.info({ newGroup }, 'newGroup');
    const response: Response = await this.http.post('groups', newGroup).toPromise();
    return this.parseResponse(response);
  }

  private removeUneditableFields(item: any): any {
    const traversable: any = traverse(item);
    return traversable.map(function (value: any): any {
      if (ObjectUtil.notEmpty(this.key)) {
        if (ItemUtil.uneditableFields.indexOf(this.key) > -1) {
          this.remove();
        }
        if (this.key === 'state') {
          this.remove();
        }
      }
    });
  }
}
