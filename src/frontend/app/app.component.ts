import { Component, ViewChild } from '@angular/core';
import { TabsetComponent, TabsetConfig } from 'ngx-bootstrap';
import { OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
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

  tabs: Tab[];
  title: string = 'home-dashboard';
  bunyanLogger: any;

  @ViewChild('tabSet') tabSet: TabsetComponent;

  constructor(private router: Router) {
    this.bunyanLogger = createLogger({ name: 'App component' });
  }

  onSelect(tab: Tab): void {
    // console.log(`this.router.url: ${this.router.url}`);
    this.bunyanLogger.info({ tab }, 'tab selected');
    this.router.navigate([tab.routing]);
  }

  ngOnInit(): void {
    const scenes: Tab = new Tab(0, 'Scenes', 'scenes', true);
    const lights: Tab = new Tab(1, 'Lights', 'lights', false);
    const groups: Tab = new Tab(2, 'Groups', 'groups', false);
    const schedules: Tab = new Tab(3, 'Schedules', 'schedules', false);
    const sensors: Tab = new Tab(4, 'Sensors', 'sensors', false);
    const rules: Tab = new Tab(5, 'Rules', 'rules', false);
    const plugs: Tab = new Tab(6, 'Plugs', 'plugs', false);

    const checkTabs: Tab[] = [
      scenes,
      lights,
      groups,
      schedules,
      sensors,
      rules,
      plugs
    ];

    this.tabs = [
      scenes,
      lights,
      groups,
      schedules,
      sensors,
      rules,
      plugs
    ];
  }
}
