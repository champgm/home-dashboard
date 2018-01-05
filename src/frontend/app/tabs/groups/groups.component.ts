import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ItemsComponent } from '../common/items.component';
import 'rxjs/add/operator/toPromise';
import IGroup from '../../../../common/interfaces/IGroup';

@Component({
  // moduleId: module.id,
  selector: 'app-groups',
  templateUrl: '../common/items.component.html',
})
export class GroupsComponent extends ItemsComponent<IGroup> implements OnInit {
  itemType: string = 'groups';

  constructor(http: Http) {
    super(http);
  }
}
