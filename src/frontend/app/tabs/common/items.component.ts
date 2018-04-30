import { Component, ViewChild, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Response } from '@angular/http';
import { ModalDirective, BsModalService, BsModalRef } from 'ngx-bootstrap';
import 'rxjs/add/operator/toPromise';
import IItem from '../../../../common/interfaces/IItem';
import IMap from 'common/interfaces/IMap';
import { createLogger } from 'browser-bunyan';
import { ItemService } from 'frontend/app/service/item.service';
import ObjectUtil from 'common/util/ObjectUtil';
import ItemUtil from 'common/util/ItemUtil';

// @Component({
//   selector: 'app-items',
//   templateUrl: './items.component.html',
//   styleUrls: ['./items.component.scss']
// })
export abstract class ItemsComponent<T extends IItem> implements OnInit {
  addModalRef: BsModalRef;
  bunyanLogger: any;
  itemIds: string[];
  items: IMap<T>;
  itemType: string;
  selectedStates: any = {};

  constructor(private itemService: ItemService, private modalService: BsModalService) {
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

  canAdd(): boolean {
    return false;
  }

  onAdd(template: TemplateRef<any>): void {
    this.addModalRef = this.modalService.show(template);
  }

  addDone(event: any): void {
    this.addModalRef.hide();
    this.getItems();
  }
}
