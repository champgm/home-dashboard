import { ApplicationService } from "../../../src/app/ApplicationService";
import { LifecycleController } from "../../../src/app/LifecycleController";
import { MonotonicClock } from "../../../src/app/refreshScheduler";
import { HueSnapshot } from "../../../src/app/types";

const snapshot: HueSnapshot = { lights: {}, groups: {}, scenes: {}, sensors: {}, rules: {}, schedules: {}, resourcelinks: {} };

describe("foreground lifecycle", () => {
  test("background abandons and active refreshes immediately", async () => {
    const calls: string[] = [];
    const service = new ApplicationService({ hue: { snapshot: async () => { calls.push("refresh"); return snapshot; } } });
    let listener: ((state: any) => void) | undefined;
    const appState = { currentState: "active" as any, addEventListener: (_event: string, callback: (state: any) => void) => { listener = callback; return { remove: () => undefined }; } };
    const clock: MonotonicClock = { now: () => 0, setInterval: () => 1, clearInterval: () => undefined };
    const lifecycle = new LifecycleController(service, { appState, clock });
    lifecycle.start();
    await Promise.resolve();
    expect(calls).toContain("refresh");
    listener?.("background");
    expect(service.isForeground).toBe(false);
    listener?.("active");
    await Promise.resolve();
    expect(service.isForeground).toBe(true);
  });
});
