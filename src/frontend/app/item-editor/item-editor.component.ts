import { ActivatedRoute, Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { Component, OnInit, Input, TemplateRef } from '@angular/core';
import { createLogger } from 'browser-bunyan';
import { ItemService } from 'frontend/app/service/item.service';
import { Location } from '@angular/common';
import * as CircularJSON from 'circular-json';
import * as traverse from 'traverse';
import IItem from 'common/interfaces/IItem';
import ILight from 'common/interfaces/ILight';
import IMap from 'common/interfaces/IMap';
import ItemUtil from 'common/util/ItemUtil';
import ObjectUtil from 'common/util/ObjectUtil';

@Component({
  selector: 'app-item-editor',
  templateUrl: './item-editor.component.html',
  styleUrls: ['./item-editor.component.scss']
})
export class ItemEditorComponent implements OnInit {
  @Input() item: IItem;
  @Input() lights: IMap<ILight>;
  bunyanLogger: any;
  itemId: string;
  itemType: string;
  modalRef: BsModalRef;
  submitResults: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private itemService: ItemService,
    private modalService: BsModalService) {
    this.bunyanLogger = createLogger({ name: 'Item Editor' });
  }

  async ngOnInit(force?: boolean): Promise<void> {
    this.itemType = this.route.snapshot.url[0].path;
    if (!this.item || force) {
      const itemId: string = this.route.snapshot.params['id'];
      this.item = await this.itemService.getItem(this.itemType, itemId);
    }
    if (!this.lights || force) {
      this.lights = await this.itemService.getItem('lights', '');
    }
    console.log(`${CircularJSON.stringify(this.item)}`);
    this.item = CircularJSON.parse(CircularJSON.stringify(this.item));
    this.item = ItemUtil.booleansToStrings(this.item);
    this.itemId = this.item.id;
  }

  async onSubmit(template: TemplateRef<any>): Promise<void> {
    const unstringed: IItem = ItemUtil.stringsToBooleans(this.item);
    const results: { errors: any[], successes: any[] } =
      await this.itemService.putItem(this.itemType, unstringed);
    this.submitResults = results;
    this.openModal(template);
    this.ngOnInit(true);
  }

  async onDelete(template: TemplateRef<any>): Promise<void> {
    this.openModal(template);
  }

  async onDeleteConfirm(template: TemplateRef<any>): Promise<void> {
    // this.modalRef = this.modalService.show(template);
    // const results: { errors: any[], successes: any[] } =
    //   await this.itemService.deleteItem(this.itemType, unstringed);
    // this.submitResults = results;
    // this.openModal(template);
    // this.ngOnInit(true);
  }

  async onReset(): Promise<void> {
    await this.ngOnInit(true);
  }

  async onResetState(): Promise<void> {
    const itemId: string = this.route.snapshot.params['id'];
    const currentItem: IItem = await this.itemService.getItem(this.itemType, itemId);
    this.item.state = CircularJSON.parse(CircularJSON.stringify(currentItem.state));
    this.item = ItemUtil.booleansToStrings(this.item);
  }

  async onResetAction(): Promise<void> {
    const itemId: string = this.route.snapshot.params['id'];
    const currentItem: IItem = await this.itemService.getItem(this.itemType, itemId);
    this.item.action = CircularJSON.parse(CircularJSON.stringify(currentItem.action));
    this.item = ItemUtil.booleansToStrings(this.item);
  }

  onBack(): void {
    this.router.navigate([`/${this.itemType}`]);
  }

  openModal(template: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(template);
  }

  objectKeys(object: any): string[] {
    if (object) {
      return Object.keys(object);
    }
    return [];
  }
}

