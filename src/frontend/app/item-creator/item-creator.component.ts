import { Component, OnInit, Input, Output } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
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

  constructor(private itemService: ItemService) {
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

  async onAddSubmit(): Promise<void> {
    switch (this.itemType) {
      case 'lights':
        try {
          const deviceIdArray: string[] = this.newThing.split(',').map((id) => id.trim());
          const lightResponse: { errors: any[], successes: any[], singleResult: any } =
            await this.itemService.addLights(deviceIdArray);
        } catch (error) {
          // do something here if string parsing had an error or something
        }
        break;
      case 'scenes':
        const sceneResponse: { errors: any[], successes: any[], singleResult: any } =
          await this.itemService.addScene(this.newThing);
        if (ObjectUtil.isEmpty(sceneResponse.errors)) {

        }
        break;
      default:
        break;
    }
  }

  toggle(key: string): void {
    if (this.newThing[key] === 'true') {
      this.newThing[key] = 'false';
    } else if (this.newThing[key] === 'false') {
      this.newThing[key] = 'true';
    }
  }
}
