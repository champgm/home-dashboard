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
  @Input() allUneditable: any;
  @Input() item: any;
  @Input() itemKey: string;
  @Input() itemType: any;
  @Input() lights: IMap<ILight>;
  @Input() originalItemId: string;
  @Output() itemChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() resetAction: EventEmitter<void> = new EventEmitter<void>();
  @Output() resetState: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private itemService: ItemService,
    private modalService: BsModalService) {
    this.bunyanLogger = createLogger({ name: 'Item Display' });
  }

  ngOnInit(): void {
    if (ObjectUtil.notEmpty(this.itemKey)) {
      if (ItemUtil.getUneditableFields(this.itemType).indexOf(this.itemKey) > -1) {
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
    return (typeof this.item[key] === 'boolean');
  }

  isAlert(key: any): boolean {
    return (key === 'alert');
  }

  isStatus(key: any): boolean {
    return (key === 'status');
  }

  isEffect(key: any): boolean {
    return key === 'effect';
  }

  isGroupClass(key: any): boolean {
    return key === 'class';
  }

  isColorMode(key: any): boolean {
    return key === 'colormode';
  }

  isMethod(key: any): boolean {
    return key === 'method';
  }

  isOperator(key: any): boolean {
    return key === 'operator';
  }

  toggle(key: string): void {
    console.log(`TOGGLE: ${key}`);
    console.log(`NOW: ${this.item[key]} & ${typeof this.item[key]}`);

    if (this.item[key] === true) {
      this.item[key] = false;
    } else if (this.item[key] === false) {
      this.item[key] = true;
    }
    console.log(`TOGGLED: ${this.item[key]} & ${typeof this.item[key]}`);
    this.onItemChange();
  }

  onItemChange(): void {
    this.itemChange.emit(this.item);
  }

  isLightArray(): boolean {
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

  isState(): boolean {
    if (this.itemKey === 'state') {
      return true;
    }
  }

  shouldDisplay(key: string): boolean {
    // if (ObjectUtil.isNull(this.item[key])) {
    //   this.item[key] = 'undefined';
    // }
    return (typeof this.item[key] === 'boolean') ||
      !(ItemUtil.fieldsToRedact.indexOf(key.toLowerCase()) > -1);
  }

  canEdit(key: string): boolean {
    return !(ItemUtil.getUneditableFields(this.itemType).indexOf(key.toLowerCase()) > -1) &&
      !this.allUneditable;
  }

  lightsReady(): boolean {
    return ObjectUtil.notEmpty(this.lights);
  }

  isEditableField(key: string): boolean {
    const isEditable: boolean = // this.canEdit(key) &&
      this.isStringOrNumber(key) &&
      !this.isBoolean(key) &&
      !this.isAlert(key) &&
      !this.isStatus(key) &&
      !this.isMethod(key) &&
      !this.isOperator(key) &&
      !this.isEffect(key) &&
      !this.isColorMode(key) &&
      !this.isLightArray() &&
      !this.isGroupClass(key) &&
      !this.isInLightArray();
    return isEditable;
  }

  async onSubmitState(template: TemplateRef<any>): Promise<void> {
    const results: { errors: any[], successes: any[] } =
      await this.itemService.putState(this.itemType, this.item, this.originalItemId);
    this.submitStateResults = results;
    this.openModal(template);
    this.onResetState();
  }

  async onSubmitAction(template: TemplateRef<any>): Promise<void> {
    const results: { errors: any[], successes: any[] } =
      await this.itemService.putAction(this.itemType, this.item, this.originalItemId);
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
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
  }
}
