import { Component, OnInit, Input } from '@angular/core';
import IItem from 'common/interfaces/IItem';
import * as CircularJSON from 'circular-json';

@Component({
  selector: 'app-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: ['./item-display.component.css']
})
export class ItemDisplayComponent implements OnInit {
  @Input() item: IItem;

  constructor() { }

  ngOnInit(): void { }

  objectKeys(): string[] {
    if (this.item) {
      return Object.keys(this.item);
    }
  }

  isStringOrNumber(variable: any): boolean {
    // console.log(`Checking ${CircularJSON.stringify(variable)}`);
    // console.log(`Typeof ${typeof variable}`);
    return (typeof variable === 'string') ||
      (typeof variable === 'number') ||
      (typeof variable === 'boolean');
  }

  toString(variable: any): string {
    return variable.toString();
  }

}
