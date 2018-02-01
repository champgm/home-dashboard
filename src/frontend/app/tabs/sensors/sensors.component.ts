import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ItemsComponent } from '../common/items.component';

import 'rxjs/add/operator/toPromise';
import ISensor from '../../../../common/interfaces/ISensor';
import { ItemService } from 'frontend/app/service/item.service';
import { BsModalService } from 'ngx-bootstrap';

@Component({
  // moduleId: module.id,
  selector: 'sensors',
  templateUrl: '../common/items.component.html',
})
export class SensorsComponent extends ItemsComponent<ISensor> implements OnInit {
  itemType: string = 'sensors';

  constructor(http: Http, itemService: ItemService, private bsModalService: BsModalService) {
    super(itemService, bsModalService);
  }
}
