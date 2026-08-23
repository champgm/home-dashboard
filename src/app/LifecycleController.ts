import { AppState, AppStateStatus } from "react-native";
import { ApplicationService } from "./ApplicationService";
import { RefreshScheduler, MonotonicClock } from "./refreshScheduler";

export interface LifecycleControllerOptions {
  readonly clock?: MonotonicClock;
  readonly appState?: Pick<typeof AppState, "addEventListener" | "currentState">;
}

export class LifecycleController {
  private readonly service: ApplicationService;
  private readonly scheduler: RefreshScheduler;
  private readonly appState: Pick<typeof AppState, "addEventListener" | "currentState">;
  private subscription?: { remove(): void };
  private started = false;

  constructor(service: ApplicationService, options: LifecycleControllerOptions = {}) {
    this.service = service;
    this.scheduler = new RefreshScheduler(() => this.service.refreshAll(), options.clock);
    this.appState = options.appState || AppState;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.subscription = this.appState.addEventListener("change", this.onStateChange);
    if (this.appState.currentState === "active") {
      void this.enterForeground();
    } else {
      this.service.abandonOperations();
    }
  }

  stop(): void {
    this.subscription?.remove();
    this.subscription = undefined;
    this.scheduler.stop();
    this.service.abandonOperations();
    this.started = false;
  }

  get refreshScheduler(): RefreshScheduler {
    return this.scheduler;
  }

  private readonly onStateChange = (next: AppStateStatus): void => {
    if (next === "active") {
      void this.enterForeground();
    } else {
      this.enterBackground();
    }
  };

  private async enterForeground(): Promise<void> {
    this.service.setForeground(true);
    // FR-003: immediate refresh begins before the periodic scheduler.
    const immediateRefresh = this.service.refreshAll();
    this.scheduler.start();
    await immediateRefresh;
    if (!this.service.isForeground) this.scheduler.stop();
  }

  private enterBackground(): void {
    this.scheduler.stop();
    this.service.abandonOperations();
  }
}
