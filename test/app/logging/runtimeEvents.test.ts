import { ApplicationService } from "../../../src/app/ApplicationService";
import { LifecycleController } from "../../../src/app/LifecycleController";
import { MonotonicClock } from "../../../src/app/refreshScheduler";
import { HueSnapshot } from "../../../src/app/types";
import { DEVELOPMENT_LOG_PREFIX } from "../../../src/app/developmentLogger";

const snapshot: HueSnapshot = {
  lights: {},
  groups: {},
  scenes: {},
  sensors: {},
  rules: {},
  schedules: {},
  resourcelinks: {},
};

const globalRecord = globalThis as unknown as { __DEV__?: unknown };

describe("active runtime development events", () => {
  let originalDev: unknown;
  let lines: string[];

  beforeEach(() => {
    originalDev = globalRecord.__DEV__;
    globalRecord.__DEV__ = true;
    lines = [];
    ["debug", "info", "warn", "error"].forEach((level) => {
      jest.spyOn(console, level as "debug").mockImplementation((line: unknown) => {
        if (typeof line === "string" && line.startsWith(DEVELOPMENT_LOG_PREFIX)) lines.push(line);
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalDev === undefined) delete globalRecord.__DEV__;
    else globalRecord.__DEV__ = originalDev;
  });

  function records(): Array<{ event: string; context?: Record<string, unknown> }> {
    return lines.map((line) => JSON.parse(line.slice(DEVELOPMENT_LOG_PREFIX.length)));
  }

  test("records operation success and terminal failure with safe cause context", async () => {
    const service = new ApplicationService({
      hue: {
        snapshot: async () => snapshot,
      },
    });

    await service.refreshHue();
    let events = records();
    expect(events.map((event) => event.event)).toEqual([
      "operation.started",
      "operation.completed",
      "hue.snapshot.published",
    ]);
    expect(events[1].context).toMatchObject({
      operation: "Hue snapshot",
      resultKind: "success",
    });
    expect(typeof events[1].context?.elapsedMs).toBe("number");
    expect(events[2].context).toEqual({
      groups: 0,
      lights: 0,
      resourcelinks: 0,
      rules: 0,
      scenes: 0,
      schedules: 0,
      sensors: 0,
    });

    const failed = new ApplicationService({
      hue: {
        snapshot: async () => {
          throw Object.assign(new Error("GET /api/SYNTHETIC_CREDENTIAL/lights"), {
            category: "NetworkUnavailable",
          });
        },
      },
    });
    lines = [];
    await failed.refreshHue();
    events = records();
    expect(events[1].context).toMatchObject({
      operation: "Hue snapshot",
      resultKind: "definite_failure",
      category: "NetworkUnavailable",
    });
    expect(JSON.stringify(events)).not.toContain("SYNTHETIC_CREDENTIAL");
    expect(events[1].context?.cause).toContain("<redacted>");
  });

  test("records a timeout exactly once", async () => {
    const service = new ApplicationService({
      deadlineMs: 5,
      hue: { snapshot: () => new Promise< HueSnapshot >(() => undefined) },
    });

    await service.refreshHue();

    expect(records().filter((event) => event.event === "operation.started")).toHaveLength(1);
    expect(records().filter((event) => event.event === "operation.completed")).toHaveLength(1);
    expect(records().find((event) => event.event === "operation.completed")?.context).toMatchObject({
      resultKind: "definite_failure",
      category: "Timeout",
    });
  });

  test("classifies an in-flight operation as abandoned after backgrounding", async () => {
    let resolveSnapshot: ((value: HueSnapshot) => void) | undefined;
    const service = new ApplicationService({
      hue: {
        snapshot: () => new Promise<HueSnapshot>((resolve) => { resolveSnapshot = resolve; }),
      },
    });

    const refresh = service.refreshHue();
    await Promise.resolve();
    service.abandonOperations();
    resolveSnapshot?.(snapshot);
    await refresh;

    expect(records().find((event) => event.event === "operation.completed")?.context).toMatchObject({
      resultKind: "abandoned",
      category: "Unknown",
    });
  });

  test("records diagnostic set, replacement, and recovery without duplicate map entries", () => {
    const service = new ApplicationService();
    service.setDiagnostic("hue:bridge", {
      category: "Timeout",
      operation: "Hue snapshot",
      resource: "bridge:192.168.1.2",
      detail: "timed out",
      message: "The bridge timed out.",
    });
    service.setDiagnostic("hue:bridge", {
      category: "NetworkUnavailable",
      operation: "Hue snapshot",
      resource: "bridge:192.168.1.2",
      detail: "offline",
      message: "The bridge is offline.",
    });
    service.clearDiagnostic("hue:bridge");
    service.clearDiagnostic("hue:bridge");

    expect(service.getDiagnostics().size).toBe(0);
    expect(records().map((event) => event.event)).toEqual([
      "diagnostic.set",
      "diagnostic.set",
      "diagnostic.cleared",
    ]);
    expect(records()[1].context).toMatchObject({
      key: "hue:bridge",
      transition: "replaced",
      category: "NetworkUnavailable",
    });
  });

  test("maps existing foreground lifecycle behavior to lifecycle events", async () => {
    const calls: string[] = [];
    const service = new ApplicationService({ hue: { snapshot: async () => { calls.push("refresh"); return snapshot; } } });
    let listener: ((state: string) => void) | undefined;
    const appState = {
      currentState: "active" as const,
      addEventListener: (_event: string, callback: (state: any) => void) => {
        listener = callback;
        return { remove: () => undefined };
      },
    };
    const clock: MonotonicClock = {
      now: () => 0,
      setInterval: () => 1,
      clearInterval: () => undefined,
    };
    const lifecycle = new LifecycleController(service, { appState, clock });

    lifecycle.start();
    await Promise.resolve();
    listener?.("background");
    listener?.("active");
    await Promise.resolve();
    lifecycle.stop();

    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(records().map((event) => event.event)).toEqual(expect.arrayContaining([
      "lifecycle.foreground",
      "lifecycle.background",
      "lifecycle.stopped",
    ]));
  });
});
