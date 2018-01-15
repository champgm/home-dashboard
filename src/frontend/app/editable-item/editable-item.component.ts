import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import * as bunyan from 'browser-bunyan';
import * as traverse from 'traverse';
import IItem from 'common/interfaces/IItem';
import ItemUtil from 'common/util/ItemUtil';
import ObjectUtil from 'common/util/ObjectUtil';
import { ItemService } from 'frontend/app/service/item.service';
import { Response } from '@angular/http';

@Component({
  selector: 'app-editable-item',
  templateUrl: './editable-item.component.html',
  styleUrls: ['./editable-item.component.scss']
})
export class EditableItemComponent implements OnInit {
  bunyanLogger: any;
  @Input() item: IItem;
  @Input() itemType: string;
  // @Output() onEditClicked: EventEmitter<string> = new EventEmitter<string>();
  // @Output() onSelectClicked: EventEmitter<string> = new EventEmitter<string>();

  constructor(private router: Router, private itemService: ItemService) {
    this.bunyanLogger = bunyan.createLogger({ name: 'Editable Item' });
  }

  ngOnInit(): void {
    this.item = this.redact(this.item);
  }

  onEdit(): void {
    this.router.navigateByUrl(`/${this.itemType}/${this.item.id}`);
  }

  async onSelect(): Promise<Response> {
    return this.itemService.selectItem(this.itemType, this.item.id);
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
