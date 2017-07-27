import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ItemsComponent } from '../common/items.component';

import 'rxjs/add/operator/toPromise';

@Component({
  // moduleId: module.id,
  selector: 'rules',
  templateUrl: '../common/items.component.html',
})
export class RulesComponent extends ItemsComponent implements OnInit {
  itemType: string = 'rules';

  constructor(http: Http) {
    super(http);
  }
}
