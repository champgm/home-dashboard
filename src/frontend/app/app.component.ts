import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Tab } from './models/tab.model';

import '../assets/bootstrap.min.css';
import '../assets/bootstrap.override.css';

@Component({
  // moduleId: module.id,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private static lights: Tab = new Tab(1, 'Lights', 'app-lights');
  private static scenes: Tab = new Tab(2, 'Scenes', 'app-scenes').setActive(true);
  private static groups: Tab = new Tab(3, 'Groups', 'app-groups');
  private static schedules: Tab = new Tab(4, 'Schedules', 'app-schedules');
  private static sensors: Tab = new Tab(5, 'Sensors', 'app-sensors');
  private static rules: Tab = new Tab(6, 'Rules', 'app-rules');
  private static plugs: Tab = new Tab(7, 'Plugs', 'app-plugs');
  public selectedTabTitle: string;
  tabs: Tab[];
  title: string = 'home-dashboard';

  constructor(private router: Router) { }

  onSelect(tab: Tab): void {
    this.router.navigate([tab.routing]);
  }

  ngOnInit(): void {
    this.getTabs();
    this.selectedTabTitle = 'Scenes';
    this.router.navigate(['app-scenes']);
  }

  getTabs(): void {
    this.tabs = [
      AppComponent.lights,
      AppComponent.scenes,
      AppComponent.groups,
      AppComponent.schedules,
      AppComponent.sensors,
      AppComponent.rules,
      AppComponent.plugs
    ];
  }
}
