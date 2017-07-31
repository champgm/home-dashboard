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

const angular = 'angular/';
const routes: Routes = [
  {
    path: 'app-groups',
    component: GroupsComponent
  },
  {
    path: 'app-lights',
    component: LightsComponent
  },
  {
    path: 'app-plugs',
    component: PlugsComponent
  },
  {
    path: 'app-scenes',
    component: ScenesComponent
  },
  {
    path: 'app-schedules',
    component: SchedulesComponent
  },
  {
    path: 'app-sensors',
    component: SensorsComponent
  },
  {
    path: 'app-rules',
    component: RulesComponent
  },
  {
    path: 'app-app',
    component: AppComponent
  },
  // {
  //   path: 'app-edit/:itemId',
  //   component: HeroDetailComponent
  // },
  {
    path: 'app-',
    redirectTo: '/scenes',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
