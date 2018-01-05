import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ItemsComponent } from '../common/items.component';

import 'rxjs/add/operator/toPromise';
import IRule from '../../../../common/interfaces/IRule';

@Component({
  // moduleId: module.id,
  selector: 'app-rules',
  templateUrl: '../common/items.component.html',
})
export class RulesComponent extends ItemsComponent<IRule> implements OnInit {
  itemType: string = 'rules';

  constructor(http: Http) {
    super(http);
  }
}
