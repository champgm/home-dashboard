import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import IItem from 'common/interfaces/IItem';
import { ActivatedRoute } from '@angular/router';
import { ItemService } from 'frontend/app/service/item.service';
import * as CircularJSON from 'circular-json';

@Component({
  selector: 'app-item-editor',
  templateUrl: './item-editor.component.html',
  styleUrls: ['./item-editor.component.css']
})
export class ItemEditorComponent implements OnInit {
  @Input() item: IItem;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private itemService: ItemService) { }

  async ngOnInit(): Promise<void> {
    if (!this.item) {
      // this.getItem();
      // console.log(`${this.route.snapshot.toString()}`);
      const itemType: string = this.route.snapshot.url[0].path;
      const itemId: string = this.route.snapshot.params['id'];
      // console.log(`${CircularJSON.stringify(this.route.snapshot, null, 2)}`);
      this.item = await this.itemService.getItem(itemType, itemId);
    }
    console.log(`${CircularJSON.stringify(this.item)}`);
    this.item = CircularJSON.parse(CircularJSON.stringify(this.item));

  }

  objectKeys(): string[] {
    if (this.item) {
      return Object.keys(this.item);
    }
    return [];
  }

  isStringOrNumber(variable: any): boolean {
    return (typeof variable === 'string') || (typeof variable === 'number');
  }

}

