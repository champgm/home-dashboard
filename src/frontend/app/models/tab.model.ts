export class Tab {
  private active: boolean = false;

  constructor(
    public id: number = -1,
    public title?: string,
    public routing?: string,
    public shouldBeSelected?: boolean) {
  }

  setActive(active: boolean): Tab {
    this.active = active;
    this.shouldBeSelected = true;
    return this;
  }

  isActive(): boolean {
    return this.active;
  }
}
