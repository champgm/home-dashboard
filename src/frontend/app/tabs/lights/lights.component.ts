import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Response } from '@angular/http';
import { ItemsComponent } from '../common/items.component';

import 'rxjs/add/operator/toPromise';
import ILight from '../../../../common/interfaces/ILight';

@Component({
  // moduleId: module.id,
  selector: 'app-lights',
  templateUrl: '../common/items.component.html',
})
export class LightsComponent extends ItemsComponent<ILight> implements OnInit {
  itemType: string = 'lights';

  constructor(http: Http) {
    super(http);
  }

  onSelect(itemId: string): Promise<Response> {
    const result: Promise<Response> = super.onSelect(itemId);
    result
      .then(response => {
        const json: ILight = response.json();
        this.items[itemId] = json;
      });
    return result;
  }

  isOn(itemId: string): boolean {
    const item: ILight = this.items[itemId];
    if (!item || !item.state) {
      return false;
    }
    return item.state.on;
  }
}
