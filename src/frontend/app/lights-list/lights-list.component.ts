import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import ILight from 'common/interfaces/ILight';
import { createLogger } from 'browser-bunyan';
import { Observable } from 'rxjs/Observable';
import { MatOptionSelectionChange } from '@angular/material';

@Component({
  selector: 'app-lights-list',
  templateUrl: './lights-list.component.html',
  styleUrls: ['./lights-list.component.css']
})
export class LightsListComponent implements OnInit { // unsubscribe after destroy
  bunyanLogger: any;

  @Input() lightIdArray: string[] = ['0'];
  @Output() lightIdArrayChange: EventEmitter<string[]> = new EventEmitter();
  @Input() lights: ILight[];
  lightSelectChanges: Observable<MatOptionSelectionChange>;

  constructor() {
    this.bunyanLogger = createLogger({ name: 'Item Display' });
  }

  ngOnInit(): void {
    // if (this.lightSelectChanges) {
    //   this.lightSelectChanges.subscribe(() => {
    //     this.lightIdArrayChange.emit(this.lightIdArray);
    //   });
    // }
  }

  objectKeys(object: any): string[] {
    if (object) {
      return Object.keys(object);
    }
  }

  removeLight(index: number): void {
    if (this.lightIdArray.length < 2) {
      this.lightIdArray = ['0'];
    } else {
      const array: any[] = this.lightIdArray;
      array.splice(index, 1);
      this.lightIdArrayChange.emit(this.lightIdArray);
    }
  }

  addLight(): void {
    if (this.lightIdArray) {
      this.lightIdArray = this.lightIdArray.concat(['0']);
      this.lightIdArrayChange.emit(this.lightIdArray);
      this.bunyanLogger.info({ added: this.lightIdArray }, 'this.lightIdArray');
    }
  }
}
