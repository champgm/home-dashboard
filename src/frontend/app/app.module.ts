
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';

import { TabsModule } from 'ngx-bootstrap/tabs';
import { ButtonsModule } from 'ngx-bootstrap';
import { ModalModule } from 'ngx-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { GroupsComponent } from './tabs/groups/groups.component';
import { LightsComponent } from './tabs/lights/lights.component';
import { PlugsComponent } from './tabs/plugs/plugs.component';
import { RulesComponent } from './tabs/rules/rules.component';
import { ScenesComponent } from './tabs/scenes/scenes.component';
import { SchedulesComponent } from './tabs/schedules/schedules.component';
import { SensorsComponent } from './tabs/sensors/sensors.component';

import { AppComponent } from './app.component';
import { EditableItemComponent } from './editable-item/editable-item.component';
import { ItemEditorComponent } from './item-editor/item-editor.component';
import { ItemService } from 'frontend/app/service/item.service';
import { ItemDisplayComponent } from './item-display/item-display.component';
import { AutoExpandDirective } from './directive/auto-expand.directive';
import { ItemCreatorComponent } from './item-creator/item-creator.component';
import { LightsListComponent } from './lights-list/lights-list.component';
import { ItemsComponent } from './tabs/common/items.component';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpModule,
    FormsModule,
    TabsModule.forRoot(),
    ButtonsModule.forRoot(),
    FlexLayoutModule,
    ModalModule.forRoot(),
    BrowserAnimationsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTabsModule,
    MatInputModule,
    MatSlideToggleModule,
    MatCardModule
  ],
  declarations: [
    AppComponent,
    GroupsComponent,
    LightsComponent,
    PlugsComponent,
    RulesComponent,
    ScenesComponent,
    SchedulesComponent,
    SensorsComponent,
    EditableItemComponent,
    ItemEditorComponent,
    ItemDisplayComponent,
    AutoExpandDirective,
    ItemCreatorComponent,
    LightsListComponent
  ],
  providers: [
    ItemService,
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
