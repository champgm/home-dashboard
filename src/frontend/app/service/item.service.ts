import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import IMap from 'common/interfaces/IMap';
import IItem from 'common/interfaces/IItem';

@Injectable()
export class ItemService {

  constructor(private http: Http) { }

  async httpGet(uri: string): Promise<any> {
    return this.http.get(uri).toPromise();
  }

  async getItem(itemType: string, parameters: string): Promise<any> {
    const items: IMap<IItem> = await this.httpGet(`/${itemType}/${parameters}`)
      .then(response => {
        const json: IMap<IItem> = response.json();
        return json;
      });
    return items;
  }
}
