import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-item-creator',
  templateUrl: './item-creator.component.html',
  styleUrls: ['./item-creator.component.css']
})
export class ItemCreatorComponent implements OnInit {

  @Input() itemType: string;
  specificDeviceIds: string = '';

  constructor() { }

  ngOnInit(): void {
    console.log(`itemType: ${this.itemType}`);
  }

}
