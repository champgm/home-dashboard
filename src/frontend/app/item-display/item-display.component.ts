import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { Component, OnInit, Input, TemplateRef } from '@angular/core';
import { createLogger } from 'browser-bunyan';
import { ItemService } from 'frontend/app/service/item.service';
import * as CircularJSON from 'circular-json';
import IItem from 'common/interfaces/IItem';
import ILight from 'common/interfaces/ILight';
import IMap from 'common/interfaces/IMap';
import ItemUtil from 'common/util/ItemUtil';
import ObjectUtil from 'common/util/ObjectUtil';

@Component({
  selector: 'app-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: ['./item-display.component.css']
})
export class ItemDisplayComponent implements OnInit {
  bunyanLogger: any;
  modalRef: BsModalRef;
  submitStateResults: { errors: any[]; successes: any[]; };
  @Input() currentKey: string;
  @Input() parentKey: string;
  @Input() item: any;
  @Input() lights: IMap<ILight>;
  @Input() originalItemId: string;
  @Input() itemType: any;
  @Input() allUneditable: any;

  constructor(
    private itemService: ItemService,
    private modalService: BsModalService) {
    this.bunyanLogger = createLogger({ name: 'Item Display' });
  }

  ngOnInit(): void {
    if (ObjectUtil.notEmpty(this.currentKey)) {
      if (ItemUtil.uneditableFields.indexOf(this.currentKey) > -1) {
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

  isStringOrNumber(key: string): boolean {
    return (typeof this.item[key] === 'string') ||
      (typeof this.item[key] === 'number');
  }

  isBoolean(key: any): boolean {
    return this.item[key] === 'true' ||
      this.item[key] === 'false';
  }

  isBooleanToggle(key: any): boolean {
    return this.canEdit(key) &&
      this.isBoolean(key);
  }

  isAlert(key: any): boolean {
    return (key === 'alert');
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
  }

  isLightArray(key: string): boolean {
    // this.bunyanLogger.info({ parentKey: this.parentKey, key: this.currentKey, item: this.item }, 'Light Array?');
    if (key === 'lights') {
      return Array.isArray(this.item[key]);
    }
    return false;
  }

  isInLightArray(parentKey: string): boolean {
    // this.bunyanLogger.info({ parentKey: parentKey, key: this.currentKey, item: this.item }, 'Light Array Item?');
    if (parentKey === 'lights') {
      return true;
    }
    return false;
  }

  isState(key: string): boolean {
    if (this.currentKey === 'state') {
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
    const isEditable: boolean = this.canEdit(key) &&
      this.isStringOrNumber(key) &&
      !this.isBoolean(key) &&
      !this.isAlert(key) &&
      !this.isEffect(key) &&
      !this.isColorMode(key) &&
      !this.isLightArray(key) &&
      !this.isInLightArray(this.parentKey);
    if (isEditable) {
      this.bunyanLogger.info({ key, parentKey: this.parentKey, currentKey: this.currentKey, item: this.item[key] }, 'EDITABLE');
    }
    return isEditable;
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
