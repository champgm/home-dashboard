import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ItemsComponent } from '../common/items.component';
import 'rxjs/add/operator/toPromise';
import IGroup from '../../../../common/interfaces/IGroup';
import { ItemService } from 'frontend/app/service/item.service';
import { BsModalService } from 'ngx-bootstrap';

@Component({
  // moduleId: module.id,
  selector: 'groups',
  templateUrl: '../common/items.component.html',
})
export class GroupsComponent extends ItemsComponent<IGroup> implements OnInit {
  itemType: string = 'groups';

  constructor(http: Http, itemService: ItemService, private bsModalService: BsModalService) {
    super(itemService, bsModalService);
  }
}
