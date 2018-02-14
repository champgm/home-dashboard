import { Component, OnInit, Input, Output, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { ItemService } from 'frontend/app/service/item.service';
import IMap from 'common/interfaces/IMap';
import ILight from 'common/interfaces/ILight';
import { createLogger } from 'browser-bunyan';
import ObjectUtil from 'common/util/ObjectUtil';
import IScene from 'common/interfaces/IScene';
import * as CircularJSON from 'circular-json';
import ItemUtil from 'common/util/ItemUtil';

@Component({
  selector: 'app-item-creator',
  templateUrl: './item-creator.component.html',
  styleUrls: ['./item-creator.component.css']
})
export class ItemCreatorComponent implements OnInit {
  @Input() itemType: string;
  @Input() modalReference: BsModalRef;
  @Output() addDone: boolean;
  bunyanLogger: any;
  lights: IMap<ILight>;
  newThing: any;
  submitResultModalReference: BsModalRef;
  response: { errors: any[], successes: any[], singleResult: any };

  constructor(
    private itemService: ItemService,
    private modalService: BsModalService) {
    this.bunyanLogger = createLogger({ name: 'Item Creator' });
  }

  async ngOnInit(): Promise<void> {
    if (ObjectUtil.isEmpty(this.newThing)) {
      this.newThing = // ItemUtil.booleansToStrings(
        this.itemService.getEmptyItem(this.itemType); // );
    }
    if (!this.lights) {
      this.lights = await this.itemService.getItem('lights', '');
    }
  }

  onCancel(): void {
    this.newThing = // ItemUtil.booleansToStrings(
      this.itemService.getEmptyItem(this.itemType); // );
    this.modalReference.hide();
  }

  async onAddSubmit(template: TemplateRef<any>): Promise<void> {
    switch (this.itemType) {
      case 'lights':
        const deviceIdArray: string[] = this.newThing.split(',').map((id) => id.trim());
        this.response = await this.itemService.addLights(deviceIdArray);
        break;
      case 'scenes':
        this.response = await this.itemService.addScene(this.newThing);
        break;
      case 'groups':
        this.response = await this.itemService.addGroup(this.newThing);
        break;
      default:
        break;
    }
    this.bunyanLogger.info({ response: this.response }, 'response');
    if (this.modalReference) {
      this.modalReference.hide();
    }
    this.openModal(template);
  }

  toggle(key: string): void {
    if (this.newThing[key] === 'true') {
      this.newThing[key] = 'false';
    } else if (this.newThing[key] === 'false') {
      this.newThing[key] = 'true';
    }
  }

  openModal(template: TemplateRef<any>): void {
    this.submitResultModalReference = this.modalService.show(template);
  }

  objectKeys(object: any): string[] {
    if (object) {
      return Object.keys(object);
    }
    return [];
  }
}
