import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { Component, OnInit, Input, TemplateRef } from '@angular/core';
import { ItemService } from 'frontend/app/service/item.service';
import * as bunyan from 'browser-bunyan';
import * as CircularJSON from 'circular-json';
import IItem from 'common/interfaces/IItem';
import ItemUtil from 'common/util/ItemUtil';
import ObjectUtil from 'common/util/ObjectUtil';



const bunyanLogger: any = bunyan.createLogger({ name: 'Editable Item' });

@Component({
  selector: 'app-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: ['./item-display.component.css']
})
export class ItemDisplayComponent implements OnInit {
  modalRef: BsModalRef;
  submitStateResults: { errors: any[]; successes: any[]; };
  @Input() key: string;
  @Input() item: any;
  @Input() originalItemId: string;
  @Input() itemType: any;
  @Input() allUneditable: any;

  constructor(
    private itemService: ItemService,
    private modalService: BsModalService) { }

  ngOnInit(): void {
    if (ObjectUtil.notEmpty(this.key)) {
      if (ItemUtil.uneditableFields.indexOf(this.key) > -1) {
        this.allUneditable = true;
      }
    }
  }

  objectKeys(object: any): string[] {
    if (object) {
      return Object.keys(object);
    }
    return [];
  }

  isStringOrNumber(variable: any): boolean {
    return (typeof variable === 'string') ||
      (typeof variable === 'number');
  }

  isBoolean(variable: any): boolean {
    return variable === 'true' ||
      variable === 'false';
  }

  isBooleanToggle(key: any): boolean {
    return this.canEdit(key) &&
      this.isBoolean(this.item[key]);
  }

  isAlert(key: any): boolean {
    return key === 'alert';
  }

  isEffect(key: any): boolean {
    return key === 'effect';
  }

  isColorMode(key: any): boolean {
    return key === 'colormode';
  }

  toggle(key: string): void {
    if (this.item[key] === 'true') {
      this.item[key] = 'false';
    } else if (this.item[key] === 'false') {
      this.item[key] = 'true';
    }
    console.log(`OKAY: ${this.item[key]}`);
  }

  isEditableArray(item: any): boolean {
    if (this.key === 'lights') {
      return Array.isArray(item);
    }
  }

  isState(key: string): boolean {
    if (this.key === 'state') {
      return true;
    }
  }

  removeItem(index: number): void {
    const array: any[] = this.item;
    array.splice(index, 1);
  }

  addItem(): void {
    const array: any[] = this.item;
    this.item = array.concat([0]);
  }

  shouldDisplay(key: string): boolean {
    return !(ItemUtil.fieldsToRedact.indexOf(key.toLowerCase()) > -1);
  }

  canEdit(key: string): boolean {
    return !(ItemUtil.uneditableFields.indexOf(key.toLowerCase()) > -1) && !this.allUneditable;
  }

  isEditableField(key: string): boolean {
    return this.canEdit(key) &&
      this.isStringOrNumber(this.item[key]) &&
      !this.isBoolean(this.item[key]) &&
      !this.isAlert(key) &&
      !this.isEffect(key) &&
      !this.isColorMode(key);
  }

  async onSubmitState(template: TemplateRef<any>): Promise<void> {
    const unstringed: IItem = ItemUtil.stringsToBooleans(this.item);
    // unstringed.id = this.originalItemId;
    const results: { errors: any[], successes: any[] } =
      await this.itemService.putState(this.itemType, unstringed, this.originalItemId);
    this.submitStateResults = results;
    this.openModal(template);
  }

  openModal(template: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(template);
  }
}
