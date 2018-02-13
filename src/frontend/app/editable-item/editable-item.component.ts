import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { Location } from '@angular/common';
import * as bunyan from 'browser-bunyan';
import * as traverse from 'traverse';
import IItem from 'common/interfaces/IItem';
import ItemUtil from 'common/util/ItemUtil';
import ObjectUtil from 'common/util/ObjectUtil';
import { ItemService } from 'frontend/app/service/item.service';
import { Response } from '@angular/http';
import ILight from 'common/interfaces/ILight';
import IMap from 'common/interfaces/IMap';

@Component({
  selector: 'app-editable-item',
  templateUrl: './editable-item.component.html',
  styleUrls: ['./editable-item.component.scss']
})
export class EditableItemComponent implements OnInit {
  bunyanLogger: any;
  @Input() item: IItem;
  // @Input() itemKey: string;
  @Input() itemType: string;
  @Input() isSelected: boolean;

  constructor(
    private router: Router,
    private itemService: ItemService) {
    this.bunyanLogger = bunyan.createLogger({ name: 'Editable Item' });
  }

  ngOnInit(): void {
    this.item = this.redact(this.item);
    this.isSelected = ItemUtil.isSelected(this.item, this.itemType);
  }

  onEdit(): void {
    this.router.navigateByUrl(`/${this.itemType}/${this.item.id}`);
  }

  async onSelect(): Promise<Response> {
    this.bunyanLogger.info({ item: this.item }, 'Selecting Item');
    const selectResponse: Response = await this.itemService.selectItem(this.itemType, this.item.id);
    this.item = await this.itemService.getItem(this.itemType, this.item.id);
    this.isSelected = ItemUtil.isSelected(this.item, this.itemType);
    return selectResponse;
  }


  redact(item: any): any {
    const traversable: any = traverse(item);
    return traversable.map(function (value: any): any {
      if (ObjectUtil.notEmpty(this.key) &&
        ItemUtil.fieldsToRedact.indexOf(this.key.toLowerCase()) > -1) {
        this.update(undefined);
      }
    });
  }
}
