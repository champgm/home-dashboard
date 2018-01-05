import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ItemsComponent } from '../common/items.component';

import 'rxjs/add/operator/toPromise';
import IPlug from '../../../../common/interfaces/IPlug';

@Component({
  // moduleId: module.id,
  selector: 'app-plugs',
  templateUrl: '../common/items.component.html',
})
export class PlugsComponent extends ItemsComponent<IPlug> implements OnInit {
  itemType: string = 'plugs';

  constructor(http: Http) {
    super(http);
  }
}
