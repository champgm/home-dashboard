import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import IItem from 'common/interfaces/IItem';
import { ActivatedRoute, Router } from '@angular/router';
import * as bunyan from 'browser-bunyan';

@Component({
  selector: 'app-editable-item',
  templateUrl: './editable-item.component.html',
  styleUrls: ['./editable-item.component.scss']
})
export class EditableItemComponent implements OnInit {
  bunyanLogger: any;
  @Input() item: IItem;
  @Input() itemType: string;
  @Output() onEditClicked: EventEmitter<string> = new EventEmitter<string>();

  constructor(private router: Router) {
    this.bunyanLogger = bunyan.createLogger({ name: 'Item Display' });
  }

  ngOnInit(): void {
    this.bunyanLogger.info({ item: this.item }, 'item');
  }

  onEdit(): void {
    this.router.navigateByUrl(`/${this.itemType}/${this.item.id}`);
  }

  redact(context: any): any {
    const traversable: any = traverse(context);
    return traversable.map(function(value: any): any {
      if (ObjectUtils.notEmpty(this.key) &&
        CandidateLogger.ForbiddenFields.indexOf(this.key.toLowerCase()) > -1) {
        this.update('[ REDACTED ]');
      }
    });
  }
}
