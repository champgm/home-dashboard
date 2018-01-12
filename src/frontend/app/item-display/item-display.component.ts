import { Component, OnInit, Input } from '@angular/core';
import IItem from 'common/interfaces/IItem';
import * as CircularJSON from 'circular-json';
import ItemUtil from 'common/util/ItemUtil';

@Component({
  selector: 'app-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: ['./item-display.component.css']
})
export class ItemDisplayComponent implements OnInit {
  @Input() item: IItem;
  size: any = {};
  constructor() { }

  ngOnInit(): void {
    if (this.item) {
      Object.keys(this.item).forEach((key) => {
        this.size[key] = 10;
      });
    }
  }

  objectKeys(): string[] {
    if (this.item) {
      return Object.keys(this.item);
    }
    return [];
  }

  isStringOrNumber(variable: any): boolean {
    // console.log(`Checking ${CircularJSON.stringify(variable)}`);
    // console.log(`Typeof ${typeof variable}`);
    return (typeof variable === 'string') ||
      (typeof variable === 'number') ||
      (typeof variable === 'boolean');
  }

  shouldDisplay(key: string): boolean {
    return !(ItemUtil.getFieldsToRedact().indexOf(key.toLowerCase()) > -1);
  }

  canEdit(key: string): boolean {
    return !(ItemUtil.getUneditableFields().indexOf(key.toLowerCase()) > -1);
  }

  updateSize(event: any): void {
    // this.size[key] = this.item[key].length + 2;
    console.log(`${JSON.stringify(event)}`);
  }

  getSize(event: any): void {
    // if (this.item[key] && this.item[key].length) {
    //   return this.item[key].length + 2;
    // }
    // return 10;
    JSON.stringify(event);
  }

}
