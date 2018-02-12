import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LightsListComponent } from './lights-list.component';

describe('LightsListComponent', () => {
  let component: LightsListComponent;
  let fixture: ComponentFixture<LightsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LightsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LightsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
