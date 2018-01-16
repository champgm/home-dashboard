import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ItemsComponent } from '../common/items.component';

import 'rxjs/add/operator/toPromise';
import IScene from '../../../../common/interfaces/IScene';
import { ItemService } from 'frontend/app/service/item.service';

@Component({
  // moduleId: module.id,
  selector: 'scenes',
  templateUrl: '../common/items.component.html',
})
export class ScenesComponent extends ItemsComponent<IScene> implements OnInit {
  itemType: string = 'scenes';
  parameters: string = `?v2=true&`;

  constructor(http: Http, itemService: ItemService) {
    super( itemService);
  }

  async getItems(): Promise<void> {
    return super.getItems(this.parameters);
  }
}
