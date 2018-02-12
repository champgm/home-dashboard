import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Response } from '@angular/http';
import { ItemsComponent } from '../common/items.component';

import 'rxjs/add/operator/toPromise';
import ILight from '../../../../common/interfaces/ILight';
import { ItemService } from 'frontend/app/service/item.service';
import { BsModalService } from 'ngx-bootstrap';

@Component({
  // moduleId: module.id,
  selector: 'lights',
  templateUrl: '../common/items.component.html',
})
export class LightsComponent extends ItemsComponent<ILight> implements OnInit {
  itemType: string = 'lights';

  constructor(http: Http, itemService: ItemService, private bsModalService: BsModalService) {
    super(itemService, bsModalService);
  }

  isSelected(itemId: string): boolean {
    const item: ILight = this.items[itemId];
    if (!item || !item.state) {
      return false;
    }
    return item.state.on;
  }

  canAdd(): boolean {
    return true;
  }
}
