import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ItemsComponent } from '../common/items.component';

import 'rxjs/add/operator/toPromise';

@Component({
  // moduleId: module.id,
  selector: 'app-lights',
  templateUrl: '../common/items.component.html',
})
export class LightsComponent extends ItemsComponent implements OnInit {
  itemType = 'lights';

  constructor(http: Http) {
    super(http);
  }

  onSelect(itemId: string) {
    const result = super.onSelect(itemId);
    result
      .then(response => {
        const json = response.json();
        this.items[itemId] = json;
      });
    return result;
  }

  isOn(itemId: string): boolean {
    const item = this.items[itemId];
    if (!item || !item.state) {
      return false;
    }
    return item.state.on;
  }
}
