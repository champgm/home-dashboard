import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ItemsComponent } from '../common/items.component';

import 'rxjs/add/operator/toPromise';

@Component({
  // moduleId: module.id,
  selector: 'app-scenes',
  templateUrl: '../common/items.component.html',
})
export class ScenesComponent extends ItemsComponent implements OnInit {
  itemType = 'scenes';
  parameters = `?v2=true&`;

  constructor(http: Http) {
    super(http);
  }

  async getItems() {
    return super.getItems(this.parameters);
  }
}
