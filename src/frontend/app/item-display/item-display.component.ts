import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { Component, OnInit, Input, TemplateRef, Output, EventEmitter } from '@angular/core';
import { createLogger } from 'browser-bunyan';
import { ItemService } from 'frontend/app/service/item.service';
import * as CircularJSON from 'circular-json';
import IItem from 'common/interfaces/IItem';
import ILight from 'common/interfaces/ILight';
import IMap from 'common/interfaces/IMap';
import ItemUtil from 'common/util/ItemUtil';
import ObjectUtil from 'common/util/ObjectUtil';
import * as _ from 'lodash';

@Component({
  selector: 'app-item-display',
  templateUrl: './item-display.component.html',
  styleUrls: ['./item-display.component.css']
})
export class ItemDisplayComponent implements OnInit {
  submitActionResults: { errors: any[]; successes: any[]; };
  stateBackup: any;
  bunyanLogger: any;
  modalRef: BsModalRef;
  submitStateResults: { errors: any[]; successes: any[]; };
  @Input() itemKey: string;
  @Input() item: any;
  @Output() itemChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() lights: IMap<ILight>;
  @Input() originalItemId: string;
  @Input() itemType: any;
  @Input() allUneditable: any;
  @Output() resetState: EventEmitter<void> = new EventEmitter<void>();
  @Output() resetAction: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private itemService: ItemService,
    private modalService: BsModalService) {
    this.bunyanLogger = createLogger({ name: 'Item Display' });
  }

  ngOnInit(): void {
    if (ObjectUtil.notEmpty(this.itemKey)) {
      if (ItemUtil.uneditableFields.indexOf(this.itemKey) > -1) {
        this.allUneditable = true;
      }
    }
  }

  objectKeys(object: any, itemType?: string, itemKey?: string): string[] {
    return ItemUtil.getItemAttributeList(object, itemType, itemKey);
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
    // this.canEdit(key) &&
    return this.isBoolean(key);
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
    this.itemChange.emit(this.item);
  }

  isLightArray(key: string): boolean {
    if (this.itemKey === 'lights') {
      return Array.isArray(this.item);
    }
    return false;
  }

  isInLightArray(): boolean {
    if (ObjectUtil.notEmpty(this.lights) &&
      ObjectUtil.notEmpty(this.item) &&
      this.itemKey === 'lights') {
      return true;
    }
    return false;
  }

  isState(key: string): boolean {
    if (this.itemKey === 'state') {
      return true;
    }
  }

  removeItem(index: number): void {
    const array: any[] = this.item;
    array.splice(index, 1);
    this.itemChange.emit(this.item);
  }

  addItem(): void {
    const array: any[] = this.item;
    this.item = array.concat([0]);
    this.itemChange.emit(this.item);
  }

  shouldDisplay(key: string): boolean {
    return ObjectUtil.notEmpty(this.item[key]) &&
      !(ItemUtil.fieldsToRedact.indexOf(key.toLowerCase()) > -1);
  }

  canEdit(key: string): boolean {
    return !(ItemUtil.uneditableFields.indexOf(key.toLowerCase()) > -1) && !this.allUneditable;
  }

  lightsReady(): boolean {
    return ObjectUtil.notEmpty(this.lights);
  }

  isEditableField(key: string): boolean {
    const isEditable: boolean = // this.canEdit(key) &&
      this.isStringOrNumber(key) &&
      !this.isBoolean(key) &&
      !this.isAlert(key) &&
      !this.isEffect(key) &&
      !this.isColorMode(key) &&
      !this.isLightArray(key) &&
      !this.isInLightArray();
    return isEditable;
  }

  async onSubmitState(template: TemplateRef<any>): Promise<void> {
    const unstringed: IItem = ItemUtil.stringsToBooleans(this.item);
    const results: { errors: any[], successes: any[] } =
      await this.itemService.putState(this.itemType, unstringed, this.originalItemId);
    this.submitStateResults = results;
    this.openModal(template);
    this.onResetState();
  }

  async onSubmitAction(template: TemplateRef<any>): Promise<void> {
    const unstringed: IItem = ItemUtil.stringsToBooleans(this.item);
    const results: { errors: any[], successes: any[] } =
      await this.itemService.putAction(this.itemType, unstringed, this.originalItemId);
    this.submitActionResults = results;
    this.openModal(template);
    this.onResetState();
  }

  async onResetState(): Promise<void> {
    this.resetState.emit();
  }

  async onResetAction(): Promise<void> {
    this.resetAction.emit();
  }

  openModal(template: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(template);
  }
}
