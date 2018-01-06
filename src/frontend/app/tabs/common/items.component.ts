import { Component, ViewChild } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Response } from '@angular/http';
import { ModalDirective } from 'ngx-bootstrap';
import 'rxjs/add/operator/toPromise';
import IItem from '../../../../common/interfaces/IItem';
import IMap from 'common/interfaces/IMap';
import { createLogger } from 'browser-bunyan';
import { ItemService } from 'frontend/app/service/item.service';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export abstract class ItemsComponent<T extends IItem> implements OnInit {
  bunyanLogger: any;
  http: Http;
  JSON: JSON;

  @ViewChild('viewModal') public viewModal: ModalDirective;
  @ViewChild('editModal') public editModal: ModalDirective;
  @ViewChild('editResultModal') public editResultModal: ModalDirective;

  topPad: number = 50;
  itemType: string;
  items: IMap<T>;
  itemIds: string[];
  selectedItemId: string;
  itemIdToView: string;
  itemIdToEdit: string;
  itemToEdit: T;
  itemJsonToEdit: string;
  editResult: string;

  constructor(http: Http, private itemService: ItemService) {
    this.http = http;
    this.JSON = JSON;
    this.bunyanLogger = createLogger({ name: 'App component' });
    this.itemService = itemService;
  }

  ngOnInit(): void {
    this.getItems();

  }

  objectKeys(items: IMap<T>): string[] {
    if (items) {
      return Object.keys(items);
    }
    return [];
  }

  httpGet(uri: string): Promise<Response> {
    return this.http.get(uri).toPromise();
  }

  async getItems(itemParameters?: string): Promise<void> {
    const parameters: string = itemParameters ? itemParameters : '';
    // await this.httpGet(`/${this.itemType}${parameters}`)
    //   .then(response => {
    //     const json: IMap<T> = response.json();
    //     this.itemIds = Object.keys(json);
    //     this.items = json;
    //   });
    const json: IMap<T> = await this.itemService.getItem(this.itemType, parameters);
    if (json) {
      this.itemIds = Object.keys(json);
      this.items = json;
    }
  }

  onEditClicked(itemId: string): void {

  }
  //////////// Old stuff ////////////


  onSelect(itemId: string): Promise<Response> {
    console.log(`${this.constructor.name}: onSelect called with itemId: ${itemId}`);
    this.selectedItemId = itemId;
    return this.httpGet(`/${this.itemType}/${itemId}/select`);
  }

  onView(itemId: string): void {
    console.log(`${this.constructor.name}: onView called with itemId: ${itemId}`);
    this.itemIdToView = itemId;
    this.itemIdToEdit = undefined;
    this.itemJsonToEdit = undefined;
    this.viewModal.show();
  }

  clearView(): void {
    this.viewModal.hide();
    this.itemIdToView = undefined;
  }

  onEdit(itemId: string): void {
    console.log(`${this.constructor.name}: onEdit called with itemId: ${itemId}`);
    this.itemIdToEdit = itemId;
    this.itemIdToView = undefined;
    this.itemToEdit = this.items[itemId];
    this.itemJsonToEdit = this.prettyPrint(this.items[itemId]);
    this.editModal.show();
  }

  async submitJson(): Promise<void> {
    let editedItem: IItem;
    try {
      editedItem = JSON.parse(this.itemJsonToEdit);
    } catch (error) {
      this.editResult = `Unable to parse input JSON: ${this.itemJsonToEdit}`;
      return;
    }
    const response: Response = await this.http.put(`${this.itemType}/${this.itemIdToEdit}`, editedItem).toPromise();
    this.editResult = JSON.parse(response['_body']);
    this.editResultModal.show();
    await this.getItems();
    this.onEdit(this.itemIdToEdit);
  }

  resetEdit(): void {
    this.itemJsonToEdit = this.prettyPrint(this.items[this.itemIdToEdit]);
  }

  cancelEdit(): void {
    this.itemJsonToEdit = undefined;
    this.itemIdToEdit = undefined;
    this.itemToEdit = undefined;
    this.editModal.hide();
  }

  clearEditResult(): void {
    this.editResult = undefined;
    this.editResultModal.hide();
  }

  prettyPrint(jsonItem: any): string {
    return JSON.stringify(jsonItem, null, 4);
  }

  isOn(itemId: string): boolean {
    return true;
  }
}
