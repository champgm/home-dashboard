import { Component, ViewChild } from '@angular/core';
import { TabsetComponent } from 'ngx-bootstrap';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Tab } from './models/tab.model';
import { createLogger } from 'browser-bunyan';

import '../assets/bootstrap.min.css';
import '../assets/bootstrap.override.css';

@Component({
  // moduleId: module.id,
  selector: 'root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private static lights: Tab = new Tab(0, 'Lights', 'lights');
  private static scenes: Tab = new Tab(1, 'Scenes', 'scenes').setActive(true);
  private static groups: Tab = new Tab(2, 'Groups', 'groups');
  private static schedules: Tab = new Tab(3, 'Schedules', 'schedules');
  private static sensors: Tab = new Tab(4, 'Sensors', 'sensors');
  private static rules: Tab = new Tab(5, 'Rules', 'rules');
  private static plugs: Tab = new Tab(6, 'Plugs', 'plugs');
  tabs: Tab[];
  title: string = 'home-dashboard';
  bunyanLogger: any;

  @ViewChild('tabSet') tabSet: TabsetComponent;

  constructor(private router: Router) {
    this.bunyanLogger = createLogger({ name: 'App component' });
  }

  onSelect(tab: Tab): void {
    this.bunyanLogger.info({ tab }, 'tab selected');
    // this.tabSet.tabs[tab.id].active = true;
    this.router.navigate([tab.routing]);
  }

  onDeselect(tab: Tab): void {
    // this.bunyanLogger.info({ tabs: this.tabSet.tabs }, 'deselct tabSet');
    // this.tabSet.tabs[tab.id].active = false;
    // this.router.navigate([tab.routing]);
  }

  ngOnInit(): void {
    this.getTabs();
    this.bunyanLogger.info({ tabs: this.tabSet.tabs }, 'init tabSet');
    // this.tabSet.tabs[AppComponent.scenes.id].active = true;
    this.router.navigate(['scenes']);
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
