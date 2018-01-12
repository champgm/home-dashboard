import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupsComponent } from './tabs/groups/groups.component';
import { PlugsComponent } from './tabs/plugs/plugs.component';
import { SchedulesComponent } from './tabs/schedules/schedules.component';
import { RulesComponent } from './tabs/rules/rules.component';
import { SensorsComponent } from './tabs/sensors/sensors.component';
import { ScenesComponent } from './tabs/scenes/scenes.component';
import { LightsComponent } from './tabs/lights/lights.component';
import { AppComponent } from './app.component';
import { ItemEditorComponent } from 'frontend/app/item-editor/item-editor.component';

const angular: string = 'angular/';

// http://localhost:1981/#/scenes/ERgF0PTi-61fWYb

const routes: Routes = [
  { path: 'groups/:id', component: ItemEditorComponent },
  { path: 'lights/:id', component: ItemEditorComponent },
  { path: 'plugs/:id', component: ItemEditorComponent },
  { path: 'rules/:id', component: ItemEditorComponent },
  { path: 'scenes/:id', component: ItemEditorComponent },
  { path: 'schedules/:id', component: ItemEditorComponent },
  { path: 'sensors/:id', component: ItemEditorComponent },
  { path: 'groups', component: GroupsComponent },
  { path: 'lights', component: LightsComponent },
  { path: 'plugs', component: PlugsComponent },
  { path: 'rules', component: RulesComponent },
  { path: 'scenes', component: ScenesComponent },
  { path: 'schedules', component: SchedulesComponent },
  { path: 'sensors', component: SensorsComponent },
  { path: 'app', component: AppComponent },
  { path: '', redirectTo: 'scenes', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
