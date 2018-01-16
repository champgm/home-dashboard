import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Response } from '@angular/http';
import { ModalDirective } from 'ngx-bootstrap';
import 'rxjs/add/operator/toPromise';
import IItem from '../../../../common/interfaces/IItem';
import IMap from 'common/interfaces/IMap';
import { createLogger } from 'browser-bunyan';
import { ItemService } from 'frontend/app/service/item.service';
import ObjectUtil from 'common/util/ObjectUtil';
import ItemUtil from 'common/util/ItemUtil';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export abstract class ItemsComponent<T extends IItem> implements OnInit {
  selectedStates: any = {};
  bunyanLogger: any;
  itemType: string;
  items: IMap<T>;
  itemIds: string[];

  constructor(private itemService: ItemService) {
    this.bunyanLogger = createLogger({ name: 'Items component' });
    this.itemService = itemService;
  }

  ngOnInit(): void {
    this.getItems();
  }

  objectKeys(items: IMap<T>): string[] {
    return ItemUtil.getKeysSortedByName(items);
  }

  async getItems(itemParameters?: string): Promise<void> {
    const parameters: string = itemParameters ? itemParameters : '';
    const json: IMap<T> = await this.itemService.getItem(this.itemType, parameters);
    if (json) {
      this.items = json;
    }
  }
}
