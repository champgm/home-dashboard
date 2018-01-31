import { Directive, HostBinding, HostListener } from '@angular/core';

@Directive({
  selector: '[appAutoExpand]'
})
export class AutoExpandDirective {

  constructor() { }

  // @HostBinding('style.width.px')
  // width: number = 20;

  // @HostBinding('value')
  value: string;

  @HostBinding('size')
  size: number = 10;

  @HostListener('keydown')
  onKeydown(): void {
    this.size = this.value.length + 2;
  }

  // @HostListener('blur')
  // onBlur(): void {
  //   this.width = 120;
  // }

}
