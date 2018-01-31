import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ItemsComponent } from '../common/items.component';

import 'rxjs/add/operator/toPromise';
import IPlug from '../../../../common/interfaces/IPlug';
import { ItemService } from 'frontend/app/service/item.service';

@Component({
  // moduleId: module.id,
  selector: 'plugs',
  templateUrl: '../common/items.component.html',
})
export class PlugsComponent extends ItemsComponent<IPlug> implements OnInit {
  itemType: string = 'plugs';

  constructor(http: Http, itemService: ItemService) {
    super( itemService);
  }
}
