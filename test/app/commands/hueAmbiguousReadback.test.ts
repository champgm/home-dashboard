import { ApplicationService } from "../../../src/app/ApplicationService";
import { DeviceStateStore } from "../../../src/app/DeviceStateStore";
import { HueSnapshot } from "../../../src/app/types";

const emptySnapshot = (): HueSnapshot => ({ lights: {}, groups: {}, scenes: {}, sensors: {}, rules: {}, schedules: {}, resourcelinks: {} });

describe("Hue ambiguous write reconciliation", () => {
  test("applies changed-field-only Sensor configuration updates", async () => {
    const writes: Array<Record<string, unknown>> = [];
    const service = new ApplicationService({
      hue: {
        snapshot: async () => ({ ...emptySnapshot(), sensors: { "1": { id: "1", config: { on: true, duration: 45 } } } }),
        mutate: async (_kind, _id, _operation, payload) => { writes.push(payload); },
      },
      stateStore: new DeviceStateStore(),
    });
    service.stateStore.setKnown({ kind: "sensor", id: "1" }, { config: { on: true, duration: 30 } });
    expect((await service.mutateHue("sensor", "1", "config", { config: { on: true, duration: 45 } })).kind).toBe("success");
    expect(writes).toEqual([{ config: { duration: 45 } }]);
    expect((await service.mutateHue("sensor", "1", "config", { config: { on: true, duration: 45 } })).kind).toBe("success");
    expect(writes).toHaveLength(1);
  });

  test("performs one read-back and reconciles a matching observable Light state", async () => {
    const reads: string[] = [];
    const snapshot = jest.fn(async () => ({ ...emptySnapshot(), lights: { "1": { id: "1", state: { on: true } } } }));
    const service = new ApplicationService({
      hue: {
        snapshot,
        setLightState: async () => { throw Object.assign(new Error("timed out after dispatch"), { category: "Ambiguous" }); },
        getResource: async (_kind, id) => { reads.push(id); return { id, state: { on: true } }; },
      },
      stateStore: new DeviceStateStore(),
    });
    service.stateStore.setKnown({ kind: "light", id: "1" }, { state: { on: false } });
    const result = await service.performPrimary({ kind: "light", id: "1" });
    expect(result.kind).toBe("success");
    expect(reads).toEqual(["1"]);
    expect(snapshot).toHaveBeenCalledTimes(1);
    expect(service.stateStore.getValue<{ state: { on: boolean } }>({ kind: "light", id: "1" })?.state.on).toBe(true);
  });

  test("keeps a nonmatching read-back ambiguous and never retries the write", async () => {
    let writes = 0;
    let reads = 0;
    const snapshot = jest.fn(async () => emptySnapshot());
    const service = new ApplicationService({
      hue: {
        snapshot,
        setGroupAction: async () => { writes += 1; throw Object.assign(new Error("lost response"), { category: "Ambiguous" }); },
        getResource: async () => { reads += 1; return { id: "1", action: { on: false } }; },
      },
      stateStore: new DeviceStateStore(),
    });
    service.stateStore.setKnown({ kind: "group", id: "1" }, { state: { any_on: false, all_on: false } });
    const result = await service.performPrimary({ kind: "group", id: "1" });
    expect(result.kind).toBe("ambiguous");
    expect(writes).toBe(1);
    expect(reads).toBe(1);
    expect(snapshot).toHaveBeenCalledTimes(1);
  });

  test("abandons before read-back when the app backgrounds", async () => {
    let resolveWrite: (() => void) | undefined;
    let reads = 0;
    const service = new ApplicationService({
      hue: {
        snapshot: async () => emptySnapshot(),
        setLightState: async () => new Promise<void>((resolve) => { resolveWrite = resolve; }),
        getResource: async () => { reads += 1; return { state: { on: true } }; },
      },
      stateStore: new DeviceStateStore(),
      deadlineMs: 1000,
    });
    service.stateStore.setKnown({ kind: "light", id: "1" }, { state: { on: false } });
    const pending = service.performPrimary({ kind: "light", id: "1" });
    service.setForeground(false);
    resolveWrite?.();
    expect((await pending).kind).toBe("abandoned");
    expect(reads).toBe(0);
  });

  test("keeps the mutation gate closed until the post-write refresh completes", async () => {
    let releaseSnapshot: ((snapshot: HueSnapshot) => void) | undefined;
    let notifySnapshotStarted: (() => void) | undefined;
    const snapshotStarted = new Promise<void>((resolve) => { notifySnapshotStarted = resolve; });
    let snapshotCalls = 0;
    const snapshot = jest.fn(() => {
      snapshotCalls += 1;
      notifySnapshotStarted?.();
      if (snapshotCalls === 1) return new Promise<HueSnapshot>((resolve) => { releaseSnapshot = resolve; });
      return Promise.resolve({ ...emptySnapshot(), lights: { "1": { state: { on: true } } } });
    });
    const writes = jest.fn(async () => undefined);
    const service = new ApplicationService({
      hue: { snapshot, setLightState: writes },
      stateStore: new DeviceStateStore(),
    });
    service.stateStore.setKnown({ kind: "light", id: "1" }, { state: { on: false } });

    const first = service.performPrimary({ kind: "light", id: "1" });
    await snapshotStarted;
    expect(snapshot).toHaveBeenCalledTimes(1);

    const second = await service.setAbsolute({ kind: "light", id: "1" }, true);
    expect(second.kind).toBe("definite_failure");
    expect(second.diagnostic?.category).toBe("Busy");
    expect(writes).toHaveBeenCalledTimes(1);

    releaseSnapshot?.({ ...emptySnapshot(), lights: { "1": { state: { on: true } } } });
    expect((await first).kind).toBe("success");
    expect((await service.setAbsolute({ kind: "light", id: "1" }, false)).kind).toBe("success");
    expect(writes).toHaveBeenCalledTimes(2);
  });
});
